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

    static async _RollToHit(item, html) {
        // get attack card input
        let form = html[0].querySelector("form");
        let data = {
            'toHitModTemp': form.toHitMod.value,
            'aim': form.aim.value,
        };

        if (game.settings.get("hero6e-foundryvtt-experimental", "knockback")) {
            data['knockbackMod'] = form.knockbackMod.value;
        }

        const targets = HeroSystem6eCard._getChatCardTargets();
        
        for (let token of targets) {
            await HeroSystem6eToHitCard.createFromAttackCard(token, item, data);
        }
    }

    static async _renderInternal(item, actor, stateData) {
        // Render the chat card template
        const token = actor.token;

        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            stateData['useHitLoc'] = true;
            stateData['hitLoc'] = CONFIG.HERO.hitLocations;
        }

        if (game.settings.get("hero6e-foundryvtt-experimental", "knockback")) {
            stateData['useKnockback'] = true;
        }

        const templateData = {
            actor: actor.data,
            tokenId: token?.uuid || null,
            item: item.data,
            state: stateData,
        };

        var path = "systems/hero6e-foundryvtt-experimental/templates/attack/item-attack-card.hbs";

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
    static async createAttackPopOutFromItem(item) {
        const template = "systems/hero6e-foundryvtt-experimental/templates/chat/item-attack-card.hbs";
        const content = await this._renderInternal(item, item.actor, {});

        // Attack Card as a Pop Out
        let options = {
            'width' : 300,
        }

        return new Promise(resolve => {
            const data = {
                title: "Roll to Hit",
                content: content,
                buttons: {
                    rollToHit: {
                        label: "Roll to Hit",
                        callback: html => resolve(this._RollToHit(item, html))
                    },
                },
                default: "rollToHit",
                close: () => resolve({})
            }

            /*
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
            */

            new Dialog(data, options).render(true);;
        });
    }
}