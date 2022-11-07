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

    static async createFromAttackCard(attackCard, target, stateData) {
        let targetCharacter = game.actors.get(target.data.actorId).name;
        stateData["targetCharacter"] = targetCharacter;

        if (game.settings.get("hero6e-foundryvtt-experimental", "use endurance")) {
            stateData["useEnd"] = true;
            let actor = attackCard.actor;
            let valueEnd = actor.data.data.characteristics.end.value
            let itemEnd = attackCard.item.data.data.end;
            let newEnd = valueEnd - itemEnd;
            
            let enduranceText = ""
            let changes = {};
            if (newEnd < 0) {
                enduranceText = 'Spent ' + valueEnd + ' END and ' + Math.abs(newEnd) + ' STUN';
                changes = {
                    "data.characteristics.end.value": 0,
                    "data.characteristics.stun.value": actor.data.data.characteristics.stun.value + newEnd,
                }
            } else {
                enduranceText = 'Spent ' + itemEnd + ' END';
                changes = {
                    "data.characteristics.end.value": newEnd,
                }
            }
            await actor.update(changes);

            stateData["enduranceText"] = enduranceText;
        }

        let cardObject = new HeroSystem6eToHitCard();
        let damageData = await cardObject.makeDamageRoll(attackCard.item, attackCard.actor, target);
        stateData = Object.assign({}, stateData, damageData);

        let cardHtml = await HeroSystem6eToHitCard._renderInternal(attackCard.item, attackCard.actor, target, stateData);
        
        let token = attackCard.item.actor.token;

        const chatData = {
            user:  game.user.data._id,
            content: cardHtml,
            speaker: ChatMessage.getSpeaker({ actor: attackCard.item.actor, token }),
        }

        return ChatMessage.create(chatData);
    }

    async makeDamageRoll(item, actor, target) {
        let stateData = {};

        // get hit location
        let hitLocationModifiers = [1, 1, 1];
        let hitLocation = "None";
        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            stateData["useHitLoc"] = true;

            let locationRoll = new Roll("3D6")
            let locationResult = await locationRoll.roll();

            hitLocation = CONFIG.HERO.hitLocationsToHit[locationResult.total];
            hitLocationModifiers = CONFIG.HERO.hitLocations[hitLocation];
        }

        let itemData = item.data.data;
        let damageRoll = itemData.dice;

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

        let roll = new Roll(damageRoll, actor.getRollData());
        let result = await roll.roll();
        let renderedResult = await result.render();
        let body = 0;
        let stun = 0;
        let countedBody = 0;

        if (itemData.killing) {
            stateData["hasStunMultiplierRoll"] = true;
            body = result.total;

            let stunRoll = new Roll("1D3", actor.getRollData());
            let stunResult = await stunRoll.roll();
            let renderedStunResult = await stunResult.render();
            stateData["renderedStunMultiplierRoll"] = renderedStunResult;

            if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
                stateData["stunMultiplier"] =  hitLocationModifiers[0];
            } else {
                stateData["stunMultiplier"] = stunResult.total;
            }

            stun = body * stateData["stunMultiplier"];
        }
        else {
            // counts body damage for non-killing attack
            for (let die of result.terms[0].results) {
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

            stun = result.total;
            body = countedBody;
        }

        stateData["bodyDamage"] = body;
        stateData["stunDamage"] = stun;

        // apply defenses only PD and ED for now
        let targetActor = game.actors.get(target.data.actorId)
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

        stateData["defense"] = defense.toUpperCase();
        stateData["defenseValue"] = defenseValue;

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

            stateData["hasStunMultiplierRoll"] = false;
            stateData["hitLocText"] = hitLocText;
        }

        stateData["hasRenderedDamageRoll"] = true;
        stateData["canMakeDamageRoll"] = false;
        stateData["renderedDamageRoll"] = renderedResult;
        stateData["bodyDamageEffective"] = body;
        stateData["stunDamageEffective"] = stun;
        stateData["countedBody"] = countedBody;

        return stateData;
    }
}