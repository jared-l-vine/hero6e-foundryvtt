export class HeroSystem6eCard {
    constructor(obj) {
        obj && Object.assign(this, obj);
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