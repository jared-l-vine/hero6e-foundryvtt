import { HeroSystem6eActorActiveEffects } from "../actor/actor-active-effects.js";
import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eCard } from "./card.js";

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

    static async createFromAttackCard(target, item, data) {
        let actor = item.actor;

        let targetActor = game.actors.get(target.data.actorId)
        let targetActorChars = targetActor.data.data.characteristics;

        let itemData = item.data.data;
        let damageRoll = itemData.dice;
        let hitCharacteristic = actor.data.data.characteristics[itemData.uses].value;
        let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];

        // -------------------------------------------------
        // attack roll
        // -------------------------------------------------

        function modifyHitRollEquation(equation, value) {
            if (value != 0) {
                let sign = " + ";
                if (value < 0) {
                    sign = " ";
                }
                equation = equation + sign + value;
            }

            return equation
        }

        let rollEquation = "11 + " + hitCharacteristic;
        rollEquation = modifyHitRollEquation(rollEquation, item.data.data.toHitMod);
        rollEquation = modifyHitRollEquation(rollEquation, data.toHitModTemp);
        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations") && data.aim !== "none") {
            rollEquation = modifyHitRollEquation(rollEquation, CONFIG.HERO.hitLocations[data.aim][3]);
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
                newEnd = newEnd -strEnd;
                spentEnd = spentEnd + strEnd;
            }
            
            if (game.settings.get("hero6e-foundryvtt-experimental", "automation")) {
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

        switch (itemData.extraDice) {
            case 'zero':
                damageRoll += "D6";
                break;
            case 'pip':
                damageRoll += "D6+1";
                break;
            case 'half':
                damageRoll += "D6+1D3"
                break;
        }

        if(itemData.usesStrength) {
            let strDamage = Math.floor((actor.data.data.characteristics.str.value - 10)/5)
            if (strDamage > 0) {
                damageRoll = damageRoll + " + " + strDamage + "D6";
            }
        }

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
            body = result.total;

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

        // -------------------------------------------------
        // determine effective damage
        // -------------------------------------------------
        // apply defenses only PD and ED for now
        let defense = item.data.data.defense;
        let defenseValue = 0;
        switch(defense) {
            case 'pd':
                defenseValue = targetActor.data.data.characteristics.pd.value;
                break;
            case 'ed':
                defenseValue = targetActor.data.data.characteristics.ed.value;
                break;
            default:
                console.log(defense);
        }

        stun = stun - defenseValue;
        stun = stun < 0 ? 0 : stun;

        body = body - defenseValue;
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
        // -------------------------------------------------

        if (game.settings.get("hero6e-foundryvtt-experimental", "stunned")) {
            // determine if target was Stunned
            if (stun > targetActorChars.con.value) {
                effects = effects + "; inflicts Stunned"
            }
        }

        if (game.settings.get("hero6e-foundryvtt-experimental", "automation")) {
            if (targetActorChars[`${toHitChar.toLowerCase()}`].value <= hitRollData) {
                // attack success
                hitRollText = hitRollText + "; SUCCESS!"

                let newStun = targetActorChars.stun.value - stun;
                let newBody = targetActorChars.body.value - body;
    
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

        let useKnockBack = false;
        let knockback = "";
        let knockbackRenderedResult = null;
        if (game.settings.get("hero6e-foundryvtt-experimental", "knockback") && itemData.knockback) {
            useKnockBack = true;
            // body - 2d6 m
            let knockBackEquation = body + " - 2D6"
            knockBackEquation = modifyHitRollEquation(knockBackEquation, data.knockbackMod + "D6");
            let knockbackRoll = new Roll(knockBackEquation);
            let knockbackResult = await knockbackRoll.roll();
            knockbackRenderedResult = await knockbackResult.render();

            if (knockbackResult.total < 0) {
                knockback = "No knockback";
            } else if (knockbackResult.total == 0) {
                knockback = "inflicts Knockdown";
            } else {
                knockback= "Knocked back " + knockbackResult.total + "m";
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
        
        let token = item.actor.token;

        const chatData = {
            user:  game.user.data._id,
            content: cardHtml,
            speaker: ChatMessage.getSpeaker({ actor: item.actor, token }),
        }

        return ChatMessage.create(chatData);
    }
}