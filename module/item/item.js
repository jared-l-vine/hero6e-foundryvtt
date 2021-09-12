import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eCard } from "../card/card.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class HeroSystem6eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;

      if (itemData.type === 'skill') this._prepareSkillData(itemData);
  }

  _prepareSkillData(itemData) {
      const data = itemData.data;
      data.roll = Math.round(9 + (data.levels / 5));
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    let roll = new Roll('d20+@abilities.str.mod', actorData);
    let label = `Rolling ${item.name}`;
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }

    async renderAttackCard(stateData) {
        // Render the chat card template
        const token = this.actor.token;

        const templateData = {
            actor: this.actor.data,
            tokenId: token?.uuid || null,
            item: this.data,
            state: stateData,
        };

        return await renderTemplate("systems/herosystem6e/templates/chat/item-attack-card.html", templateData);
    }

    async renderDamageCard(stateData) {
        let target = stateData["target"];

        // Render the chat card template
        const token = this.actor.token;
        const targetToken = target.token;

        const templateData = {
            actor: this.actor.data,
            tokenId: token?.uuid || null,
            item: this.data,
            state: stateData,
            target: target.data,
            targetTokenId: targetToken?.uuid || null,
        };

        return await renderTemplate("systems/herosystem6e/templates/chat/item-damage-card.html", templateData);
    }

    /**
   * Display the chat card for an Item as a Chat Message
   * @param {object} options          Options which configure the display of the item chat card
   * @param {string} rollMode         The message visibility mode to apply to the created card
   * @param {boolean} createMessage   Whether to automatically create a ChatMessage entity (if true), or only return
   *                                  the prepared message data (if false)
   */
    async displayCard({ rollMode, createMessage = true } = {}) {
        const stateData = {
            canMakeHitRoll: true
        };
        const token = this.actor.token;
        let html = await this.renderAttackCard(stateData);

        // Create the ChatMessage data object
        const chatData = {
            user: game.user.data._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            flavor: this.data.data.chatFlavor || this.name,
            speaker: ChatMessage.getSpeaker({ actor: this.actor, token }),
            flags: { "core.canPopout": true, "state": stateData },
        };

        if (!this.actor.items.has(this.id)) {
            chatData["flags.hero.itemData"] = this.data;
        }

        // Apply the roll mode to adjust message visibility
        ChatMessage.applyRollMode(chatData, rollMode || game.settings.get("core", "rollMode"));

        // Create the Chat Message or return its data
        return createMessage ? ChatMessage.create(chatData) : chatData;
    }

    static chatListeners(html) {
        html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
        html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
    }

    static onMessageRendered(html) {
        html.find('.card-buttons button').each((i, button) => {
            if (button.getAttribute('data-action') != 'apply-defenses') {
                this.setCardStateAsync(button);
            }
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
        button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;

        // Validate permission to proceed with the roll
        const isValid = action === "apply-defenses";
        if (!(isValid || game.user.isGM || message.isAuthor)) return;

        // Recover the actor for the chat card
        const actor = await this._getChatCardActor(card);
        if (!actor) return;

        // Get the Item from stored flag data or by the item ID on the Actor
        const storedData = message.data["flags.hero.itemData"];
        const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
        if (!item) {
            return ui.notifications.error("Error: Item does not exist");
        }

        // Handle different actions
        switch (action) {
            case "hit-roll":
                await item.makeHitRoll(event, item); break;
            case "damage-roll":
                await item.makeDamageRoll(event, item); break;
            case "apply-defenses":
                const targets = this._getChatCardTargets(card);
                for (let token of targets) {
                    const speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token: token });
                    await item.applyDamageDefenses({ target: token.actor, state: message.data.flags["state"] });
                }
                break;
            case "damage-apply":
                const target = await this._getChatCardTarget(card);
                await item._applyDamage(target, message, message.data.flags["state"]);
                break;
        }

        // Re-enable the button
        button.disabled = false;
    }

    /* -------------------------------------------- */

    /**
     * Handle toggling the visibility of chat card content when the name is clicked
     * @param {Event} event   The originating click event
     * @private
     */
    static _onChatCardToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const card = header.closest(".chat-card");
        const content = card.querySelector(".card-content");
        content.style.display = content.style.display === "none" ? "block" : "none";
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor|null}         The Actor entity or null
     * @private
     */
    static async _getChatCardActor(card) {

        // Case 1 - a synthetic actor from a Token
        if (card.dataset.tokenId) {
            const token = await fromUuid(card.dataset.tokenId);
            if (!token) return null;
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const actorId = card.dataset.actorId;
        return game.actors.get(actorId) || null;
    }

    static async _getChatCardTarget(card) {
        // Case 1 - a synthetic actor from a Token
        if (card.dataset.targetTokenId) {
            const token = await fromUuid(card.dataset.targetTokenId);
            if (!token) return null;
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const actorId = card.dataset.targetId;
        return game.actors.get(targetId) || null;
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor[]}            An Array of Actor entities, if any
     * @private
     */
    static _getChatCardTargets(card) {
        let targets = canvas.tokens.controlled.filter(t => !!t.actor);
        if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
        if (!targets.length) ui.notifications.warn("Error: No tokens selected");
        return targets;
    }

    async makeHitRoll(event, item) {
        // Extract card data
        const button = event.currentTarget;
        button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);

        let hitCharacteristic = this.actor.data.data.characteristics[item.data.data.uses].value;

        let roll = new Roll("11 + " + hitCharacteristic + " - 3D6", this.actor.getRollData());
        let result = roll.roll();
        let renderedResult = await result.render();

        let hitRollText = "Hits a " + CONFIG.HERO.defendsWith[item.data.data.targets] + " of " + result.total;

        await item.modifyCardState(message, "canMakeHitRoll", false);
        await item.modifyCardState(message, "hasRenderedHitRoll", true);
        await item.modifyCardState(message, "canMakeDamageRoll", true);
        await item.modifyCardState(message, "renderedHitRoll", renderedResult);
        await item.modifyCardState(message, "hitRollText", hitRollText);
        await item.refreshAttackCard(message);
    }

    async makeDamageRoll(event, item) {
        // Extract card data
        const button = event.currentTarget;
        button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);

        let damageRoll = item.data.data.dice;

        switch (item.data.data.extraDice) {
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

        if (item.data.data.killing) {
            await item.modifyCardState(message, "hasStunMultiplierRoll", true);
            body = result.total;

            let stunRoll = new Roll("1D3", this.actor.getRollData());
            let stunResult = stunRoll.roll();
            let renderedStunResult = await stunResult.render();
            await item.modifyCardState(message, "renderedStunMultiplierRoll", renderedStunResult);
            await item.modifyCardState(message, "stunMultiplier", stunResult.total);
            stun = body * stunResult.total;
        }
        else {
            stun = result.total;
            body = countedBody;
        }

        await item.modifyCardState(message, "hasRenderedDamageRoll", true);
        await item.modifyCardState(message, "canMakeDamageRoll", false);
        await item.modifyCardState(message, "renderedDamageRoll", renderedResult);
        await item.modifyCardState(message, "bodyDamage", body);
        await item.modifyCardState(message, "stunDamage", stun);
        await item.modifyCardState(message, "countedBody", countedBody);
        await item.refreshAttackCard(message);
    }

    static DAMAGE_TEMPLATE = "systems/herosystem6e/templates/chat/damage-dialog.html";

    async applyDamageDefenses(options = {}) {
        let relevantDefenses = [];
        let title = "Apply Defenses";

        for (let i of options['target'].data.items) {
            if (i.data.type == 'defense') {
                if (i.data.data.defenseType == this.data.data.defense) {
                    let defense = i.data.data;
                    HeroSystem6eActorSheet._prepareDefenseItem(i, defense);
                    relevantDefenses.push(i);
                }
            }
        }

        options['width'] = 600;

        // Render the Dialog inner HTML
        const content = await renderTemplate(this.constructor.DAMAGE_TEMPLATE, {
            item: this,
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
                        callback: html => resolve(this._onDamageSubmit(html, { item: this, target: options['target'], applyToActor: false, state:options['state'] }))
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

    async _onDamageSubmit(html, options = {}) {
        let target = options['target'];
        let attack = this.data.data;
        let activeDefenses = [];

        html.find('.defense-active:checked').each((i, toggle) => {
            let defenseID = toggle.closest(".item").getAttribute('data-item-id');
            activeDefenses.push(options['target'].data.items.get(defenseID));
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

        let minimumDamage = options['state']['countedBody'];

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

        let resultantBody = attack.killing ? options['state']['bodyDamage'] - piercedResistantDefenseTotal : options['state']['bodyDamage'] - piercedDefenseTotal;
        let resultantStun = options['state']['stunDamage'] - piercedDefenseTotal;

        if (resultantBody < 0) {
            resultantBody = 0;
        }

        if (resultantStun < 0) {
            resultantStun = 0;
        }

        let reducedDamageText = target.name + " takes " + resultantBody + " BODY and " + resultantStun + " STUN";

        const stateData = {
            initialBody: options['state']['bodyDamage'],
            initialStun: options['state']['stunDamage'],
            startingDefenseText: startingDefenseText,
            piercedDefenseText: piercedDefenseText,
            penetratedDefenseText: penetratedDefenseText,
            showPiercedValues: piercedDefenseTotal < defenseTotal,
            showPenetratedValues: attack.killing ? minimumDamage > resultantBody : minimumDamage > resultantStun,
            reducedDamageText: reducedDamageText,
            finalBody: resultantBody,
            finalStun: resultantStun,
            canApplyDamage: true,
            targetID: target._id,
        };

        const token = target.token;
        let cardHtml = await this.renderDamageCard(target, stateData);

        // Create the ChatMessage data object
        const chatData = {
            user: game.user.data._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: cardHtml,
            flavor: this.data.data.chatFlavor || this.name,
            speaker: ChatMessage.getSpeaker({ actor: target, token }),
            flags: { "core.canPopout": true, "state": stateData },
        };

        if (!this.actor.items.has(this.id)) {
            chatData["flags.hero.itemData"] = this.data;
        }

        // Apply the roll mode to adjust message visibility
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));

        // Create the Chat Message or return its data
        return ChatMessage.create(chatData);
    }

    async _applyDamage(target, message, state) {
        let newBody = target.data.data.body.value - state.finalBody;
        let newStun = target.data.data.stun.value - state.finalStun;
        await target.update({
            "data.body.value": newBody,
            "data.stun.value": newStun,
        });

        await this.modifyCardState(message, "canApplyDamage", false);
        await this.modifyCardState(message, "hasAppliedDamage", true);
        await this.modifyCardState(message, "appliedDamageText", "Reduced to " + newBody + " BODY and " + newStun + " STUN");
        await this.refreshDamageCard(message);

        console.log(target);
    }

    async modifyCardState(message, state, value) {
        message.data.flags["state"][state] = value;
    }

    async refreshAttackCard(message) {
        let flags = message.data.flags;
        let html = await this.renderAttackCard(flags["state"]);
        await message.update({ content: html, flags: flags });
    }

    async refreshDamageCard(message) {
        let flags = message.data.flags;
        let html = await this.renderDamageCard(flags["state"]);
        await message.update({ content: html, flags: flags });
    }
}
