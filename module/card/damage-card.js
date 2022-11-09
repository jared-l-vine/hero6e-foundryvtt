import { HeroSystem6eActorActiveEffects } from "../actor/actor-active-effects.js";
import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eCard } from "./card.js";

export class HeroSystem6eDamageCard extends HeroSystem6eCard {

    static chatListeners(html) {
        html.on('click', '.damage-card .card-buttons button', this._onChatCardAction.bind(this));
    }

    static onMessageRendered(html) {
        html.find('.damage-card .card-buttons button').each((i, button) => {
            HeroSystem6eDamageCard.setCardStateAsync(button);
            button.style.display = "block";
        });
    }

    static async setCardStateAsync(button) {
        const card = button.closest(".chat-card");

        let actor = await this._getChatCardActor(card);

        if (button.getAttribute('data-action') == 'damage-apply') {
            actor = await this._getChatCardTarget(card);
        }

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
        const cardObject = new HeroSystem6eDamageCard();
        await cardObject.init(card);

        // Validate permission to proceed with the roll
        if (!(game.user.isGM || cardObject.message.isAuthor)) return;

        // Handle different actions
        switch (action) {
            case "damage-apply":
                await cardObject.applyDamage(); break;
        }

        // Re-enable the button
        button.disabled = false;
    }

    static async _renderInternal(item, actor, target, stateData) {
        // Render the chat card template
        const token = actor.token;
        const targetToken = target.token;

        const templateData = {
            actor: actor.data,
            tokenId: token?.uuid || null,
            item: item.data,
            state: stateData,
            target: target.data,
            targetTokenId: targetToken?.uuid || null,
        };

        var path = "systems/hero6e-foundryvtt-experimental/templates/chat/item-damage-card.html";

        return await renderTemplate(path, templateData);
    }

    async render() {
        return await HeroSystem6eDamageCard._renderInternal(this.item, this.actor, this.target, this.message.data.flags["state"]);
    }

    async init(card) {
        super.init(card);
        this.target = await HeroSystem6eDamageCard._getChatCardTarget(card);
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

    static DAMAGE_TEMPLATE = "systems/hero6e-foundryvtt-experimental/templates/chat/damage-dialog.html";

    static async createFromAttackCard(attackCard, target) {
        let item = attackCard.item;
        let relevantDefenses = [];
        let title = "Apply Defenses";

        for (let i of target.data.items) {
            if (i.data.type == 'defense') {
                if (i.data.data.defenseType == item.data.data.defense) {
                    let defense = i.data.data;
                    HeroSystem6eActorSheet._prepareDefenseItem(i, defense);
                    relevantDefenses.push(i);
                }
            }
        }

        let options = {
            'width' : 600,
        }

        // Render the Dialog inner HTML
        const content = await renderTemplate(HeroSystem6eDamageCard.DAMAGE_TEMPLATE, {
            item: item,
            defenses: relevantDefenses
        });

        // Create the Dialog window and await submission of the form
        return new Promise(resolve => {
            new Dialog({
                title,
                content,
                buttons: {
                    calculate: {
                        label: "Calculate",
                        callback: html => resolve(HeroSystem6eDamageCard._onDamageSubmit(attackCard, target, html))
                    },
                    cancel: {
                        label: "Cancel",
                        callback: html => resolve(null)
                    },
                },
                default: "cancel",
                close: () => resolve(null)
            }, options).render(true);
        });
    }

    static async _onDamageSubmit(attackCard, target, html) {
        let attack = attackCard.item.data.data;
        let state = attackCard.message.data.flags['state'];
        let activeDefenses = [];

        html.find('.defense-active:checked').each((i, toggle) => {
            let defenseID = toggle.closest(".item").getAttribute('data-item-id');
            activeDefenses.push(target.data.items.get(defenseID));
        });

        let defenseTotal = 0;
        let resistantDefenseTotal = 0;
        let piercedDefenseTotal = 0;
        let piercedResistantDefenseTotal = 0;
        let penetratedDefenseTotal = 0;
        let penetratedResistantDefenseTotal = 0;

        for (let defense of activeDefenses) {
            defenseTotal += defense.value;

            if (defense.resistant == "True") {
                resistantDefenseTotal += defense.value;
            }

            if (defense.hardened >= attack.piercing) {
                piercedDefenseTotal += defense.value;

                if (defense.resistant == "True") {
                    piercedResistantDefenseTotal += defense.value;
                }
            } else {
                piercedDefenseTotal += defense.value / 2;

                if (defense.resistant == "True") {
                    piercedResistantDefenseTotal += defense.value / 2;
                }
            }

            if (defense.impenetrable >= attack.penetrating) {
                penetratedDefenseTotal += defense.value;

                if (defense.resistant == "True") {
                    penetratedResistantDefenseTotal += defense.value;
                }
            }
        }

        piercedDefenseTotal = Math.round(piercedDefenseTotal);
        piercedResistantDefenseTotal = Math.round(piercedResistantDefenseTotal);

        let minimumDamage = state['countedBody'];

        if (game.settings.get("hero6e-foundryvtt-experimental", "hit locations")) {
            let locationRoll = new Roll("3D6")
            let locationResult = locationRoll.roll().total
        }

        if (attack.killing) {
            minimumDamage -= penetratedResistantDefenseTotal;
        } else {
            minimumDamage -= penetratedDefenseTotal;
        }

        if (minimumDamage < 0) {
            minimumDamage = 0;
        }

        let startingDefenseText = defenseTotal + " Def";

        if (attack.killing) {
            startingDefenseText += " and " + resistantDefenseTotal + " rDef";
        }

        let piercedDefenseText = "Defense reduced to " + piercedDefenseTotal + " Def";

        if (attack.killing) {
            piercedDefenseText += " and " + piercedResistantDefenseTotal + " rDef";
        }

        piercedDefenseText += " by Armor Piercing";

        let penetratedDefenseText = "Penetrating causes minimum of " + minimumDamage + " ";

        if (attack.killing) {
            penetratedDefenseText += "BODY";
        } else {
            penetratedDefenseText += "STUN";
        }

        let resultantBody = attack.killing ? state['bodyDamage'] - piercedResistantDefenseTotal : state['bodyDamage'] - piercedDefenseTotal;
        let resultantStun = state['stunDamage'] - piercedDefenseTotal;

        if (resultantBody < 0) {
            resultantBody = 0;
        }

        if (resultantStun < 0) {
            resultantStun = 0;
        }

        let reducedDamageText = target.name + " takes " + resultantBody + " BODY and " + resultantStun + " STUN";

        const token = target.token;

        const stateData = {
            initialBody: state['bodyDamage'],
            initialStun: state['stunDamage'],
            startingDefenseText: startingDefenseText,
            piercedDefenseText: piercedDefenseText,
            penetratedDefenseText: penetratedDefenseText,
            showPiercedValues: piercedDefenseTotal < defenseTotal,
            showPenetratedValues: attack.killing ? minimumDamage > resultantBody : minimumDamage > resultantStun,
            reducedDamageText: reducedDamageText,
            finalBody: resultantBody,
            finalStun: resultantStun,
            canApplyDamage: true,
            targetID: target.id,
            targetTokenID: token ? token._id : null,
        };

        let cardHtml = await HeroSystem6eDamageCard._renderInternal(attackCard.item, attackCard.actor, target, stateData);

        // Create the ChatMessage data object
        const chatData = {
            user: game.user.data._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: cardHtml,
            flavor: attackCard.item.data.data.chatFlavor || attackCard.item.name,
            speaker: ChatMessage.getSpeaker({ actor: target, token }),
            flags: { "core.canPopout": true, "state": stateData },
        };

        if (!attackCard.actor.items.has(attackCard.item.id)) {
            chatData["flags.hero.itemData"] = attackCard.item.data;
        }

        // Apply the roll mode to adjust message visibility
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));

        // Create the Chat Message or return its data
        return ChatMessage.create(chatData);
    }

    async applyDamage() {
        let newBody = this.target.data.data.body.value - this.message.data.flags['state'].finalBody;
        let newStun = this.target.data.data.stun.value - this.message.data.flags['state'].finalStun;
        await this.target.update({
            "data.body.value": newBody,
            "data.stun.value": newStun,
        });

        if (newBody <= -this.target.data.data.body.max) {
            await HeroSystem6eCard.removeStatusEffect(this.target, HeroSystem6eActorActiveEffects.stunEffect);
            await HeroSystem6eCard.removeStatusEffect(this.target, HeroSystem6eActorActiveEffects.unconsciousEffect);
            await HeroSystem6eCard.removeStatusEffect(this.target, HeroSystem6eActorActiveEffects.bleedingEffect);
            await HeroSystem6eCard.applyStatusEffect(this.target, HeroSystem6eActorActiveEffects.deadEffect);
        } else {
            if (newBody <= 0) {
                await HeroSystem6eCard.applyStatusEffect(this.target, HeroSystem6eActorActiveEffects.bleedingEffect);
            }

            if (newStun <= 0) {
                await HeroSystem6eCard.removeStatusEffect(this.target, HeroSystem6eActorActiveEffects.stunEffect);
                await HeroSystem6eCard.applyStatusEffect(this.target, HeroSystem6eActorActiveEffects.unconsciousEffect);
            } else if (this.message.data.flags['state'].finalStun > this.target.data.data.characteristics['con'].value) {
                await HeroSystem6eCard.applyStatusEffect(this.target, HeroSystem6eActorActiveEffects.stunEffect);
            }
        }

        await this.modifyCardState("canApplyDamage", false);
        await this.modifyCardState("hasAppliedDamage", true);
        await this.modifyCardState("appliedDamageText", "Reduced to " + newBody + " BODY and " + newStun + " STUN");
        await this.refresh();
    }
}