import { HeroSystem6eCard } from "./card.js";
import { HeroSystem6eDamageCard } from "./damage-card.js";
import { HeroSystem6eHitLocCard } from "./hitLoc-card.js";
import { HeroSystem6eToHitCard } from "./toHit-card.js";

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
        if (!(isValid || game.user.isGM || cardObject.message.isAuthor)) return;

        const targets = HeroSystem6eCard._getChatCardTargets();

        // Handle different actions
        switch (action) {
            case "hit-roll":
                for (let token of targets) {
                    await HeroSystem6eToHitCard.createFromAttackCard(cardObject, token, await cardObject.makeHitRoll());
                }
                //await cardObject.makeHitRoll(); 
                break;
            case "damage-roll":
                //await cardObject.makeDamageRoll();
                break;
            case "hitLoc-ref":
                await HeroSystem6eHitLocCard.createFromAttackCard();
                break;
            case "apply-defenses":
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

        var path = "systems/hero6e-foundryvtt-experimental/templates/chat/item-attack-card.html";

        return await renderTemplate(path, templateData);
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
        let useEndVal = false;
        if (game.settings.get("hero6e-foundryvtt-experimental", "use endurance")) {
            useEndVal = true;
        }

        let useHitLocVal = false;
        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            useHitLocVal = true;
        }

        const stateData = {
            canMakeHitRoll: true,
            useEnd: useEndVal,
            useHitLoc: useHitLocVal,
            hitLoc: CONFIG.HERO.hitLocations
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

        let result = await roll.roll();

        let renderedResult = await result.render();

        let hitRollText = "Hits a " + CONFIG.HERO.defendsWith[this.item.data.data.targets] + " of " + result.total;

        if (game.settings.get("hero6e-foundryvtt-experimental", "use endurance")) {
            let newEnd = this.actor.data.data.characteristics.end.value - this.item.data.data.end;
            
            console.log(newEnd)

            console.log(this.actor)

            /* fix this lol
            // updates token
            await this.actor.update({
                "data.data.characteristics.end.current": newEnd,
                "data.data.characteristics.end.value": newEnd,
            })

            // updates sheet
            await this.actor.data.update({
                "data.characteristics.end.current": newEnd,
                "data.characteristics.end.value": newEnd,
            });
            */

            this.actor._sheet._render();

            console.log(this.actor._sheet.object.data.data.characteristics.end)
            console.log(this.actor.items)

            console.log(this.actor.data.data.characteristics.end)

            let enduranceText = ""
            if (newEnd < 0) {
                enduranceText = 'Overspent endurance by ' + newEnd;
            } else {
                enduranceText = 'Spent ' + this.item.data.data.end + ' endurance';
            }

            await this.modifyCardState("enduranceText", enduranceText);

        }

        await this.modifyCardState("canMakeHitRoll", false);
        await this.modifyCardState("hasRenderedHitRoll", true);
        await this.modifyCardState("canMakeDamageRoll", true);
        await this.modifyCardState("renderedHitRoll", renderedResult);
        await this.modifyCardState("hitRollText", hitRollText);
        await this.refresh();

        let stateData = {
            canMakeHitRoll: false,
            hasRenderedHitRoll: true,
            canMakeDamageRoll: true,
            renderedHitRoll: renderedResult,
            hitRollText: hitRollText,
        };

        return stateData;
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

        await this.modifyCardState("hasRenderedDamageRoll", true);
        await this.modifyCardState("canMakeDamageRoll", false);
        await this.modifyCardState("renderedDamageRoll", renderedResult);
        await this.modifyCardState("bodyDamage", body);
        await this.modifyCardState("stunDamage", stun);
        await this.modifyCardState("countedBody", countedBody);
        await this.refresh();
    }
}