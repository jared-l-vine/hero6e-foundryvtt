import { HERO } from '../config.js'
import { determineDefense } from "../utility/defense.js";
import { HeroSystem6eItem } from '../item/item.js'
import { presenceAttackPopOut } from '../utility/presence-attack.js'
import { applyCharacterSheet, SkillRollUpdateValue } from '../utility/upload_hdc.js'

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


        // Equipment & MartialArts are uncommon.  If there isn't any, then don't show the navigation tab.
        data.hasEquipment = false
        data.hasMartialArts = false

        // override actor.items (which is a map) to an array with some custom properties
        let items = []
        for (let item of data.actor.items) {

            // showToggle
            if (data.actor.effects.find(o => o.origin === this.actor.items.get(item._id).uuid)) {
                item.system.showToggle = true
            }

            // Endurance
            item.system.endEstimate = item.system.end;

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
                if (item.system.usesStrength) {
                    let str = data.actor.system.characteristics.str.value
                    let str5 = Math.floor(str / 5)
                    if (item.system.killing) {
                        pips += str5
                    } else {
                        pips += str5 * 3
                    }

                    // Endurance
                    let strEnd = Math.max(1, Math.round(str / 10))
                    item.system.endEstimate += strEnd
                }

                // Add in TK
                if (item.system.usesTk) {

                    let tkItems = data.actor.items.filter(o => o.system.rules == "TELEKINESIS");
                    let str = 0
                    for (const item of tkItems) {
                        str += parseInt(item.system.LEVELS) || 0
                    }
                    let str5 = Math.floor(str / 5)
                    if (item.system.killing) {
                        pips += str5
                    } else {
                        pips += str5 * 3
                    }

                    // Endurance
                    let strEnd = Math.max(1, Math.round(str / 10))
                    item.system.endEstimate += strEnd
                }

                // Convert pips to DICE
                let fullDice = Math.floor(pips / 3)
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

                // Signed OCV and DCV
                if (item.system.ocv != undefined) {
                    item.system.ocv = ("+" + parseInt(item.system.ocv)).replace("+-", "-")
                }
                if (item.system.dcv != undefined) {
                    item.system.dcv = ("+" + parseInt(item.system.dcv)).replace("+-", "-")
                }


            }

            // Defense
            if (item.type == 'defense') {
                item.system.description = CONFIG.HERO.defenseTypes[item.system.defenseType]
            }

            if (item.type == 'martialart') {
                console.log(item.system)
                data.hasMartialArts = true
            }

            if (item.type == 'equipment') {
                data.hasEquipment = true
            }

            if (item.type == 'skill') {
                SkillRollUpdateValue(item)
            }

            items.push(item)
        }
        data.items = items;

        // Characteristics
        const characteristicSet = []

        for (const [key, characteristic] of Object.entries(data.actor.system.characteristics)) {
            characteristic.key = key
            if (!CONFIG.HERO.characteristicCosts[key]) continue;
            characteristic.name = CONFIG.HERO.characteristics[key]
            characteristic.base = CONFIG.HERO.characteristicDefaults[key]
            characteristic.cost = Math.ceil((characteristic.core - characteristic.base) * CONFIG.HERO.characteristicCosts[key])
            if (isNaN(characteristic.cost)) {
                characteristic.cost = "";
            }
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

            // Notes
            if (key == 'str') {
                let _lift = 0;
                let _throw = 0;
                if (characteristic.value >= 1) { _lift = '8kg'; _throw = 2 }
                if (characteristic.value >= 2) { _lift = '16kg'; _throw = 3 }
                if (characteristic.value >= 3) { _lift = '25kg'; _throw = 4 }
                if (characteristic.value >= 4) { _lift = '38kg'; _throw = 6 }
                if (characteristic.value >= 5) { _lift = '50kg'; _throw = 8 }
                if (characteristic.value >= 8) { _lift = '75kg'; _throw = 12 }
                if (characteristic.value >= 10) { _lift = '16kg'; _throw = 16 }
                if (characteristic.value >= 13) { _lift = '150kg'; _throw = 20 }
                if (characteristic.value >= 15) { _lift = '200kg'; _throw = 24 }
                if (characteristic.value >= 18) { _lift = '300kg'; _throw = 28 }
                if (characteristic.value >= 20) { _lift = '400kg'; _throw = 32 }
                if (characteristic.value >= 23) { _lift = '600kg'; _throw = 36 }
                if (characteristic.value >= 25) { _lift = '800kg'; _throw = 40 }
                if (characteristic.value >= 28) { _lift = '1,200kg'; _throw = 44 }
                if (characteristic.value >= 30) { _lift = '1,600kg'; _throw = 48 }
                if (characteristic.value >= 35) { _lift = '3,200kg'; _throw = 56 }
                if (characteristic.value >= 40) { _lift = '6,400kg'; _throw = 64 }
                if (characteristic.value >= 45) { _lift = '12.5 tons'; _throw = 72 }
                if (characteristic.value >= 50) { _lift = '25 tons'; _throw = 80 }
                if (characteristic.value >= 55) { _lift = '50 tons'; _throw = 88 }
                if (characteristic.value >= 60) { _lift = '100 tons'; _throw = 96 }
                if (characteristic.value >= 65) { _lift = '200 tons'; _throw = 104 }
                if (characteristic.value >= 70) { _lift = '400 tons'; _throw = 112 }
                if (characteristic.value >= 75) { _lift = '800 tons'; _throw = 120 }
                if (characteristic.value >= 80) { _lift = '1.6 ktons'; _throw = 128 }
                if (characteristic.value >= 85) { _lift = '3.2 ktons'; _throw = 136 }
                if (characteristic.value >= 90) { _lift = '6.4 ktons'; _throw = 144 }
                if (characteristic.value >= 95) { _lift = '12.5 ktons'; _throw = 152 }
                if (characteristic.value >= 100) { _lift = '25 ktons'; _throw = 160 }
                if (characteristic.value >= 105) { _lift = '50+ ktons'; _throw = '168+' }

                characteristic.notes = `lift ${_lift}, throw ${_throw}m`
            }
            if (key == 'leaping') characteristic.notes = `${characteristic.value}m forward, ${Math.round(characteristic.value / 2)}m upward`

            characteristicSet.push(characteristic)
        }
        data.characteristicSet = characteristicSet

        // Defense (create fake attacks and get defense results)
        let defense = {}

        // Defense PD
        let pdAttack = {
            system: {
                class: "physical"
            }
        }
        let [defenseValue, resistantValue, impenetrableValue, damageReductionValue, damageNegationValue, knockbackResistance, defenseTagsP] = determineDefense(this.actor, pdAttack)
        defense.PD = defenseValue
        defense.rPD = resistantValue
        defense.PDtags = "";
        defense.rPDtags = "";
        for (let tag of defenseTagsP) {
            if (tag.resistant) {
                defense.rPDtags += `${tag.value} ${tag.title}\n`
            }
            else if (tag.resistant != undefined) {
                defense.PDtags += `${tag.value} ${tag.title}\n`
            }
        }

        // Defense ED
        let edAttack = {
            system: {
                class: "energy"
            }
        }
        let [defenseValueE, resistantValueE, impenetrableValueE, damageReductionValueE, damageNegationValueE, knockbackResistanceE, defenseTagsE] = determineDefense(this.actor, edAttack)
        defense.ED = defenseValueE
        defense.rED = resistantValueE
        defense.EDtags = "";
        defense.rEDtags = "";
        for (let tag of defenseTagsE) {
            if (tag.resistant) {
                defense.rEDtags += `${tag.value} ${tag.title}\n`
            }
            else if (tag.resistant != undefined) {
                defense.EDtags += `${tag.value} ${tag.title}\n`
            }
        }

        // Defense MD
        let mdAttack = {
            system: {
                class: "mental"
            }
        }
        let [defenseValueM, resistantValueM, impenetrableValueM, damageReductionValueM, damageNegationValueM, knockbackResistanceM, defenseTagsM] = determineDefense(this.actor, mdAttack)
        defense.MD = defenseValueM
        defense.rMD = resistantValueM
        defense.MDtags = "";
        defense.rMDtags = "";
        for (let tag of defenseTagsM) {
            if (tag.resistant) {
                defense.rMDtags += `${tag.value} ${tag.title}\n`
            }
            else if (tag.resistant != undefined) {
                defense.MDtags += `${tag.value} ${tag.title}\n`
            }
        }

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

        // Shouldn't happen, but you never know
        if (isNaN(parseInt(chars.stun.value))) {
            chars.stun.value = 0
        }
        if (isNaN(parseInt(chars.end.value))) {
            chars.end.value = 0
        }

        let newStun = parseInt(chars.stun.value) + parseInt(chars.rec.value)
        let newEnd = parseInt(chars.end.value) + parseInt(chars.rec.value)



        if (newStun > chars.stun.max) {
            newStun = Math.max(chars.stun.max, parseInt(chars.stun.value)) // possible > MAX (which is OKish)
        }
        let deltaStun = newStun - parseInt(chars.stun.value)

        if (newEnd > chars.end.max) {
            newEnd = Math.max(chars.end.max, parseInt(chars.end.value)) // possible > MAX (which is OKish)
        }
        let deltaEnd = newEnd - parseInt(chars.end.value)

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
            content: this.actor.name + ` <span title="
Recovering is a Full Phase Action and occurs at the end of
the Segment (after all other characters who have a Phase that
Segment have acted). A character who Recovers during a Phase
may do nothing else. He cannot even maintain a Constant Power
or perform Actions that cost no END or take no time. However,
he may take Zero Phase Actions at the beginning of his Phase
to turn off Powers, and Persistent Powers that don't cost END
remain in effect."><i>Takes a Recovery</i></span>, gaining ${deltaEnd} endurance and ${deltaStun} stun.`,
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