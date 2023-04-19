import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eAttackCard } from "../card/attack-card.js";
import { HeroSystem6eCard } from "../card/card.js";
import { HEROSYS } from "../herosystem6e.js";
import * as Dice from "../dice.js"
import * as Attack from "../item/item-attack.js"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class HeroSystem6eItem extends Item {

    static async chatListeners(html) {
        html.on('click', '.roll-damage', this.__onChatCardAction.bind(this));
    }

    // Perform preliminary operations before a Document of this type is created. Pre-creation operations only 
    // occur for the client which requested the operation. Modifications to the pending document before it is 
    // persisted should be performed with this.updateSource().
    async _preCreate(data, options, userId) {

        await super._preCreate(data, options, userId);

        const icons = { 
            "attack": "icons/svg/sword.svg",
            "movement": "icons/svg/pawprint.svg",
            "skill": "icons/svg/hanging-sign.svg",
            "defense": "icons/svg/shield.svg",
            "power": "icons/svg/aura.svg",
            "maneuver": "icons/svg/upgrade.svg",
        }

        // assign a default image
        if (!data.img) {
            if (icons[this.type])
            {
                this.updateSource({ img:  icons[this.type]});
            }
        }
    }


    /**
     * Augment the basic Item data model with additional dynamic data.
     */

    prepareData() {
        super.prepareData();

        

        // Get the Item's data
        // const itemData = this.data;
        // const actorData = this.actor ? this.actor.data : {};
        // const data = itemData.data;

        // if (itemData.type === 'skill') this._prepareSkillData(actorData, itemData);
        
    }

    _prepareSkillData(actorData, itemData) {
        return

        const data = itemData.data;

        let roll = 6;

        switch (data.state) {
            case "trained":
                let levels = data.levels;

                if (!data.characteristic) {
                    roll = undefined;
                } else if (data.characteristic != "general") {
                    if (actorData) {
                        levels += actorData.data.characteristics[data.characteristic].value / 5;
                    }
                }
                else {
                    roll = 11 + levels;
                }
                roll = Math.round(9 + levels);
                break;
            case "proficient":
                roll = 10;
                break;
            case "familiar":
                roll = 8;
                break;
            case "everyman":
                if (data.ps) {
                    roll = 11;
                } else {
                    roll = 8;
                }
                break;
            case "noroll":
                roll = undefined;
                break;
        }

        data.roll = Math.round(roll);
    }

    // Largely used to determine if we can drag to hotbar
    isRollable()
    {
        switch (this.type) {
            case 'attack': return true
        }
        return false
    }

    async roll()
    {
        // TODO: Move all item roll code to here (Skills, Characteristics, etc).
        if (!this.isRollable()) return;

        switch(this.type)
        {
            case "attack": 
                await Attack.AttackOptions(this)

        }

    }

    

    /**
   * Display the chat card for an Item as a Chat Message
   * @param {object} options          Options which configure the display of the item chat card
   * @param {string} rollMode         The message visibility mode to apply to the created card
   * @param {boolean} createMessage   Whether to automatically create a ChatMessage entity (if true), or only return
   *                                  the prepared message data (if false)
   */

    // async displayCard({ rollMode, createMessage = true } = {}) {
    //     switch (this.data.type) {
    //         case "attack":
    //             const attackCard = await HeroSystem6eAttackCard.createChatDataFromItem(this);
    //             ChatMessage.applyRollMode(attackCard, rollMode || game.settings.get("core", "rollMode"));
    //             return createMessage ? ChatMessage.create(attackCard) : attackCard;
    //     }
    // }

}

export function getItem(id) {
    const gameItem = game.items.get(id)
    if (gameItem) { return gameItem; }

    for (const actor of game.actors) {
        const testItem = actor.items.get(id)
        if (testItem) {
            return testItem
        }
    }

    return null
}