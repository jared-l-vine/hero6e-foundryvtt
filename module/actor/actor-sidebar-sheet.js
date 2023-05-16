import { HERO } from '../config.js'
import { determineDefense } from "../utility/defense.js";
import { HeroSystem6eItem } from '../item/item.js'
import { presenceAttackPopOut } from '../utility/presence-attack.js'
import { applyCharacterSheet } from '../utility/upload_hdc.js'

export class HeroSystem6eActorSidebarSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["actor-sidebar-sheet"],
            template: "systems/hero6efoundryvttv2/templates/actor-sidebar/actor-sidebar-sheet.hbs",
            //width: 600,
            //height 600,
            tabs: [{ navSelector: ".sheet-navigation", contentSelector: ".sheet-body", initial: "Attacks" }],
            scrollY: [".sheet-body"],
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

                // Convert dice to pips
                let pips = item.system.dice * 3;
                switch (item.system.extraDice) {
                    case 'pip':
                        pips += 1;
                        break
                    case 'half':
                        pips += 2;
                        break
                }

                // Add in STR
                if (item.system.usesStrength)
                {
                    let str = Math.floor(data.actor.system.characteristics.str.value / 5)
                    if (item.system.killing) {
                        pips += str
                    } else
                    {
                        pips += str * 3
                    }
                }

                // Convert pips to DICE
                let fullDice = Math.floor(pips/3)
                let extraDice = pips - fullDice * 3

                // text descrdiption of damage
                item.system.damage = fullDice
                switch (extraDice) {
                    case 0:
                        item.system.damage += 'D6'
                        break
                    case 1:
                        item.system.damage += 'D6+1'
                        break
                    case 2:
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
                item.system.description = CONFIG.HERO.defenseTypes[item.system.defenseType]
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

        // Defense
        let defense = {}
        // Defense PD
        let pdAttack = {
            system: {
                class: "physical"
            }
        }

        let [defenseValue, resistantValue, impenetrableValue, damageReductionValue, damageNegationValue, knockbackResistance, defenseTags] = determineDefense(this.actor, pdAttack)
        defense.PD = defenseValue
        defense.rPD = resistantValue
        // Defense ED
        let edAttack = {
            system: {
                class: "energy"
            }
        }
        let [defenseValueE, resistantValueE, impenetrableValueE, damageReductionValueE, damageNegationValueE, knockbackResistanceE, defenseTagsE] = determineDefense(this.actor, edAttack)
        defense.ED = defenseValueE
        defense.rED = resistantValueE
        // Defense MD
        let mdAttack = {
            system: {
                class: "mental"
            }
        }
        let [defenseValueM, resistantValueM, impenetrableValueM, damageReductionValueM, damageNegationValueM, knockbackResistanceM, defenseTagsM] = determineDefense(this.actor, mdAttack)
        defense.MD = defenseValueM
        defense.rMD = resistantValueM
        data.defense = defense

        return data
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html)

        // Rollable items
        html.find('.item-rollable').click(this._onItemRoll.bind(this))

        // Rollable characteristic
        html.find('.characteristic-roll').click(this._onCharacteristicRoll.bind(this))

        // Toggle items
        html.find('.item-toggle').click(this._onItemToggle.bind(this))

        // Edit Items
        html.find('.item-edit').click(this._onItemEdit.bind(this))

        // Delete Items
        html.find('.item-delete').click(this._onItemDelete.bind(this))

        // Create Items
        html.find('.item-create').click(this._onItemcreate.bind(this))

        // Upload HDC file
        html.find('.upload-button').change(this._uploadCharacterSheet.bind(this))

        html.find('.recovery-button').click(this._onRecovery.bind(this))
        html.find('.presence-button').click(this._onPresenseAttack.bind(this))

        // Drag events for macros.
        if (this.actor.isOwner) {
            const handler = ev => this._onDragStart(ev)

            html.find('tr.item').each((i, el) => {
                el.setAttribute('draggable', true)
                el.addEventListener('dragstart', handler, false)
            })
        }

    }

    async _onItemRoll(event) {
        event.preventDefault()
        console.log("_onItemRoll")
        const itemId = $(event.currentTarget).closest("[data-item-id]").data().itemId
        const item = this.actor.items.get(itemId)
        item.roll()
    }

    async _onCharacteristicRoll(event) {
        event.preventDefault()
        const element = event.currentTarget.closest("button")
        const dataset = element.dataset
        const charRoll = parseInt(element.textContent.slice(0, -1))


        if (dataset.roll) {
            const actor = this.actor

            const roll = new Roll(dataset.roll, this.actor.getRollData())
            roll.evaluate({ async: true }).then(function (result) {
                // let margin = actor.system.characteristics[dataset.label].roll - result.total;
                const margin = charRoll - result.total

                result.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    flavor: dataset.label.toUpperCase() + ' roll ' + (margin >= 0 ? 'succeeded' : 'failed') + ' by ' + Math.abs(margin),
                    borderColor: margin >= 0 ? 0x00FF00 : 0xFF0000
                })
            })
        }

    }

    async _onItemToggle(event) {
        event.preventDefault()
        const itemId = $(event.currentTarget).closest("[data-item-id]").data().itemId
        const item = this.actor.items.get(itemId)
        item.toggle()
    }

    async _onItemEdit(event) {
        const itemId = $(event.currentTarget).closest("[data-item-id]").data().itemId
        const item = this.actor.items.get(itemId)
        item.sheet.render(true)
    }

    async _onItemDelete(event) {
        const itemId = $(event.currentTarget).closest("[data-item-id]").data().itemId
        const item = this.actor.items.get(itemId)
        const confirmed = await Dialog.confirm({
            title: game.i18n.localize("HERO6EFOUNDRYVTTV2.confirms.deleteConfirm.Title"),
            content: game.i18n.localize("HERO6EFOUNDRYVTTV2.confirms.deleteConfirm.Content")
        });

        if (confirmed) {
            item.delete()
            this.render();
        }
    }

    async _onItemcreate(event) {
        event.preventDefault()
        const header = event.currentTarget
        // Get the type of item to create.
        const type = header.dataset.type
        // Grab any data associated with this control.
        const data = duplicate(header.dataset)
        // Initialize a default name.
        const name = `New ${type.capitalize()}`

        // Prepare the item object.
        const itemData = {
            name,
            type,
            system: data
        }
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.system.type

        // Finally, create the item!
        return await HeroSystem6eItem.create(itemData, { parent: this.actor })
    }

    async _onRecovery(event) {
        const chars = this.actor.system.characteristics

        let newStun = parseInt(chars.stun.value) + parseInt(chars.rec.value)
        let newEnd = parseInt(chars.end.value) + parseInt(chars.rec.value)

        if (newStun > chars.stun.max) {
            newStun = chars.stun.max
        }

        if (newEnd > chars.end.max) {
            newEnd = chars.end.max
        }

        await this.actor.update({
            'system.characteristics.stun.value': newStun,
            'system.characteristics.end.value': newEnd
        })

        let token = this.actor.token
        let speaker = ChatMessage.getSpeaker({ actor: this.actor, token })
        speaker["alias"] = this.actor.name

        const chatData = {
            user: game.user._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: this.actor.name + ' recovers!',
            speaker: speaker
        }

        return ChatMessage.create(chatData)
    }

    _onPresenseAttack(event) {
        presenceAttackPopOut(this.actor)
    }

    async _uploadCharacterSheet(event) {
        const file = event.target.files[0]
        if (!file) {
            return
        }
        const reader = new FileReader()
        reader.onload = function (event) {
            const contents = event.target.result

            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(contents, 'text/xml')
            applyCharacterSheet.bind(this)(xmlDoc)
        }.bind(this)
        reader.readAsText(file)
    }

}