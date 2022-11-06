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
                await cardObject.makeDamageRoll();
                break;
            case "apply-defenses":
                //const targets = HeroSystem6eCard._getChatCardTargets();
                /*for (let token of targets) {
                    await HeroSystem6eToHitCard.createFromAttackCard(cardObject, token.actor);
                }*/
                break;
        }

        // Re-enable the button
        button.disabled = false;
    }

    static async _renderInternal(item, actor, target, stateData) {
        const token = actor.token;
        //const targetToken = target.token;

        const templateData = {
            actor: actor.data,
            tokenId: token?.uuid || null,
            item: item.data,
            state: stateData,
            //target: target.data,
            //targetTokenId: targetToken?.uuid || null,
        };

        /*
        if (game.settings.get("hero6e-foundryvtt-experimental", "use endurance")) {
            templateData["useEnd"] = true;
        }
        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            templateData["useHitLoc"] = true;
        }
        */

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
        let cardHtml = await HeroSystem6eToHitCard._renderInternal(attackCard.item, attackCard.actor, target, stateData);
        
        const chatData = {
            user:  game.user.data._id,
            content: cardHtml,
        }

        return ChatMessage.create(chatData);
    }

    async makeDamageRoll() {
        console.log('make damage roll!')
        console.log(this)

        let itemData = this.item.data.data;

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

        let roll = new Roll(damageRoll, this.actor.getRollData());
        let result = await roll.roll();
        let renderedResult = await result.render();
        let body = 0;
        let stun = 0;
        let countedBody = 0;

        if (itemData.killing) {
            await this.modifyCardState("hasStunMultiplierRoll", true);
            body = result.total;

            let stunRoll = new Roll("1D3", this.actor.getRollData());
            let stunResult = await stunRoll.roll();
            let renderedStunResult = await stunResult.render();
            await this.modifyCardState("renderedStunMultiplierRoll", renderedStunResult);
            await this.modifyCardState("stunMultiplier", stunResult.total);
            stun = body * stunResult.total;
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

        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            await this.modifyCardState("useHitLoc", true);

            let locationRoll = new Roll("3D6")
            let locationResult = await locationRoll.roll();

            console.log('HIT LOCATIONS')
            console.log(locationResult.total)

            let hitLocation = CONFIG.HERO.hitLocationsToHit[locationResult.total];

            let hitLocationModifiers = CONFIG.HERO.hitLocations[hitLocation];

            stun = stun * hitLocationModifiers[0];
            body = body * hitLocationModifiers[2];

            console.log(stun)
            console.log(body)

            let hitLocText = "Hit " + hitLocation + " (x" + hitLocationModifiers[0] + " STUN x" + hitLocationModifiers[2] + " BODY)";

            await this.modifyCardState("hitLocText", hitLocText);
        }

        await this.modifyCardState("hasRenderedDamageRoll", true);
        await this.modifyCardState("canMakeDamageRoll", false);
        await this.modifyCardState("renderedDamageRoll", renderedResult);
        await this.modifyCardState("bodyDamage", body);
        await this.modifyCardState("stunDamage", stun);
        await this.modifyCardState("countedBody", countedBody);
        await this.refresh();
    }
}