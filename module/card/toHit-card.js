import { HeroSystem6eActorActiveEffects } from "../actor/actor-active-effects.js";
import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eCard } from "./card.js";
import { modifyRollEquation, getTokenChar } from "../utility/util.js"

export class HeroSystem6eToHitCard extends HeroSystem6eCard {
    static chatListeners(html) {
        html.on('click', '.toHit-card .card-buttons button', this._onChatCardAction.bind(this));
    }

    static onMessageRendered(html) {
        html.find('.tohit-card .card-buttons button').each((i, button) => {
            if (button.getAttribute('data-action') != 'apply-defenses') {
                HeroSystem6eToHitCard.setCardStateAsync(button);
            }
            button.style.display = "block";
        });
    }

    static async setCardStateAsync(button) {
        const card = button.closest(".chat-card");

        let actor = await this._getChatCardActor(card);

        if (!actor) return;

        if (!actor.isOwner) {
            button.setAttribute("disabled", true);
        }
    }

    /**
   * Handle execution of a chat card action via a click event on one of the card buttons
   * @param {Event} event       The originating click event
   * @returns {Promise}         A promise which resolves once the handler workflow is complete
   * @private
   */
    static async _onChatCardAction(event) {
        event.preventDefault();

        // may be able to remove this, leaving it for now

        // Extract card data
        const button = event.currentTarget;

        const action = button.dataset.action;
        button.disabled = true;

        const card = button.closest(".chat-card");
        const cardObject = new HeroSystem6eToHitCard();
        await cardObject.init(card);

        cardObject.message.data.flags["state"] = {};

        // Validate permission to proceed with the roll
        const isValid = action === "apply-defenses";
        if (!(isValid || game.user.isGM || cardObject.message.isAuthor)) return;

        const targets = HeroSystem6eCard._getChatCardTargets();

        // Handle different actions
        switch (action) {
            case "damage-roll":
                //await cardObject.makeDamageRoll();
                break;
        }

        // Re-enable the button
        button.disabled = false;
    }

    static async _renderInternal(item, actor, target, stateData) {
        const token = actor.token;

        const templateData = {
            actor: actor.data,
            tokenId: token?.uuid || null,
            item: item.data,
            state: stateData,
            //target: target.data,
            //targetTokenId: targetToken?.uuid || null,
        };

        var path = "systems/hero6e-foundryvtt-experimental/templates/chat/item-toHit-card.html";

        return await renderTemplate(path, templateData);
    }

    async render() {
        return await HeroSystem6eToHitCard._renderInternal(this.item, this.actor, this.target, this.message.data.flags["state"]);
    }

    async init(card) {
        super.init(card);
        this.target = await HeroSystem6eToHitCard._getChatCardTarget(card);
    }

    static async _getChatCardTarget(card) {
        // Case 1 - a synthetic actor from a Token
        if (card.dataset.targetTokenId) {
            const token = await fromUuid(card.dataset.targetTokenId);
            if (!token) return null;
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const targetId = card.dataset.targetId;
        return game.actors.get(targetId) || null;
    }

    static async createFromAttackCard(target, item, data, actor) {
        let targetActor = target.document._actor;
        let targetActorChars = targetActor.data.data.characteristics;

        let itemData = item.data.data;
        let damageRoll = itemData.dice;
        let hitCharacteristic = actor.data.data.characteristics[itemData.uses].value;
        let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];

        let automation = game.settings.get("hero6e-foundryvtt-experimental", "automation");

        // -------------------------------------------------
        // attack roll
        // -------------------------------------------------

        let rollEquation = "11 + " + hitCharacteristic;
        rollEquation = modifyRollEquation(rollEquation, item.data.data.toHitMod);
        rollEquation = modifyRollEquation(rollEquation, data.toHitModTemp);
        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations") && data.aim !== "none") {
            rollEquation = modifyRollEquation(rollEquation, CONFIG.HERO.hitLocations[data.aim][3]);
        }
        rollEquation = rollEquation + " - 3D6";

        let attackRoll = new Roll(rollEquation, actor.getRollData());
        let result = await attackRoll.roll();
        let renderedResult = await result.render();

        let hitRollData = result.total;
        let hitRollText = "Hits a " + toHitChar + " of " + hitRollData;
        // -------------------------------------------------

        let useEnd = false;
        let enduranceText = "";
        if (game.settings.get("hero6e-foundryvtt-experimental", "use endurance")) {
            useEnd = true;
            let valueEnd = actor.data.data.characteristics.end.value
            let itemEnd = item.data.data.end;
            let newEnd = valueEnd - itemEnd;
            let spentEnd = itemEnd;

            if(itemData.usesStrength) {
                let strEnd =  Math.round(actor.data.data.characteristics.str.value / 10);
                if (data.effectiveStr <= actor.data.data.characteristics.str.value) {
                    strEnd =  Math.round(data.effectiveStr / 10);
                }

                newEnd = newEnd - strEnd;
                spentEnd = spentEnd + strEnd;
            }
            
            if ((automation === "all") || (automation === "npcOnly" && !targetActor.hasPlayerOwner) || (automation === "pcEndOnly")) {
                let changes = {};
                if (newEnd < 0) {
                    enduranceText = 'Spent ' + valueEnd + ' END and ' + Math.abs(newEnd) + ' STUN';
                    changes = {
                        "data.characteristics.end.value": 0,
                        "data.characteristics.stun.value": actor.data.data.characteristics.stun.value + newEnd,
                    }
                } else {
                    enduranceText = 'Spent ' + spentEnd + ' END';
                    changes = {
                        "data.characteristics.end.value": newEnd,
                    }
                }
                await actor.update(changes);
            }
        }

        // -------------------------------------------------
        // determine active defenses
        // -------------------------------------------------
        let PD = parseInt(targetActor.data.data.characteristics.pd.value);
        let ED = parseInt(targetActor.data.data.characteristics.ed.value);
        let MD = 0;
        let rPD = 0; // resistant physical defense
        let rED = 0; // resistant energy defense
        let rMD = 0; // resistant mental defense
        let DRP = 0; // damage reduction physical
        let DRE = 0; // damage reduction energy
        let DRM = 0; // damage reduction mental
        let DNP = 0; // damage negation physical
        let DNE = 0; // damage negation energy
        let DNM = 0; // damage negation mental
        let knockbackResistance = 0;

        if (target.data.actorData.items > 0) {
            for (let i of target.data.actorData.items) {
                if (i.type === "defense" && i.data.active) {
                    switch (i.data.defenseType) {
                        case "pd":
                            PD += parseInt(i.data.value);
                            break;
                        case "ed":
                            ED += parseInt(i.data.value);
                            break;
                        case "md":
                            MD += parseInt(i.data.value);
                            break;
                        case "rpd":
                            rPD += parseInt(i.data.value);
                            break;
                        case "red":
                            rED += parseInt(i.data.value);
                            break;
                        case "rmd":
                            rMD += parseInt(i.data.value);
                            break;
                        case "drp":
                            DRP = Math.max(DRP, parseInt(i.data.value));
                            break;
                        case "dre":
                            DRE = Math.max(DRE, parseInt(i.data.value));
                            break;
                        case "drm":
                            DRM = Math.max(DRM, parseInt(i.data.value));
                            break;
                        case "dnp":
                            DNP += parseInt(i.data.value);
                            break;
                        case "dne":
                            DNE += parseInt(i.data.value);
                            break;
                        case "dnm":
                            DNM += parseInt(i.data.value);
                            break;
                        case "kbr":
                            knockbackResistance += parseInt(i.data.value);
                            break;
                        default:
                            console.log(i.data.defenseType + " not yet supported!");
                            break;
                    }
                }
            }
        }

        let defense = "";
        let defenseValue = 0;
        let resistantValue = 0;
        let damageReductionValue = 0;
        let damageNegationValue = 0;
        switch(item.data.data.class) {
            case 'physical':
                defenseValue = PD;
                resistantValue = rPD;
                damageReductionValue = DRP;
                damageNegationValue = DNP;
                break;
            case 'energy':
                defenseValue = ED;
                resistantValue = rED;
                damageReductionValue = DRE;
                damageNegationValue = DNE;
                break;
            case 'mental':
                defenseValue = MD;
                resistantValue = rMD;
                damageReductionValue = DRM;
                damageNegationValue = DNM;
                break;
            default:
                console.log(item.data.data.class);
                break;
        }

        if (damageNegationValue > 0) {
            defense += "Damage Negation " + damageNegationValue + "DC(s); "
        }

        defense = defense + defenseValue + " normal; " + resistantValue + " resistant";

        // -------------------------------------------------
        // damage roll
        // -------------------------------------------------

        // get hit location
        let hitLocationModifiers = [1, 1, 1, 0];
        let hitLocation = "None";
        let useHitLoc = false;
        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            useHitLoc = true;

            hitLocation = data.aim;
            if (data.aim === 'none') {
                let locationRoll = new Roll("3D6")
                let locationResult = await locationRoll.roll();
                hitLocation = CONFIG.HERO.hitLocationsToHit[locationResult.total];
            }

            hitLocationModifiers = CONFIG.HERO.hitLocations[hitLocation];

            if (game.settings.get("hero6e-foundryvtt-experimental", "hitLocTracking") === "all") {
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

        if(itemData.usesStrength) {
            let strDamage = Math.floor((actor.data.data.characteristics.str.value - 10)/5)
            if (data.effectiveStr <= actor.data.data.characteristics.str.value) {
                strDamage = Math.floor((data.effectiveStr - 10)/5);
            }

            if (strDamage > 0) {
                damageRoll += strDamage;
            }
        }

        let pip = 0;

        // handle damage negation defense
        if (damageNegationValue > 0) {
            if (itemData.killing) {
                pip = (parseInt(damageRoll) * 3) - parseInt(damageNegationValue);

                damageRoll = Math.floor(pip / 3);

                pip = pip % 3
            } else {
                damageRoll = damageRoll - damageNegationValue;
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
                break;
            case 'half':
                pip += 2;
                break;
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

        damageRoll = modifyRollEquation(damageRoll, data.damageMod);

        let roll = new Roll(damageRoll, actor.getRollData());
        let damageResult = await roll.roll();
        let damageRenderedResult = await damageResult.render();
        let body = 0;
        let stun = 0;
        let countedBody = 0;

        let hasStunMultiplierRoll = false;
        let renderedStunMultiplierRoll = null;
        let stunMultiplier = 1;
        
        if (itemData.killing) {
            hasStunMultiplierRoll = true;
            body = damageResult.total;

            let stunRoll = new Roll("1D3", actor.getRollData());
            let stunResult = await stunRoll.roll();
            let renderedStunResult = await stunResult.render();
            renderedStunMultiplierRoll = renderedStunResult;

            if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
                stunMultiplier =  hitLocationModifiers[0];
            } else {
                stunMultiplier = stunResult.total;
            }

            stun = body * stunMultiplier;
        }
        else {
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

        // -------------------------------------------------
        // determine effective damage
        // -------------------------------------------------

        if(itemData.killing) {
            stun = stun - defenseValue - resistantValue;
            body = body - resistantValue;
        } else {
            stun = stun - defenseValue - resistantValue;
            body = body - defenseValue - resistantValue;
        }

        stun = stun < 0 ? 0 : stun;
        body = body < 0 ? 0 : body;

        let hitLocText = "";
        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            if(itemData.killing) {
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
        let knockback = "";
        let knockbackRenderedResult = null;
        if (game.settings.get("hero6e-foundryvtt-experimental", "knockback") && itemData.knockback) {
            useKnockBack = true;
            // body - 2d6 m
            let knockBackEquation = body + " - 2D6"
            // knockback modifier added on an attack by attack basis
            if (data.knockbackMod != 0 ) {
                knockBackEquation = modifyRollEquation(knockBackEquation, data.knockbackMod + "D6");
            }
            // knockback resistance effect
            knockBackEquation = modifyRollEquation(knockBackEquation, " -" + knockbackResistance);

            let knockbackRoll = new Roll(knockBackEquation);
            let knockbackResult = await knockbackRoll.roll();
            knockbackRenderedResult = await knockbackResult.render();
            let knockbackResultTotal = knockbackResult.total;

            if (knockbackResultTotal < 0) {
                knockback = "No knockback";
            } else if (knockbackResultTotal == 0) {
                knockback = "inflicts Knockdown";
            } else {
                knockback= "Knocked back " + knockbackResultTotal + "m";
            }
        }

        // apply damage reduction
        if (damageReductionValue > 0) {
            defense += "; damage reduction " + damageReductionValue + "%";
            stun = Math.round(stun * (1 - (damageReductionValue/100)));
            body = Math.round(body * (1 - (damageReductionValue/100)));
        }

        // minimum damage rule
        if (stun < body) {
            stun = body;
            effects += "; minimum damage invoked"
        }

        stun = Math.round(stun)
        body = Math.round(body)

        // check if target is stunned
        if (game.settings.get("hero6e-foundryvtt-experimental", "stunned")) {
            // determine if target was Stunned
            if (stun > targetActorChars.con.value) {
                effects = effects + "; inflicts Stunned"
            }
        }

        if ((automation === "all") || (automation === "npcOnly" && !targetActor.hasPlayerOwner) || (automation === "pcEndOnly" && !targetActor.hasPlayerOwner)) {
            let toHitVal = getTokenChar(target, toHitChar.toLowerCase(), "value")

            if (toHitVal <= hitRollData) {
                // attack success
                hitRollText = hitRollText + "; SUCCESS!"

                let newStun = getTokenChar(target, "stun", "value") - stun;
                let newBody = getTokenChar(target, "body", "value") - body;
    
                let changes = {
                    "data.characteristics.stun.value": newStun,
                    "data.characteristics.body.value": newBody,
                }

                if (game.settings.get("hero6e-foundryvtt-experimental", "hitLocTracking") === "all") {
                    let bodyPartHP = targetActorChars.body.loc[hitLocation] + body
                    changes["data.characteristics.body.loc." + hitLocation] = bodyPartHP;

                    if (bodyPartHP > targetActorChars.body.value) {
                        effects = effects + "; inflicts Impaired " + hitLocation;
                    }
                }
                
                await targetActor.update(changes);
            } else {
                // attack failure
                hitRollText = hitRollText + "; FAILURE"
            }
        }
        // -------------------------------------------------

        let stateData = {
            // dice rolls
            renderedHitRoll: renderedResult,
            hitRollText: hitRollText,
            hitRollValue: result.total,
            renderedDamageRoll: damageRenderedResult,
            renderedStunMultiplierRoll: renderedStunMultiplierRoll,

            // hit locations
            useHitLoc: useHitLoc,
            hitLocText: hitLocText,
            aim: data.aim,

            // endurance
            useEnd: useEnd,
            enduranceText: enduranceText,

            // body
            bodyDamage: bodyDamage,
            bodyDamageEffective: body,
            countedBody: countedBody,

            // stun
            stunDamage: stunDamage,
            stunDamageEffective: stun,
            hasRenderedDamageRoll: true,
            stunMultiplier: stunMultiplier,
            hasStunMultiplierRoll: hasStunMultiplierRoll,

            // effects
            effects: effects,

            // defense
            defense: defense.toUpperCase(),
            defenseValue: defenseValue,

            // knockback
            knockback: knockback,
            useKnockBack: useKnockBack,
            knockbackRenderedResult: knockbackRenderedResult,

            // misc
            targetCharacter: targetActor.name,
        };

        // render card
        let cardHtml = await HeroSystem6eToHitCard._renderInternal(item, actor, target, stateData);
        
        let token = actor.token;

        const chatData = {
            user:  game.user.data._id,
            content: cardHtml,
            speaker: ChatMessage.getSpeaker({ actor: actor, token }),
        }

        return ChatMessage.create(chatData);
    }
}
