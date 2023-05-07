import { HERO } from '../config.js'

export class HeroSystem6eActorSidebarSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["actor-sidebar-sheet"],
            template: "systems/hero6efoundryvttv2/templates/actor-sidebar/actor-sidebar-sheet.hbs",
            //width: 600,
            //height: 600,
            tabs: [{ navSelector: ".sheet-navigation", contentSelector: ".sheet-body", initial: "Attacks" }],
        });
    }

    /** @override */
    getData() {
        const data = super.getData()

        // Equipment is uncommon.  If there isn't any equipment, then don't show the navigation tab.
        data.hasEquipment = false

        // override actor.items (which is a map) to an array with some custom properties
        let items = []
        for (let item of data.actor.items) {

            // showToggle
            if (data.actor.effects.find(o => o.origin === this.actor.items.get(item._id).uuid)) {
                item.system.showToggle = true
            }

            // Damage
            if (item.type == 'attack') {
                item.system.damage = item.system.dice
                switch (item.system.extraDice) {
                    case 'zero':
                        item.system.damage += 'D6'
                        break
                    case 'pip':
                        item.system.damage += 'D6+1'
                        break
                    case 'half':
                        item.system.damage += '.5D6'
                        break
                }
                if (item.system.killing) {
                    item.system.damage += 'K'
                } else {
                    item.system.damage += 'N'
                }
            }

            // Defense
            if (item.type == 'defense') {
                item.system.defenseType = CONFIG.HERO.defenseTypes[item.system.defenseType]
            }

            if (item.type == 'equipment') {
                data.hasEquipment = true
            }

            items.push(item)
        }
        data.items = items;

        // Characteristics
        const characteristicSet = []

        for (const [key, characteristic] of Object.entries(data.actor.system.characteristics)) {
            characteristic.key = key
            characteristic.name = CONFIG.HERO.characteristics[key]
            if (characteristic.type === 'rollable') {
                if (characteristic.value === 0) {
                    characteristic.roll = 8
                } else if (characteristic.value <= 2) {
                    characteristic.roll = 9
                } else if (characteristic.value <= 7) {
                    characteristic.roll = 10
                } else if (characteristic.value <= 12) {
                    characteristic.roll = 11
                } else if (characteristic.value <= 17) {
                    characteristic.roll = 12
                } else if (characteristic.value <= 22) {
                    characteristic.roll = 13
                } else if (characteristic.value <= 27) {
                    characteristic.roll = 14
                } else if (characteristic.value <= 32) {
                    characteristic.roll = 15
                } else if (characteristic.value <= 37) {
                    characteristic.roll = 16
                } else if (characteristic.value <= 42) {
                    characteristic.roll = 17
                } else if (characteristic.value <= 47) {
                    characteristic.roll = 18
                } else if (characteristic.value <= 52) {
                    characteristic.roll = 19
                } else {
                    characteristic.roll = 20
                }
            }
            characteristicSet.push(characteristic)
        }
        data.characteristicSet = characteristicSet

        return data
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html)

        // Rollable items
        html.find('.item-rollable').click(this._onItemRoll.bind(this))

        // Rollable characteristic
        html.find('.characteristic-roll').click(this._onCharacteristicRoll.bind(this))

        // Tobggle items
        html.find('.item-toggle').click(this._onItemToggle.bind(this))

        // Update Items
        html.find('.item-edit').click(this._onItemEdit.bind(this))

        // Delete Items
        html.find('.item-delete').click(this._onItemDelete.bind(this))

        // Add Items
        html.find('.item-create').click(this._onItemcreate.bind(this))

    }

    _onItemRoll(event) {
        console.log("_onItemRoll", event)
    }

    _onCharacteristicRoll(event) {
        console.log("_onCharacteristicRoll", event)
    }

    _onItemToggle(event) {
        console.log("_onItemToggle", event)
    }

    _onItemEdit(event) {
        console.log("_onItemEdit", event)
    }

    _onItemDelete(event) {
        console.log("_onItemDelete", event)
    }

    _onItemcreate(event) {
        console.log("_onItemcreate", event)
    }

}