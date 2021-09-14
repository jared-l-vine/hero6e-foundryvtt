import { HeroSystem6eCard } from "./card.js";
import { HeroSystem6eDamageCard } from "./damage-card.js";

export class HeroSystem6eAttackCard extends HeroSystem6eCard {
    static chatListeners(html) {
        html.on('click', '.attack-card .card-buttons button', this._onChatCardAction.bind(this));
    }

    static onMessageRendered(html) {
        html.find('.attack-card .card-buttons button').each((i, button) => {
            if (button.getAttribute('data-action') != 'apply-defenses') {
                HeroSystem6eAttackCard.setCardStateAsync(button);
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
        const cardObject = new HeroSystem6eAttackCard();
        await cardObject.init(card);

        // Validate permission to proceed with the roll
        const isValid = action === "apply-defenses";
        if (!(isValid || game.user.isGM || message.isAuthor)) return;

        // Handle different actions
        switch (action) {
            case "hit-roll":
                await cardObject.makeHitRoll(); break;
            case "damage-roll":
                await cardObject.makeDamageRoll(); break;
            case "apply-defenses":
                const targets = HeroSystem6eCard._getChatCardTargets();
                for (let token of targets) {
                    await HeroSystem6eDamageCard.createFromAttackCard(cardObject, token.actor);
                }
                break;
        }

        // Re-enable the button
        button.disabled = false;
    }

    static async _renderInternal(item, actor, stateData) {
        // Render the chat card template
        const token = actor.token;

        const templateData = {
            actor: actor.data,
            tokenId: token?.uuid || null,
            item: item.data,
            state: stateData,
        };

        return await renderTemplate("systems/herosystem6e/templates/chat/item-attack-card.html", templateData);
    }

    async render() {
        return await HeroSystem6eAttackCard._renderInternal(this.item, this.actor, this.message.data.flags["state"]);
    }

    /**
      * Display the chat card for an Item as a Chat Message
      * @param {object} options          Options which configure the display of the item chat card
      * @param {string} rollMode         The message visibility mode to apply to the created card
      * @param {boolean} createMessage   Whether to automatically create a ChatMessage entity (if true), or only return
      *                                  the prepared message data (if false)
      */
    static async createChatDataFromItem(item) {
        const stateData = {
            canMakeHitRoll: true
        };
        const token = item.actor.token;
        let html = await this._renderInternal(item, item.actor, stateData);

        // Create the ChatMessage data object
        const chatData = {
            user: game.user.data._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            flavor: item.data.data.chatFlavor || item.name,
            speaker: ChatMessage.getSpeaker({ actor: item.actor, token }),
            flags: { "core.canPopout": true, "state": stateData },
        };

        if (!item.actor.items.has(item.id)) {
            chatData["flags.hero.itemData"] = item.data;
        }

        return chatData;
    }

    async makeHitRoll() {
        let hitCharacteristic = this.actor.data.data.characteristics[this.item.data.data.uses].value;

        let roll = new Roll("11 + " + hitCharacteristic + " - 3D6", this.actor.getRollData());
        let result = roll.roll();
        let renderedResult = await result.render();

        let hitRollText = "Hits a " + CONFIG.HERO.defendsWith[this.item.data.data.targets] + " of " + result.total;

        await this.modifyCardState("canMakeHitRoll", false);
        await this.modifyCardState("hasRenderedHitRoll", true);
        await this.modifyCardState("canMakeDamageRoll", true);
        await this.modifyCardState("renderedHitRoll", renderedResult);
        await this.modifyCardState("hitRollText", hitRollText);
        await this.refresh();
    }

    async makeDamageRoll() {
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
        let result = roll.roll();
        let renderedResult = await result.render();
        let body = 0;
        let stun = 0;
        let countedBody = 0;

        for (let die of result.terms[0].results) {
            switch (die.result) {
                case 2:
                case 3:
                case 4:
                case 5:
                    countedBody += 1;
                    break;
                case 6:
                    countedBody += 2;
                    break;
            }
        }

        if (result.terms.length >= 3) {
            for (let die of result.terms[2].results) {
                switch (die.result) {
                    case 2:
                        if (Math.random() >= 0.5) {
                            countedBody += 1;
                        }
                        break;
                    case 3:
                        countedBody += 1;
                        break;
                }
            }
        }

        if (itemData.killing) {
            await this.modifyCardState("hasStunMultiplierRoll", true);
            body = result.total;

            let stunRoll = new Roll("1D3", this.actor.getRollData());
            let stunResult = stunRoll.roll();
            let renderedStunResult = await stunResult.render();
            await this.modifyCardState("renderedStunMultiplierRoll", renderedStunResult);
            await this.modifyCardState("stunMultiplier", stunResult.total);
            stun = body * stunResult.total;
        }
        else {
            stun = result.total;
            body = countedBody;
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