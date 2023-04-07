import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eAttackCard } from "../card/attack-card.js";
import { HeroSystem6eCard } from "../card/card.js";
import { HEROSYS } from "../herosystem6e.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class HeroSystem6eItem extends Item {

    chatTemplate = {
        "attack": "systems/hero6efoundryvttv2/templates/attack/item-attack-card.hbs",
        "default": "systems/hero6efoundryvttv2/templates/chat/default-card.hbs"
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
        console.log("roll", this)

        // Attacks will be done in 4 parts
        // 1. Prompt for modifiers
        // 2. Roll To-Hit vs target(s)
        // 3. Roll Damage
        // 4. Apply Damage

        // Prompt for modifiers
        //await HeroSystem6eAttackCard.createAttackPopOutFromItem(this, this.actor, this._id, 2)


        // const dialogData = {
		// 	title: "Roll to Hit",
		// 	buttons: {
		// 		rollToHit: {
		// 			label: "Roll to Hit",
		// 			callback: () => console.log("rollToHit")
		// 		},
		// 	},
		// 	default: "rollToHit",
		// 	close: () => resolve({})
		// }

        //const template = "systems/hero6efoundryvttv2/templates/chat/item-toHit-card.hbs"
        //dialogData.content = await renderTemplate(template, {})

        //new Dialog(dialogData).render(true)

        // let d = new Dialog({
        //     title: "Test Dialog",
        //     content: "<p>You must choose either Option 1, or Option 2</p>",
        //     buttons: {
        //      one: {
        //       icon: '<i class="fas fa-check"></i>',
        //       label: "Option One",
        //       callback: () => console.log("Chose One")
        //      },
        //      two: {
        //       icon: '<i class="fas fa-times"></i>',
        //       label: "Option Two",
        //       callback: () => console.log("Chose Two")
        //      }
        //     },
        //     default: "two",
        //     render: html => console.log("Register interactivity in the rendered dialog"),
        //     close: html => console.log("This always is logged no matter which option is chosen")
        //    });
        //    d.render(true);

        return

        let r = await new Roll("3d6").roll({async:true})

        let chatData = {

            // Dice so Nice requires type=roll and rolls.
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [r],
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            //speaker: ChatMessage.getSpeaker({ alias: this.actor.name }), // Default alias is Attack Name, we want Actor Name
        }

        let cardData = {
            ...this.system,
            owner: this.actor.id,
            item: this,
            actor: this.actor
        }

        chatData.content = await renderTemplate(this.chatTemplate[this.type] || this.chatTemplate["default"], cardData)

        // Set RollMode to PUBLIC instead of default (whatever is selected on chat dropdown).
        // ApplyRollMode isn't working, no apparent way to override, not really important at the moment.
        // ChatMessage.applyRollMode(chatData, "publicroll") //CONST.DICE_ROLL_MODES.PUBLIC)

        return ChatMessage.create(chatData)
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