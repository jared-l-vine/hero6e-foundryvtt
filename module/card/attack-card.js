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

        // not being used anymore, leaving in here for now just in case
    }

    static async _RollToHit(item) {
        const cardObject = new HeroSystem6eAttackCard();
        cardObject['actor'] = item.actor;
        cardObject['item'] = item;

        const targets = HeroSystem6eCard._getChatCardTargets();
        
        for (let token of targets) {
            await HeroSystem6eToHitCard.createFromAttackCard(cardObject, token, await cardObject.makeHitRoll(item));
        }
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

        // Attack Card as a Pop Out
        let options = {
            'width' : 300,
        }

        return new Promise(resolve => {
            const data = {
                title: "Roll to Hit",
                content: html,
                buttons: {
                    rollToHit: {
                        label: "Roll to Hit",
                        callback: html => resolve(this._RollToHit(item))
                    },
                },
                default: "rollToHit",
                close: () => resolve({})
            }

            if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
                data['buttons'] = Object.assign({}, 
                    {
                        hitLoc : {
                            label: "Reference Hit Location Table?",
                            callback: html => resolve(HeroSystem6eHitLocCard.createFromAttackCard()),
                        }
                    }, 
                    data['buttons']);
            }

            new Dialog(data, options).render(true);;
        });
    }

    async makeHitRoll(item) {
        let actor = item.actor;

        let hitCharacteristic = actor.data.data.characteristics[item.data.data.uses].value;

        let rollEquation = "11 + " + hitCharacteristic;
        if (item.data.data.toHitMod != 0) {
            let sign = " + ";
            if (item.data.data.toHitMod < 0) {
                sign = " ";
            }
            rollEquation = rollEquation + sign + item.data.data.toHitMod;
        }
        rollEquation = rollEquation + " - 3D6"

        let roll = new Roll(rollEquation, actor.getRollData());

        let result = await roll.roll();

        let renderedResult = await result.render();

        let toHitChar = CONFIG.HERO.defendsWith[item.data.data.targets];

        let hitRollText = "Hits a " + toHitChar + " of " + result.total;

        let stateData = {
            canMakeHitRoll: false,
            hasRenderedHitRoll: true,
            canMakeDamageRoll: true,
            renderedHitRoll: renderedResult,
            hitRollText: hitRollText,
            hitRollValue: result.total,
            toHitChar: toHitChar,
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