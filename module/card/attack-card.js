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

    static async _RollToHit(item, html, actor, itemId) {
        // get attack card input
        let form = html[0].querySelector("form");

        let effectiveStr = 0;
        if ("effectiveStr" in form) {
            effectiveStr = form.effectiveStr.value;
        }

        let aim = "";
        if ("aim" in form) {
            aim = form.aim.value;
        }

        let data = {
            'toHitModTemp': form.toHitMod.value,
            'aim': aim,
            'effectiveStr': effectiveStr,
            'damageMod': form.damageMod.value
        };

        if (game.settings.get("hero6efoundryvttv2", "knockback")) {
            data['knockbackMod'] = form.knockbackMod.value;
        }

        const targets = HeroSystem6eCard._getChatCardTargets();
        
        await HeroSystem6eToHitCard.createFromAttackCard(item, data, actor, itemId);
    }

    static async _renderInternal(item, actor, stateData, itemId) {
        // Render the chat card template
        const token = actor.token

        if (game.settings.get("hero6efoundryvttv2", "hit locations")) {
            stateData['useHitLoc'] = true;
            stateData['hitLoc'] = CONFIG.HERO.hitLocations;
        }

        if (game.settings.get("hero6efoundryvttv2", "knockback")) {
            stateData['useKnockback'] = true;
        }

        if (game.settings.get("hero6efoundryvttv2", "use endurance")) {
            stateData['useEnd'] = true;
        }

        let targetActorChars = actor.system.characteristics;
        stateData["str"] = targetActorChars.str.value;

        stateData["useStr"] = item.system.usesStrength;

        stateData["itemId"] = itemId;

        const templateData = {
            actor: actor.data,
            tokenId: token?.uuid || null,
            item: item.data,
            state: stateData,
        };

        var path = "systems/hero6efoundryvttv2/templates/attack/item-attack-card.hbs";

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
    static async createAttackPopOutFromItem(item, actor, itemId) {
        const content = await this._renderInternal(item, actor, {}, itemId);

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
                        callback: html => resolve(this._RollToHit(item, html, actor, itemId))
                    },
                },
                default: "rollToHit",
                close: () => resolve({})
            }

            /*
            if (game.settings.get("hero6efoundryvttv2", "hit locations")) {
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