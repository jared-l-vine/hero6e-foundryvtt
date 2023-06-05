import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eAttackCard } from "../card/attack-card.js";
import { HeroSystem6eCard } from "../card/card.js";
import { HEROSYS } from "../herosystem6e.js";
import * as Dice from "../dice.js"
import * as Attack from "../item/item-attack.js"
import { createSkillPopOutFromItem } from '../item/skill.js'
import { enforceManeuverLimits } from '../item/manuever.js'
import { SkillRollUpdateValue } from '../utility/upload_hdc.js'


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

        if (this.type == "martialart")
        {
            console.log(this.name)
        }

        await super._preCreate(data, options, userId);

        const icons = {
            "attack": "icons/svg/sword.svg",
            "movement": "icons/svg/pawprint.svg",
            "skill": "icons/svg/hanging-sign.svg",
            "defense": "icons/svg/shield.svg",
            "power": "icons/svg/aura.svg",
            "maneuver": "icons/svg/upgrade.svg",
            "martialart": "icons/svg/downgrade.svg",
        }

        // assign a default image
        if (!data.img || data.img === 'icons/svg/item-bag.svg') {
            if (icons[this.type]) {
                this.updateSource({ img: icons[this.type] });
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
    isRollable() {
        switch (this.type) {
            case 'attack': return true
            case 'skill': return true
            case 'defense': return true
        }
        return false
    }

    async roll() {
        //if (!this.isRollable()) return;

        switch (this.type) {
            case "attack":
                return await Attack.AttackOptions(this)
            case "defense":
                return this.toggle()
            case "skill":
                SkillRollUpdateValue(this)
                return createSkillPopOutFromItem(this, this.actor)
            default: ui.notifications.warn(`${this.name} roll is not supported`)
        }

    }

    async toggle() {
        let item = this
        const attr = 'system.active'
        const newValue = !getProperty(item, attr)
        await item.update({ [attr]: newValue })

        switch (this.type) {
            case "defense":
                // Check for associated ActiveEffects
                for (const activeEffect of item.actor.effects.filter(o => o.origin === item.uuid)) {
                    await activeEffect.update({ disabled: !item.system.active })
                    for (let change of activeEffect.changes) {
                        const key = change.key.match(/characteristics\.(.*)\./)[1]
                        const max = item.actor.system.characteristics[key].max
                        if (item.system.active) {
                            let value = parseInt(item.actor.system.characteristics[key].value)
                            const levels = change?.value
                            if (levels) {
                                value += parseInt(levels)
                                await item.actor.update({ [`system.characteristics.${key}.value`]: value })
                            }

                        }

                        if (item.actor.system.characteristics[key].value > max) {
                            await item.actor.update({ [`system.characteristics.${key}.value`]: max })
                        }

                    }

                }
                break;

            case "power":
                for (const activeEffect of item.actor.effects.filter(o => o.origin === item.uuid)) {
                    await activeEffect.update({ disabled: !item.system.active })
                    for (let change of activeEffect.changes) {
                        const key = change.key.match(/characteristics\.(.*)\./)[1]
                        const max = item.actor.system.characteristics[key].max
                        if (item.system.active) {
                            let value = parseInt(item.actor.system.characteristics[key].value)
                            const levels = change?.value
                            if (levels) {
                                value += parseInt(levels)
                                await item.actor.update({ [`system.characteristics.${key}.value`]: value })
                            }
                        }
                        if (item.actor.system.characteristics[key].value > max) {
                            await item.actor.update({ [`system.characteristics.${key}.value`]: max })
                        }
                    }
                }
                break;
            case "maneuver":
                await enforceManeuverLimits(this.actor, item.id, item.name)
                await updateCombatAutoMod(item.actor, item)
                break;
            case "equipment":
                // Do nothing special for now.
                // Weight/encumbrance will automtically be calculated.
                // TODO: tie defensive/buff items into equipment.
                break;
            default: ui.notifications.warn(`${this.name} toggle may be incompmlete`)
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

async function updateCombatAutoMod(actor, item) {
    const changes = []

    let ocvEq = 0
    let dcvEq = '+0'

    function dcvEquation(dcvEq, newDcv) {
        if (dcvEq.includes('/') && !newDcv.includes('/')) {
            // don't modify dcvEq
        } else if (!dcvEq.includes('/') && newDcv.includes('/')) {
            dcvEq = newDcv
        } else if (parseFloat(dcvEq) <= parseFloat(newDcv)) {
            dcvEq = newDcv
        } else {
            dcvEq = Math.round(parseFloat(dcvEq) + parseFloat(newDcv)).toString()
        }

        return dcvEq
    }

    for (const i of actor.items) {
        if (i.system.active && i.type === 'maneuver') {
            ocvEq = ocvEq + parseInt(i.system.ocv)

            dcvEq = dcvEquation(dcvEq, i.system.dcv)
        }

        if ((i.type === 'power' || i.type === 'equipment') && ("items" in i.system) && ('maneuver' in i.system.items)) {
            for (const [key, value] of Object.entries(i.system.items.maneuver)) {
                if (value.type && value.visible && value.active) {
                    ocvEq = ocvEq + parseInt(value.ocv)

                    dcvEq = dcvEquation(dcvEq, value.dcv)
                }
            }
        }
    }

    if (isNaN(ocvEq)) {
        ocvEq = item.system.ocv
    } else if (ocvEq >= 0) {
        ocvEq = '+' + ocvEq.toString()
    } else {
        ocvEq = ocvEq.toString()
    }

    changes['system.characteristics.ocv.autoMod'] = ocvEq
    changes['system.characteristics.omcv.autoMod'] = ocvEq;
    changes['system.characteristics.dcv.autoMod'] = dcvEq
    changes['system.characteristics.dmcv.autoMod'] = dcvEq;

    changes['system.characteristics.ocv.value'] = actor.system.characteristics.ocv.max + parseInt(ocvEq)
    changes['system.characteristics.omcv.value'] = actor.system.characteristics.omcv.max + parseInt(ocvEq);

    if (dcvEq.includes('/')) {
        changes['system.characteristics.dcv.value'] = Math.round(actor.system.characteristics.dcv.max * (parseFloat(dcvEq.split('/')[0]) / parseFloat(dcvEq.split('/')[1])))
        changes['system.characteristics.dmcv.value'] = Math.round(actor.system.characteristics.dmcv.max * (parseFloat(dcvEq.split("/")[0]) / parseFloat(dcvEq.split("/")[1])));
    } else {
        changes['system.characteristics.dcv.value'] = actor.system.characteristics.dcv.max + parseInt(dcvEq)
        changes['system.characteristics.dmcv.value'] = actor.system.characteristics.dmcv.max + parseInt(dcvEq);
    }

    await actor.update(changes)


}