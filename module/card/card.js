import { HeroSystem6eItem } from "../item/item.js";

export class HeroSystem6eCard {
    constructor() {
        
    }

    async init(card) {
        this.cardData = card;

        const messageId = card.closest(".message").dataset.messageId;
        this.message = game.messages.get(messageId);

        // Recover the actor for the chat card
        this.actor = await HeroSystem6eCard._getChatCardActor(this.cardData);
        if (!this.actor) return;

        // Get the Item from stored flag data or by the item ID on the Actor
        //const storedData = this.message.data["flags.hero.itemData"];
        const storedData = this.message.flags?.hero?.itemData;

        this.item = storedData ? new HeroSystem6eItem(storedData, { parent: actor }) : this.actor.items.get(this.cardData.dataset.itemId);
        if (!this.item) {
            return ui.notifications.error("Error: Item does not exist");
        }
    }

    static chatListeners(html) {
        html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
    }

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

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor[]}            An Array of Actor entities, if any
     * @private
     */
    static _getChatCardTargets() {
        let targets = canvas.tokens.controlled.filter(t => !!t.actor);
        if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
        if (!targets.length) ui.notifications.warn("Error: No tokens selected");
        return targets;
    }

    async modifyCardState(state, value) {
        this.message.data.flags["state"][state] = value;
    }

    async refresh() {
        let html = await this.render();
        await this.message.update({ content: html, flags: this.message.data.flags });
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

    static async toggleStatusEffect(target, effectData) {
        if (!target || !effectData.id) return false;
        let state = false;

        // Remove an existing effect
        const existing = target.effects.find(e => e.getFlag("core", "statusId") === effectData.id);
        if (existing) {
            await existing.delete();
            // FIXME: The duplicate call is temporarily needed to de-dupe legacy tokens. Remove in 0.9.0
            await this.toggleEffect(effectData.icon, { active: false, overlay });
        }

        // Add a new effect
        else {
            const createData = foundry.utils.deepClone(effectData);
            createData.label = game.i18n.localize(effectData.label);
            createData["flags.core.statusId"] = effectData.id;
            delete createData.id;
            const cls = getDocumentClass("ActiveEffect");
            await cls.create(createData, { parent: target });
            state = true;
        }
        return state;
    }

    static async removeStatusEffect(target, effectData) {
        if (!target || !effectData.id) return false;
        let state = false;

        // Remove an existing effect
        const existing = target.effects.find(e => e.getFlag("core", "statusId") === effectData.id);
        if (existing) {
            await existing.delete();
            // FIXME: The duplicate call is temporarily needed to de-dupe legacy tokens. Remove in 0.9.0

            for (let token of target.getActiveTokens()) {
                await token.toggleEffect(effectData.icon, { active: false });
            }
        }

        return state;
    }

    static async applyStatusEffect(target, effectData) {
        if (!target || !effectData.id) return false;
        let state = false;

        // Remove an existing effect
        const existing = target.effects.find(e => e.getFlag("core", "statusId") === effectData.id);
        if (!existing) {
            const createData = foundry.utils.deepClone(effectData);
            createData.label = game.i18n.localize(effectData.label);
            createData["flags.core.statusId"] = effectData.id;
            delete createData.id;
            const cls = getDocumentClass("ActiveEffect");
            await cls.create(createData, { parent: target });
            state = true;

            for (let token of target.getActiveTokens()) {
                if (token.hasActiveHUD) token.layer.hud.render();
            }
        }
        return state;
    }
}