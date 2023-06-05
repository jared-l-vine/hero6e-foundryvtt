// import { HeroSystem6eCard } from "./card.js";
import { modifyRollEquation, getTokenChar } from "../utility/util.js"
import { determineDefense } from "../utility/defense.js";
import { HeroSystem6eActorActiveEffects } from "../actor/actor-active-effects.js"

export async function chatListeners(html) {
    // Called by carrd-helpers.js
    html.on('click', 'button.roll-damage', this._onRollDamage.bind(this));
    html.on('click', 'button.apply-damage', this._onApplyDamage.bind(this));
}



/// Dialog box for AttackOptions
export async function AttackOptions(item) {
    const data = {
        item: item,
        state: null,
        str: item.actor.system.characteristics.str.value
    }

    // Uses Tk
    let tkItems = item.actor.items.filter(o => o.system.rules == "TELEKINESIS");
    let tkStr = 0
    for (const item of tkItems) {
        tkStr += parseInt(item.system.LEVELS) || 0
    }
    if (item.system.usesTk) {
        if (item.system.usesStrength) {
            data.str += tkStr
        } else {
            data.str = tkStr
        }
    }

    if (game.settings.get("hero6efoundryvttv2", "hit locations")) {
        data.useHitLoc = true;
        data.hitLoc = CONFIG.HERO.hitLocations;
    }

    const template = "systems/hero6efoundryvttv2/templates/attack/item-attack-card2.hbs"
    const html = await renderTemplate(template, data)
    return new Promise(resolve => {
        const data = {
            title: item.actor.name + " roll to hit",
            content: html,
            buttons: {
                normal: {
                    label: "Roll to Hit",
                    callback: html => resolve(_processAttackOptions(item, html[0].querySelector("form")))
                },
                // cancel: {
                //   label: "cancel",
                //   callback: html => resolve({canclled: true})
                // }
            },
            default: "normal",
            close: () => resolve({ cancelled: true })
        }
        new Dialog(data, null).render(true)
    });

}

async function _processAttackOptions(item, form) {
    // convert form data into json object
    const formData = new FormData(form)
    let options = {}
    for (const [key, value] of formData) {
        options[key] = value
    }

    await AttackToHit(item, options)
}


/// ChatMessage showing Attack To Hit
export async function AttackToHit(item, options) {
    const template = "systems/hero6efoundryvttv2/templates/chat/item-toHit-card.hbs"

    const actor = item.actor
    const itemId = item._id
    const itemData = item.system;
    let tags = []

    const hitCharacteristic = actor.system.characteristics[itemData.uses].value;

    let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];


    let automation = game.settings.get("hero6efoundryvttv2", "automation");

    // -------------------------------------------------
    // attack roll
    // -------------------------------------------------
    let rollEquation = "11 + " + hitCharacteristic;
    tags.push({ value: hitCharacteristic, name: itemData.uses })

    item.system.ocv = parseInt(item.system.ocv) || 0
    if (parseInt(item.system.ocv) != 0) {

        rollEquation = modifyRollEquation(rollEquation, item.system.ocv);
        tags.push({ value: item.system.ocv, name: item.name })
    }

    // if (parseInt(options.toHitMod) > 0) {
    //     rollEquation = modifyRollEquation(rollEquation, options.toHitMod);
    //     tags.push({ value: options.toHitMod, name: "toHitMod" })
    // }

    let noHitLocationsPower = false;
    if (game.settings.get("hero6efoundryvttv2", "hit locations") && options.aim !== "none" && !noHitLocationsPower) {
        rollEquation = modifyRollEquation(rollEquation, CONFIG.HERO.hitLocations[options.aim][3]);
        tags.push({ value: CONFIG.HERO.hitLocations[options.aim][3], name: options.aim, hidePlus: CONFIG.HERO.hitLocations[options.aim][3] < 0 })
    }
    rollEquation = rollEquation + " - 3D6";

    let attackRoll = new Roll(rollEquation, actor.getRollData());
    let result = await attackRoll.evaluate({ async: true });
    let renderedResult = await result.render();

    let hitRollData = result.total;
    let hitRollText = "Hits a " + toHitChar + " of " + hitRollData;
    // -------------------------------------------------



    // Endurance
    //let strEnd = Math.max(1, Math.round(str / 10))
    //item.system.endEstimate += strEnd

    let useEnd = false;
    let enduranceText = "";
    if (game.settings.get("hero6efoundryvttv2", "use endurance")) {
        useEnd = true;
        let valueEnd = actor.system.characteristics.end.value
        let itemEnd = item.system.end;
        let newEnd = valueEnd - itemEnd;
        let spentEnd = itemEnd;

        if (itemData.usesStrength || itemData.usesTk) {
            // let strEnd = Math.max(1, Math.round(actor.system.characteristics.str.value / 10))
            // if (options.effectivestr <= actor.system.characteristics.str.value) {
            //     strEnd = Math.round(options.effectivestr / 10);
            // }
            let strEnd = Math.max(1, Math.round(options.effectivestr / 10));
            item.system.endEstimate += strEnd

            newEnd = parseInt(newEnd) - parseInt(strEnd);
            spentEnd = parseInt(spentEnd) + parseInt(strEnd);
        }

        if (newEnd < 0) {
            enduranceText = 'Spent ' + valueEnd + ' END and ' + Math.abs(newEnd) + ' STUN';
        } else {
            enduranceText = 'Spent ' + spentEnd + ' END';
        }



        // none: "No Automation",
        // npcOnly: "NPCs Only (end, stun, body)",
        // pcEndOnly: "PCs (end) and NPCs (end, stun, body)",
        // all: "PCs and NPCs (end, stun, body)"
        if ((automation === "all") || (automation === "npcOnly" && actor.type == 'npc') || (automation === "pcEndOnly" && actor.type === 'pc')) {
            let changes = {};
            if (newEnd < 0) {
                changes = {
                    "system.characteristics.end.value": 0,
                    "system.characteristics.stun.value": parseInt(actor.system.characteristics.stun.value) + parseInt(newEnd),
                }
            } else {
                changes = {
                    "system.characteristics.end.value": newEnd,
                }
            }
            await actor.update(changes);
        }
    }

    let targetData = []
    let targetIds = []
    for (let target of Array.from(game.user.targets)) {
        let hit = "Miss"
        let value = target.actor.system.characteristics[toHitChar.toLowerCase()].value
        if (value <= result.total) {
            hit = "Hit"
        }
        let by = result.total - value
        if (by >= 0) {
            by = "+" + by;
        }
        targetData.push({ id: target.id, name: target.name, toHitChar: toHitChar, value: value, result: { hit: hit, by: by.toString() } })

        // Keep track of which tokens were hit so we can apply damage later
        if (hit === "Hit") {
            targetIds.push(target.id)
        }

    }

    let cardData = {
        // dice rolls
        //rolls: [attackRoll],
        renderedHitRoll: renderedResult,
        hitRollText: hitRollText,
        hitRollValue: result.total,

        // data for damage card
        actor,
        item,
        ...options,
        hitRollData: hitRollData,
        //effectivestr: options.effectivestr,
        targetData: targetData,
        targetIds: targetIds,

        // endurance
        useEnd: useEnd,
        enduranceText: enduranceText,

        // misc
        tags: tags,

    };

    // render card
    let cardHtml = await renderTemplate(template, cardData) 

    let token = actor.token;

    let speaker = ChatMessage.getSpeaker({ actor: actor, token })
    speaker["alias"] = actor.name;

    const chatData = {
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: result,
        user: game.user._id,
        content: cardHtml,
        speaker: speaker,
    }


    return ChatMessage.create(chatData)
}

// Event handler for when the Roll Damage button is 
// clicked on item-attack-card2.hbs
// Notice the chatListeners function in this file.
export async function _onRollDamage(event) {
    const button = event.currentTarget;
    button.blur()  // The button remains hilighed for some reason; kluge to fix.
    const toHitData = { ...button.dataset }
    const item = fromUuidSync(toHitData.itemid);
    const template = "systems/hero6efoundryvttv2/templates/chat/item-damage-card.hbs"
    const actor = item.actor
    const itemId = item._id
    const itemData = item.system;

    let damageRoll = itemData.dice;

    // let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];

    // let automation = game.settings.get("hero6efoundryvttv2", "automation");

    let tags = []
    if (parseInt(itemData.dice) > 0) {
        tags.push({ value: itemData.dice + "d6", name: "base" })
    }

    let pip = 0;

    if (itemData.usesStrength || itemData.usesTk) {

        let strDamage = 0;
        strDamage += Math.floor(Math.max(0, parseInt(toHitData.effectivestr)) / 5)
        if (strDamage > 0) {
            if (itemData.killing) {
                let strDice = Math.floor(strDamage / 3)
                pip = strDamage % 3
                damageRoll = parseInt(damageRoll) + parseInt(strDice)
                let strTag = "";
                if (strDice > 0) {
                    strTag = strDice + "d6"
                }

                switch (pip) {
                    case 1:
                        strTag += "+1"
                        break
                    case 2:
                        strTag += "+½"
                        break
                }
                if (strTag != "") {
                    tags.push({ value: strTag.replace(/^\+/, ""), name: "strength" })
                }

            } else {
                damageRoll = parseInt(damageRoll) + parseInt(strDamage)
                tags.push({ value: strDamage + "d6", name: "strength" })
            }

        }
    }


    damageRoll = damageRoll < 0 ? 0 : damageRoll;

    // needed to split this into two parts for damage negation
    switch (itemData.extraDice) {
        case 'zero':
            pip += 0;
            break;
        case 'pip':
            pip += 1;
            tags.push({ value: "1", name: "extraDice" })
            break;
        case 'half':
            pip += 2;
            tags.push({ value: "1d6", name: "extraDice" })
            break;
    }

    // There is a killing attack edge case where Strengh pips + extraDice pips can
    // sum up to be a full dice.
    if (pip > 2) {
        damageRoll++
        pip -= 3
    }

    if (pip < 0) {
        damageRoll = "0D6";
    } else {
        switch (pip) {
            case 0:
                damageRoll += "D6";
                break;
            case 1:
                damageRoll += "D6+1";
                break;
            case 2:
                damageRoll += "D6+1D3"
                break;
        }
    }

    // damageRoll = modifyRollEquation(damageRoll, toHitData.damagemod);
    // if (parseInt(toHitData.damagemod) !=0)
    // {
    //   tags.push({value: toHitData.damagemod, name: "misc" })
    // }

    let roll = new Roll(damageRoll, actor.getRollData());
    let damageResult = await roll.roll({ async: true });
    let damageRenderedResult = await damageResult.render();

    const damageDetail = await _calcDamage(damageResult, item, toHitData)

    // Apply Damage button for specific targets
    let targetTokens = []
    for (const id of toHitData.targetids.split(',')) {
        let token = canvas.scene.tokens.get(id)
        if (token) {
            targetTokens.push(token)
        }
    }

    // If there is only 1 target then get rid of targetIds (which is used for Apply Damage ALL)
    if (targetTokens.length <= 1) {
        delete toHitData.targetids;
    }


    let cardData = {
        item: item,
        // dice rolls
        renderedDamageRoll: damageRenderedResult,
        renderedStunMultiplierRoll: damageDetail.renderedStunMultiplierRoll,

        // hit locations
        useHitLoc: damageDetail.useHitLoc,
        hitLocText: damageDetail.hitLocText,

        // body
        bodyDamage: damageDetail.bodyDamage,
        bodyDamageEffective: damageDetail.body,
        countedBody: damageDetail.countedBody,

        // stun
        stunDamage: damageDetail.stunDamage,
        stunDamageEffective: damageDetail.stun,
        hasRenderedDamageRoll: true,
        stunMultiplier: damageDetail.stunMultiplier,
        hasStunMultiplierRoll: damageDetail.hasStunMultiplierRoll,
        terms: JSON.stringify(damageResult.terms),

        // misc
        targetIds: toHitData.targetids,
        tags: tags,
        targetTokens: targetTokens,


    };

    // render card
    let cardHtml = await renderTemplate(template, cardData) //await HeroSystem6eDamageCard2._renderInternal(actor, item, null, cardData);

    let speaker = ChatMessage.getSpeaker({ actor: item.actor })


    const chatData = {
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: damageResult,

        user: game.user._id,
        content: cardHtml,
        speaker: speaker,
    }

    return ChatMessage.create(chatData);
}


// Event handler for when the Apply Damage button is 
// clicked on item-damage-card.hbs
// Notice the chatListeners function in this file.
export async function _onApplyDamage(event) {

    const button = event.currentTarget;
    button.blur()  // The button remains hilighed for some reason; kluge to fix.
    const toHitData = { ...button.dataset }

    // Single target
    if (toHitData.targetTokenId) {
        return _onApplyDamageToSpecificToken(event, toHitData.targetTokenId)
    }

    // All targets
    if (toHitData.targetIds) {
        for (const id of toHitData.targetIds.split(',')) {
            _onApplyDamageToSpecificToken(event, id)
        }
        return
    }

    // Check to make sure we have a selected token
    if (canvas.tokens.controlled.length == 0) {
        return ui.notifications.warn(`You must select at least one token before applying damage.`);
    }

    for (let token of canvas.tokens.controlled) {
        _onApplyDamageToSpecificToken(event, token.id)
    }

}

export async function _onApplyDamageToSpecificToken(event, tokenId) {
    const button = event.currentTarget;
    const damageData = { ...button.dataset }
    const item = fromUuidSync(damageData.itemid)
    const template = "systems/hero6efoundryvttv2/templates/chat/apply-damage-card.hbs"
    const actor = item.actor
    const itemId = item._id
    const itemData = item.system;

    const token = canvas.tokens.get(tokenId)

    if (!token) {
        return ui.notifications.warn(`You must select at least one token before applying damage.`);
    }



    //let tags = []
    //let dice = damageData.dice.split(",")

    // Spoof previous roll (foundry won't process a generic term, needs to be a proper Die instance)
    let newTerms = JSON.parse(damageData.terms);
    for (let idx in newTerms) {
        let term = newTerms[idx]
        switch (term.class) {
            case "Die":
                newTerms[idx] = Object.assign(new Die(), term)
                break
            case "OperatorTerm":
                newTerms[idx] = Object.assign(new OperatorTerm(), term)
                break
            case "NumericTerm":
                newTerms[idx] = Object.assign(new NumericTerm(), term)
                break
        }
    }
    const newRoll = Roll.fromTerms(newTerms)

    let automation = game.settings.get("hero6efoundryvttv2", "automation");

    // -------------------------------------------------
    // determine active defenses
    // -------------------------------------------------
    let defense = "";
    console.log(defense)
    let [defenseValue, resistantValue, impenetrableValue, damageReductionValue, damageNegationValue, knockbackResistance, defenseTags] = determineDefense(token.actor, item)
    if (damageNegationValue > 0) {
        defense += "Damage Negation " + damageNegationValue + "DC(s); "
    }

    defense = defense + defenseValue + " normal; " + resistantValue + " resistant";

    if (damageReductionValue > 0) {
        defense += "; damage reduction " + damageReductionValue + "%";
    }

    damageData.defenseValue = defenseValue
    damageData.resistantValue = resistantValue
    damageData.impenetrableValue = impenetrableValue
    damageData.damageReductionValue = damageReductionValue
    damageData.damageNegationValue = damageNegationValue
    damageData.knockbackResistance = knockbackResistance


    // We need to recalcuate damage to account for possible Damage Negation
    const damageDetail = await _calcDamage(newRoll, item, damageData)


    // check if target is stunned
    if (game.settings.get("hero6efoundryvttv2", "stunned")) {
        // determine if target was Stunned
        if (damageDetail.stun > token.actor.system.characteristics.con.value) {

            damageDetail.effects = damageDetail.effects + "inflicts Stunned; "

            // none: "No Automation",
            // npcOnly: "NPCs Only (end, stun, body)",
            // pcEndOnly: "PCs (end) and NPCs (end, stun, body)",
            // all: "PCs and NPCs (end, stun, body)"
            if ((automation === "all") || (automation === "npcOnly" && token.actor.type === 'npc')) {
                token.actor.addActiveEffect(HeroSystem6eActorActiveEffects.stunEffect)
            }
        }
    }


    let damageRenderedResult = await newRoll.render()

    // Attack may have additional effects, such as those from martial arts
    let effectsFinal = deepClone(damageDetail.effects)
    if (item.system.effect) {
        for (const effect of item.system.effect.split(',')) {

            // Do not include [NORMALDC] strike and similar
            if (effect.indexOf("[") == -1 && !effect.match(/strike/i)) {
                effectsFinal += effect
            }
        }
    }


    let cardData = {
        item: item,
        // dice rolls
        renderedDamageRoll: damageRenderedResult,
        renderedStunMultiplierRoll: damageDetail.renderedStunMultiplierRoll,

        // body
        bodyDamage: damageDetail.bodyDamage,
        bodyDamageEffective: damageDetail.body,
        countedBody: damageDetail.countedBody,

        // stun
        stunDamage: damageDetail.stunDamage,
        stunDamageEffective: damageDetail.stun,
        hasRenderedDamageRoll: true,
        stunMultiplier: damageDetail.stunMultiplier,
        hasStunMultiplierRoll: damageDetail.hasStunMultiplierRoll,

        // effects
        effects: effectsFinal,

        // defense
        defense: defense,
        damageNegationValue: damageNegationValue,

        // knockback
        knockbackMessage: damageDetail.knockbackMessage,
        useKnockBack: damageDetail.useKnockBack,
        knockbackRenderedResult: damageDetail.knockbackRenderedResult,

        // misc
        tags: defenseTags,
        targetToken: token
    };


    // render card
    let cardHtml = await renderTemplate(template, cardData)
    let speaker = ChatMessage.getSpeaker({ actor: item.actor })

    const chatData = {
        user: game.user._id,
        content: cardHtml,
        speaker: speaker,
    }

    // none: "No Automation",
    // npcOnly: "NPCs Only (end, stun, body)",
    // pcEndOnly: "PCs (end) and NPCs (end, stun, body)",
    // all: "PCs and NPCs (end, stun, body)"
    if ((automation === "all") || (automation === "npcOnly" && token.actor.type === 'npc')) {
        let changes = {
            "system.characteristics.stun.value": token.actor.system.characteristics.stun.value - damageDetail.stun,
            "system.characteristics.body.value": token.actor.system.characteristics.body.value - damageDetail.body,
        }
        await token.actor.update(changes);
    }

    return ChatMessage.create(chatData);

}


async function _calcDamage(damageResult, item, options) {
    let damageDetail = {}
    const itemData = item.system
    let body = 0;
    let stun = 0;
    let countedBody = 0;

    let pip = 0

    // Damage Negation
    if (options?.damageNegationValue > 0) {
        let fullDiceDr = options.damageNegationValue
        let pipDr = 0
        if (itemData.killing) {
            fullDiceDr = Math.floor(options.damageNegationValue / 3)
            pipDr = options.damageNegationValue % 3
        }

        // Remove full dice
        for (let i = 0; i < fullDiceDr; i++) {
            // terms[0] are the full d6 dice
            if (damageResult.terms[0].results.length > 0) {
                // remove 1st dice
                damageResult.terms[0].results = damageResult.terms[0].results.slice(1)
            }
            else {
                pipDr += 3
            }
        }

        // Remove pipDr
        for (let i = 0; i < pipDr; i++) {
            // full dice are at terms[0]
            // plus operator is terms[1]
            // pips are at terms [2]

            // Convert full dice to a pip
            if (damageResult.terms[0].results.length > 0 && damageResult.terms.length == 1) {
                let _fullDice = damageResult.terms[0].results[0]
                _fullDice.results = Math.ceil(_fullDice.result / 2) // convert to half dice (2 pips)
                damageResult.terms[0].results = damageResult.terms[0].results.slice(1)
                damageResult.terms.push(new OperatorTerm({ operator: "+" }));
                let _halfDie = new Die({ number: _fullDice.results, faces: 3 })
                damageResult.terms.push(_halfDie)
                continue
            }

            // Convert half dice to +1
            if (damageResult.terms.length == 3 && damageResult.terms[2] instanceof Die) {
                damageResult.terms[2] = new NumericTerm({ number: 1 });
                continue
            }

            console.warn("Uhandled Damage Negation")
        }
    }

    // We may have spoofed a roll, so total is missing.
    if (!damageResult.total) {
        damageResult._total = 0

        for (let term of damageResult.terms) {
            if (term instanceof OperatorTerm) continue;
            if (term instanceof Die) {
                for (let result of term.results) {
                    damageResult._total += result.result
                }
                continue
            }
            if (term instanceof NumericTerm) {
                damageResult._total += term.number
            }
        }

        damageResult._formula = damageResult.terms[0].results.length + "d6"
        if (damageResult.terms[1]) {
            damageResult._formula += " + "

            if (damageResult.terms[2] instanceof Die) {
                damageResult._formula += damageResult.terms[2].results[0].rersults += "1d3"
            }

            if (damageResult.terms[2] instanceof NumericTerm) {
                damageResult._formula += damageResult.terms[2].number
            }


        }


        damageResult._evaluated = true
    }

    let hasStunMultiplierRoll = false;
    let renderedStunMultiplierRoll = null;
    let stunMultiplier = 1;
    let noHitLocationsPower = false


    // Penetrating
    let penetratingBody = 0
    if (item.system.penetrating) {
        for (let die of damageResult.terms[0].results) {
            switch (die.result) {
                case 1:
                    penetratingBody += 0;
                    break;
                case 6:
                    penetratingBody += 2;
                    break;
                default:
                    penetratingBody += 1;
                    break;
            }
        }
    }
    penetratingBody = Math.max(0, penetratingBody - options.impenetrableValue)


    if (itemData.killing) {
        // Killing Attack
        hasStunMultiplierRoll = true;
        body = damageResult.total;
        let hitLocationModifiers = [1, 1, 1, 0];

        // 6E uses 1d3 stun multiplier
        let stunRoll = new Roll("1D3", item.actor.getRollData());

        // 5E uses 1d6-1 for stun multiplier
        if (item.actor.system.is5e) {
            stunRoll = new Roll("max(1D6-1,1)", item.actor.getRollData());
        }

        let stunResult = await stunRoll.roll({ async: true });
        let renderedStunResult = await stunResult.render();
        damageDetail.renderedStunMultiplierRoll = renderedStunResult;

        if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
            stunMultiplier = hitLocationModifiers[0];
        } else {
            stunMultiplier = stunResult.total;
        }

        if (options.stunmultiplier) {
            stunMultiplier = options.stunmultiplier
        }

        stun = body * stunMultiplier;

        damageDetail.renderedStunResult = renderedStunResult
    }
    else {
        // Normal Attack
        // counts body damage for non-killing attack
        for (let die of damageResult.terms[0].results) {
            switch (die.result) {
                case 1:
                    countedBody += 0;
                    break;
                case 6:
                    countedBody += 2;
                    break;
                default:
                    countedBody += 1;
                    break;
            }
        }

        stun = damageResult.total;
        body = countedBody;
    }




    let bodyDamage = body;
    let stunDamage = stun;

    let effects = "";
    if (item.system.effects) {
        effects = item.system.effects + ";"
    }

    // -------------------------------------------------
    // determine effective damage
    // -------------------------------------------------

    if (itemData.killing) {
        stun = stun - (options.defenseValue || 0) - (options.resistantValue || 0);
        body = body - (options.resistantValue || 0);
    } else {
        stun = stun - (options.defenseValue || 0) - (options.resistantValue || 0);
        body = body - (options.defenseValue || 0) - (options.resistantValue || 0);
    }

    stun = stun < 0 ? 0 : stun;
    body = body < 0 ? 0 : body;

    // get hit location
    let hitLocationModifiers = [1, 1, 1, 0];
    let hitLocation = "None";
    let useHitLoc = false;
    //let noHitLocationsPower = false;
    if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
        useHitLoc = true;

        hitLocation = options.aim;
        if (options.aim === 'none' || !options.aim) {
            let locationRoll = new Roll("3D6")
            let locationResult = await locationRoll.roll({ async: true });
            hitLocation = CONFIG.HERO.hitLocationsToHit[locationResult.total];
        }

        hitLocationModifiers = CONFIG.HERO.hitLocations[hitLocation];

        if (game.settings.get("hero6efoundryvttv2", "hitLocTracking") === "all") {
            let sidedLocations = ["Hand", "Shoulder", "Arm", "Thigh", "Leg", "Foot"]
            if (sidedLocations.includes(hitLocation)) {
                let sideRoll = new Roll("1D2", actor.getRollData());
                let sideResult = await sideRoll.roll();

                if (sideResult.result === 1) {
                    hitLocation = "Left " + hitLocation;
                } else {
                    hitLocation = "Right " + hitLocation;
                }
            }
        }
    }

    let hitLocText = "";
    if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
        if (itemData.killing) {
            // killing attacks apply hit location multiplier after resistant damage protection has been subtracted
            body = body * hitLocationModifiers[2];

            hitLocText = "Hit " + hitLocation + " (x" + hitLocationModifiers[0] + " STUN x" + hitLocationModifiers[2] + " BODY)";
        } else {
            // stun attacks apply N STUN hit location multiplier after defenses
            stun = stun * hitLocationModifiers[1];
            body = body * hitLocationModifiers[2];

            hitLocText = "Hit " + hitLocation + " (x" + hitLocationModifiers[1] + " STUN x" + hitLocationModifiers[2] + " BODY)";
        }

        hasStunMultiplierRoll = false;
    }

    // determine knockback
    let useKnockBack = false;
    let knockbackMessage = "";
    let knockbackRenderedResult = null;
    let knockbackMultiplier = parseInt(itemData.knockbackMultiplier)
    if (game.settings.get("hero6efoundryvttv2", "knockback") && knockbackMultiplier) {
        useKnockBack = true;
        // body - 2d6 m

        let knockBackEquation = body + (knockbackMultiplier > 1 ? "*" + knockbackMultiplier : "") + " - 2D6"
        // knockback modifier added on an attack by attack basis
        if (options.knockbackMod != 0) {
            knockBackEquation = modifyRollEquation(knockBackEquation, (options.knockbackMod || 0) + "D6");
        }
        // knockback resistance effect
        knockBackEquation = modifyRollEquation(knockBackEquation, " -" + (options.knockbackResistance || 0));

        let knockbackRoll = new Roll(knockBackEquation);
        let knockbackResult = await knockbackRoll.roll({ async: true });
        knockbackRenderedResult = await knockbackResult.render();
        let knockbackResultTotal = Math.round(knockbackResult.total);

        if (knockbackResultTotal < 0) {
            knockbackMessage = "No knockback";
        } else if (knockbackResultTotal == 0) {
            knockbackMessage = "inflicts Knockdown";
        } else {
            // If the result is positive, the target is Knocked Back 2m times the result
            knockbackMessage = "Knocked back " + (knockbackResultTotal * 2) + "m";
        }
    }


    // apply damage reduction
    if (options.damageReductionValue > 0) {
        //defense += "; damage reduction " + options.damageReductionValue + "%";
        stun = Math.round(stun * (1 - (options.damageReductionValue / 100)));
        body = Math.round(body * (1 - (options.damageReductionValue / 100)));
    }

    // minimum damage rule
    if (stun < body) {
        stun = body;
        effects += "minimum damage invoked; "
    }

    // The body of a penetrating attack is the minimum damage
    if (penetratingBody > body) {
        if (itemData.killing) {
            body = penetratingBody;
            stun = body * stunMultiplier;
        }
        else {
            stun = penetratingBody;
        }
        effects += "penetrating damage; "
    }

    // StunOnly?
    if (item.system.stunBodyDamage === "stunonly") {
        body = 0;
    }

    // BodyOnly?
    if (item.system.stunBodyDamage === "bodyonly") {
        stun = 0;
    }

    // EffectOnly?
    if (item.system.stunBodyDamage === "effectonly") {
        stun = 0;
        body = 0;
    }

    stun = Math.round(stun)
    body = Math.round(body)





    damageDetail.body = body
    damageDetail.stun = stun
    damageDetail.effects = effects
    damageDetail.stunDamage = stunDamage
    damageDetail.bodyDamage = bodyDamage
    damageDetail.stunMultiplier = stunMultiplier
    damageDetail.hasStunMultiplierRoll = hasStunMultiplierRoll
    damageDetail.useHitLoc = useHitLoc
    damageDetail.hitLocText = hitLocText

    damageDetail.knockbackMessage = knockbackMessage
    damageDetail.useKnockBack = useKnockBack
    damageDetail.knockbackRenderedResult = knockbackRenderedResult


    return damageDetail
}