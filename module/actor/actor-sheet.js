import { HeroSystem6eItem } from '../item/item.js'
import { HeroSystem6eAttackCard } from '../card/attack-card.js'
import { createSkillPopOutFromItem } from '../item/skill.js'
import { editSubItem, deleteSubItem } from '../powers/powers.js'
import { enforceManeuverLimits } from '../item/manuever.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HeroSystem6eActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions () {
    const path = 'systems/hero6efoundryvttv2/templates/actor/actor-sheet.html'

    return mergeObject(super.defaultOptions, {
      classes: ['herosystem6e', 'sheet', 'actor'],
      template: path,
      width: 800,
      height: 700,
      tabs: [
        { navSelector: '.sheet-item-tabs', contentSelector: '.sheet-body', initial: 'description' },
        { navSelector: '.sheet-edit-tabs', contentSelector: '.sheet-mode', initial: 'play' }
      ]
    })
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()
    data.dtypes = ['String', 'Number', 'Boolean']

    const actorData = this.actor.data.toObject(false)
    data.actor = actorData
    data.data = actorData.data
    data.rollData = this.actor.getRollData.bind(this.actor)

    data.items = actorData.items
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0))

    // Prepare items.
    if (this.actor.data.type === 'character') {
      this._prepareCharacterItems(data)
    }

    return data
  }

  /**
  * Organize and classify Items for Character sheets.
  *
  * @param {Object} actorData The actor to prepare.
  *
  * @return {undefined}
  */
  _prepareCharacterItems (sheetData) {
    const actorData = sheetData.actor

    const characteristicSet = []

    for (const [key, characteristic] of Object.entries(actorData.system.characteristics)) {
      characteristic.key = key
      characteristic.name = CONFIG.HERO.characteristics[key]

      let type = 'undefined'

      if (characteristic.type !== undefined) {
        type = characteristic.type
      }

      if (characteristicSet[type] === undefined) {
        characteristicSet[type] = []
      }

      if (type === 'rollable') {
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

      characteristicSet[type].push(characteristic)
    }

    // Initialize containers.
    const skills = []
    const attacks = []
    const defenses = []
    const powers = []
    const equipment = []
    const maneuvers = []
    const movement = []
    const perk = []
    const talent = []
    const complication = []
    const martialart = []

    const orphanedSkills = []
    const skillIndex = []

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (const i of sheetData.items) {
      const item = i.data
      i.img = i.img || DEFAULT_TOKEN
      // Append to skills.
      if (i.type === 'skill') {
        i.characteristic = CONFIG.HERO.skillCharacteristics[item.characteristic]
        i.roll = item.roll
        i.rollable = item.rollable

        if (!item.parentid) {
          skills.push(i)
          skillIndex[item.hdcid] = i

          if (orphanedSkills[item.hdcid]) {
            i.children = orphanedSkills[item.hdcid]
          }
        } else {
          if (skillIndex[item.parentid]) {
            if (!skillIndex[item.parentid].children) {
              skillIndex[item.parentid].children = []
            }

            skillIndex[item.parentid].children.push(i)
          } else {
            if (!orphanedSkills[item.parentid]) {
              orphanedSkills[item.parentid] = []
            }

            orphanedSkills[item.parentid].push(i)
          }
        }
      } else if (i.type === 'defense') {
        HeroSystem6eActorSheet._prepareDefenseItem(i, item)
        defenses.push(i)
      } else if (i.type === 'attack') {
        i.data = item
        i.defense = CONFIG.HERO.defenseTypes[item.defense]
        i.piercing = item.piercing
        i.penetrating = item.penetrating
        i.advantages = item.advantages
        i.uses = CONFIG.HERO.attacksWith[item.uses]
        i.targets = CONFIG.HERO.defendsWith[item.targets]
        i.end = item.end
        i.toHitMod = item.toHitMod
        i.knockback = item.knockback
        i.usesStrength = item.usesStrength

        i.damage = item.dice

        switch (item.extraDice) {
          case 'zero':
            i.damage += 'D6'
            break
          case 'pip':
            i.damage += 'D6+1'
            break
          case 'half':
            i.damage += '.5D6'
            break
        }

        if (item.killing) {
          i.damage += 'K'
        } else {
          i.damage += 'N'
        }

        attacks.push(i)
      } else if (i.type === 'power') {
        powers.push(i)
      } else if (i.type === 'equipment') {
        equipment.push(i)
      } else if (i.type === 'maneuver') {
        maneuvers.push(i)
      } else if (i.type === 'movement') {
        movement.push(i)
      } else if (i.type === 'perk') {
        perk.push(i)
      } else if (i.type === 'talent') {
        talent.push(i)
      } else if (i.type === 'complication') {
        complication.push(i)
      } else if (i.type === 'martialart') {
        martialart.push(i)
      }
    }

    // Assign and return
    sheetData.skills = skills
    sheetData.defenses = defenses
    sheetData.attacks = attacks
    sheetData.powers = powers
    sheetData.equipment = equipment
    sheetData.maneuvers = maneuvers
    sheetData.movement = movement
    sheetData.perk = perk
    sheetData.talent = talent
    sheetData.complication = complication
    sheetData.martialart = martialart
    sheetData.characteristicSet = characteristicSet

    if (game.settings.get('hero6efoundryvttv2', 'hitLocTracking') === 'all') {
      sheetData.hitLocTracking = true
    } else {
      sheetData.hitLocTracking = false
    }

    sheetData.edit = false
  }

  static _prepareDefenseItem (i, item) {
    i.defenseType = CONFIG.HERO.defenseTypes[item.defenseType]
    i.active = item.active
    i.resistant = CONFIG.HERO.bool[item.resistant]
    i.hardened = item.hardened
    i.impenetrable = item.impenetrable
    i.value = item.value
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    // Edit sheet control
    html.find('.edit-settings').click(e => {
      html.find('.conditional-input').each((id, inp) => {
        if (e.target.dataset.tab === 'play') {
          inp.disabled = true
        } else {
          inp.disabled = false
        }
      })
    })

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this))

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents('.item')
      const item = this.actor.items.get(li.data('itemId'))
      item.sheet.render(true)
    })

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents('.item')
      const item = this.actor.items.get(li.data('itemId'))
      item.delete()
      li.slideUp(200, () => this.render(false))
    })

    // Update Power Inventory Item
    html.find('.power-item-edit').click(this._onEditPowerItem.bind(this))

    // Delete Power Inventory Item
    html.find('.power-item-delete').click(this._onDeletePowerItem.bind(this))

    // Power Sub Items
    html.find('.power-maneuver-item-toggle').click(this._onPowerManeuverItemToggle.bind(this))
    html.find('.power-defense-item-toggle').click(this._onPowerDefenseItemToggle.bind(this))
    html.find('.power-rollable-skill').click(this._onPowerRollSkill.bind(this))
    html.find('.power-item-attack').click(this._onPowerItemAttack.bind(this))

    // Rollable abilities.
    html.find('.rollable-characteristic').click(this._onRollCharacteristic.bind(this))
    html.find('.rollable-skill').click(this._onRollSkill.bind(this))
    html.find('.item-attack').click(this._onItemAttack.bind(this))
    html.find('.item-toggle').click(this._onItemToggle.bind(this))
    html.find('.recovery-button').click(this._onRecovery.bind(this))
    html.find('.upload-button').change(this._uploadCharacterSheet.bind(this))

    // Drag events for macros.
    if (this.actor.isOwner) {
      const handler = ev => this._onDragStart(ev)
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }

    html.find('input').each((id, inp) => {
      this.changeValue = async function (e) {
        if (e.code === 'Enter' || e.code === 'Tab') {
          if (e.target.dataset.dtype === 'Number') {
            if (isNaN(parseInt(e.target.value))) {
              return
            }

            const changes = []
            changes[`system.characteristics.${e.target.name}`] = e.target.value
            await this.actor.data.update(changes)

          } else {
            this._updateName(e.target.value)
          }
        }
      }

      inp.addEventListener('keydown', this.changeValue.bind(this))
    })
  }

  /**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
  async _onItemCreate (event) {
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
      data
    }
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type

    // Finally, create the item!
    return await HeroSystem6eItem.create(itemData, { parent: this.actor })
  }

  async _onPowerItemAttack(event) {
    event.preventDefault()

    const powerId = event.currentTarget.attributes["data-powerid"].value
    const subId = event.currentTarget.attributes["data-subid"].value

    let attackItemData = this.actor.items.get(powerId).data.data.items["attack"][`${subId}`]

    const itemData = {
      name: attackItemData.name,
      type: attackItemData.type,
      data: attackItemData,
    }

    let item = new HeroSystem6eItem(itemData)

    const rollMode = 'core'
    const createChatMessage = true

    item.displayCard = displayCard

    return item.displayCard({ rollMode, createChatMessage }, this.actor, powerId + "-" + subId)
  }

  async _onItemAttack (event) {
    event.preventDefault()
    const itemId = event.currentTarget.closest('.item').dataset.itemId
    let item = this.actor.items.get(itemId)

    const rollMode = 'core'
    const createChatMessage = true

    item.displayCard = displayCard

    return item.displayCard({ rollMode, createChatMessage }, this.actor, item.id)
  }

  async _onItemToggle (event) {
    event.preventDefault()
    const itemId = event.currentTarget.closest('.item').dataset.itemId
    const item = this.actor.items.get(itemId)
    const attr = 'data.active'
    const newValue = !getProperty(item.data, 'data.active')

    // only have one combat maneuver selected at a time except for Set or Brace
    if (newValue && item.type === 'maneuver' && newValue) {
      await enforceManeuverLimits(this.actor, itemId, item.name)
    }

    await item.update({ [attr]: newValue })

    if (item.type === 'maneuver') {
      await updateCombatAutoMod(this.actor, item)
    }
  }

  async _onPowerManeuverItemToggle (event) {
    const itemId = event.currentTarget.closest('.item').dataset.itemId
    const subItemId = event.currentTarget.closest('.item').dataset.subitemId
    const powerItem = this.actor.items.get(itemId)
    const item = powerItem.data.data.items.maneuver[subItemId]
    const newValue = !item.active

    await powerItem.update({ [`data.items.maneuver.${subItemId}.active`]: newValue })

    const itemData = {
      name: item.name,
      type: item.type,
      data: item
    }

    const newItem = new HeroSystem6eItem(itemData)

    await enforceManeuverLimits(this.actor, subItemId, item.name)

    await updateCombatAutoMod(this.actor, newItem)
  }

  async _onPowerDefenseItemToggle (event) {
    const itemId = event.currentTarget.closest('.item').dataset.itemId
    const subItemId = event.currentTarget.closest('.item').dataset.subitemId
    const powerItem = this.actor.items.get(itemId)
    const item = powerItem.data.data.items.defense[subItemId]
    const newValue = !item.active

    await powerItem.update({ [`data.items.defense.${subItemId}.active`]: newValue })
  }

  /**
  * Handle clickable rolls.
  * @param {Event} event   The originating click event
  * @private
  */
  _onRollCharacteristic (event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset

    const charRoll = parseInt(element.innerText.slice(0, -1))

    if (dataset.roll) {
      const actor = this.actor

      const roll = new Roll(dataset.roll, this.actor.getRollData())
      roll.evaluate().then(function (result) {
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

  async _onRollSkill (event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset

    const item = this.actor.items.get(dataset.label)

    createSkillPopOutFromItem(item, this.actor)
  }

  async _onPowerRollSkill (event) {
    event.preventDefault()

    const itemId = event.currentTarget.closest('.item').dataset.itemId
    const subItemId = event.currentTarget.closest('.item').dataset.subitemId
    const powerItem = this.actor.items.get(itemId)
    const item = powerItem.data.data.items.skill[subItemId]

    const itemData = {
      name: item.name,
      type: item.type,
      data: item
    }

    const newItem = new HeroSystem6eItem(itemData)

    createSkillPopOutFromItem(newItem, this.actor)
  }

  async _onRecovery (event) {
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
      'data.characteristics.stun.value': newStun,
      'data.characteristics.end.value': newEnd
    })

    let token = this.actor.token
    let speaker = ChatMessage.getSpeaker({ actor: this.actor, token })
    speaker["alias"] = this.actor.name

    const chatData = {
      user: game.user.data._id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: this.actor.name + ' recovers!',
      speaker: speaker
    }

    return ChatMessage.create(chatData)
  }

  async _uploadCharacterSheet (event) {
    const file = event.target.files[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = function (event) {
      const contents = event.target.result

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(contents, 'text/xml')
      this._applyCharacterSheet(xmlDoc)
    }.bind(this)
    reader.readAsText(file)
  }

  _applyCharacterSheet (sheet) {
    this._applyCharacterSheetAsync(sheet)
  }

  async _applyCharacterSheetAsync (sheet) {
    const characterInfo = sheet.getElementsByTagName('CHARACTER_INFO')[0]
    const characteristics = sheet.getElementsByTagName('CHARACTERISTICS')[0]
    const skills = sheet.getElementsByTagName('SKILLS')[0]

    // let elementsToLoad = ["POWERS", "PERKS", "TALENTS", "MARTIALARTS", "DISADVANTAGES"]

    const changes = []

    if (characterInfo.getAttribute('CHARACTER_NAME') !== '') {
      changes.name = characterInfo.getAttribute('CHARACTER_NAME')
    }

    // changes['data.characteristics.flying.value'] = 0;

    for (const item of this.actor.items) {
      await item.delete()
    }

    // determine spd upfront for velocity calculations
    let spd
    let value
    for (const characteristic of characteristics.children) {
      const key = CONFIG.HERO.characteristicsXMLKey[characteristic.getAttribute('XMLID')]
      value = CONFIG.HERO.characteristicDefaults[key] + parseInt(characteristic.getAttribute('LEVELS'))

      if (key === 'spd') {
        spd = value
      }
    }

    for (const characteristic of characteristics.children) {
      const key = CONFIG.HERO.characteristicsXMLKey[characteristic.getAttribute('XMLID')]
      value = CONFIG.HERO.characteristicDefaults[key] + parseInt(characteristic.getAttribute('LEVELS'))

      const velocity = Math.round((spd * value) / 12)

      if (key in CONFIG.HERO.movementPowers) {
        const itemData = {
          name: key,
          type: 'movement',
          data: {
            type: key,
            editable: false,
            base: value,
            value,
            velBase: velocity,
            velValue: velocity
          }
        }

        await HeroSystem6eItem.create(itemData, { parent: this.actor })
      } else {
        changes[`data.characteristics.${key}.value`] = value
        changes[`data.characteristics.${key}.max`] = value
      }
    }

    await this.actor.update(changes)

    for (const skill of skills.children) {
      const xmlid = skill.getAttribute('XMLID')

      let description = skill.getAttribute('ALIAS')

      if (xmlid === 'KNOWLEDGE_SKILL' || xmlid === 'PROFESSIONAL_SKILL' || xmlid === 'SCIENCE_SKILL') {
        if (skill.hasAttribute('INPUT')) {
          description += ': ' + skill.getAttribute('INPUT')
        }
      }

      let name = ''

      if (skill.hasAttribute('NAME') && skill.getAttribute('NAME') !== '') {
        name = skill.getAttribute('NAME')
      } else {
        name = description
      }

      const type = 'skill'
      const data = {
        levels: skill.getAttribute('LEVELS'),
        state: 'trained'
      }

      data.description = description

      if (skill.attributes.getNamedItem('CHARACTERISTIC')) {
        data.characteristic = skill.getAttribute('CHARACTERISTIC')
      } else {
        data.characteristic = ''
      }

      if (skill.attributes.getNamedItem('FAMILIARITY')) {
        if (skill.getAttribute('FAMILIARITY') === 'Yes') {
          data.state = 'familiar'

          if (skill.getAttribute('EVERYMAN') === 'Yes') {
            data.state = 'everyman'
          }
        }

        if (skill.getAttribute('PROFICIENCY') === 'Yes') {
          data.state = 'proficient'
        }
      } else {
        data.state = 'noroll'
      }

      if (xmlid === 'PROFESSIONAL_SKILL') data.ps = true

      if (skill.hasAttribute('PARENTID')) {
        data.parentid = skill.getAttribute('PARENTID')
      }

      if (skill.hasAttribute('ID')) {
        data.hdcid = skill.getAttribute('ID')
      }

      // determine Skill Roll
      if (data.state === 'everyman') {
        data.roll = '8-'
      } else if (data.state === 'familiar') {
        data.roll = '8-'
      } else if (data.state === 'proficient') {
        data.roll = '10-'
      } else if (data.state === 'trained') {
        const charValue = this.actor.system.characteristics[`${data.characteristic.toLowerCase()}`].value
        const rollVal = 9 + Math.round(charValue / 5) + parseInt(data.levels)
        data.roll = rollVal.toString() + '-'
      }

      const itemData = {
        name,
        type,
        data
      }

      await HeroSystem6eItem.create(itemData, { parent: this.actor })
    }

    const powers = sheet.getElementsByTagName('POWERS')[0]

    const relevantFields = ['BASECOST', 'LEVELS', 'ALIAS', 'MULTIPLIER', 'NAME', 'OPTION_ALIAS']
    for (const power of powers.children) {
      const xmlid = power.getAttribute('XMLID')
      const name = power.getAttribute('NAME')
      const alias = power.getAttribute('ALIAS')
      const levels = power.getAttribute('LEVELS')

      let itemName = name
      if (name === undefined || name === '') {
        itemName = alias
      }

      const data = []

      for (const attribute of power.attributes) {
        const attName = attribute.name

        if (relevantFields.includes(attName)) {
          const attValue = attribute.value

          data[attName] = attValue
        }
      }

      const modifiers = []
      for (const modifier of power.children) {
        const xmlidModifier = modifier.getAttribute('XMLID')

        if (xmlidModifier !== null) {
          modifiers.push(xmlidModifier)
        }
      }
      data.modifiers = modifiers

      data.description = alias

      data.rules = xmlid

      let type = ''
      let itemData = {}
      if (xmlid.toLowerCase() in CONFIG.HERO.movementPowers) {
        type = 'movement'

        const velocity = Math.round((spd * levels) / 12)

        data.max = levels
        data.value = levels
        data.velBase = velocity
        data.velValue = velocity

        itemData = {
          name: itemName,
          type,
          data,
          levels
        }
      } else {
        type = 'power'

        itemData = {
          name: itemName,
          type,
          data,
          levels
        }
      }

      await HeroSystem6eItem.create(itemData, { parent: this.actor })
    }

    // combat maneuvers
    async function loadCombatManeuvers (dict, actor) {
      for (const entry of Object.entries(dict)) {
        const v = entry[1]
        const itemData = {
          name: entry[0],
          type: 'maneuver',
          data: {
            phase: v[0],
            ocv: v[1],
            dcv: v[2],
            effects: v[3],
            active: false
          }
        }

        await HeroSystem6eItem.create(itemData, { parent: actor })
      }
    }

    await loadCombatManeuvers(CONFIG.HERO.combatManeuvers, this.actor)

    if (game.settings.get('hero6efoundryvttv2', 'optionalManeuvers')) {
      await loadCombatManeuvers(CONFIG.HERO.combatManeuversOptional, this.actor)
    }
  }

  async _updateName (name) {
    // this needed to be pulled out of the listener for some reason
    const changes = []
    changes.name = name
    await this.actor.update(changes)
  }

  async _onEditPowerItem (event) {
    const id = event.currentTarget.id.split(' ')[0]
    const item = this.object.data.items.get(id)

    await editSubItem(event, item)
  }

  async _onDeletePowerItem (event) {
    const id = event.currentTarget.key
    const item = this.object.data.items.get(id)

    await deleteSubItem(event, item)
  }
}

async function displayCard ({ rollMode, createMessage = true } = {}, actor, itemId) {
  await HeroSystem6eAttackCard.createAttackPopOutFromItem(this, actor, itemId)
}

async function updateCombatAutoMod (actor, item) {
  const changes = []

  let ocvEq = 0
  let dcvEq = '+0'

  function dcvEquation (dcvEq, newDcv) {
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
    if (i.data.data.active && i.type === 'maneuver') {
      ocvEq = ocvEq + parseInt(i.data.data.ocv)

      dcvEq = dcvEquation(dcvEq, i.data.data.dcv)
    }

    if ((i.type === 'power' || i.type === 'equipment') && ('maneuver' in i.data.data.items)) {
      for (const [key, value] of Object.entries(i.data.data.items.maneuver)) {
        if (value.type && value.visible && value.active) {
          ocvEq = ocvEq + parseInt(value.ocv)

          dcvEq = dcvEquation(dcvEq, value.dcv)
        }
      }
    }
  }

  if (isNaN(ocvEq)) {
    ocvEq = item.data.data.ocv
  } else if (ocvEq >= 0) {
    ocvEq = '+' + ocvEq.toString()
  } else {
    ocvEq = ocvEq.toString()
  }

  changes['data.characteristics.ocv.autoMod'] = ocvEq
  // changes['data.characteristics.omcv.autoMod'] = ocvEq;
  changes['data.characteristics.dcv.autoMod'] = dcvEq
  // changes['data.characteristics.dmcv.autoMod'] = dcvEq;

  changes['data.characteristics.ocv.value'] = actor.system.characteristics.ocv.max + parseInt(ocvEq)
  // changes['data.characteristics.omcv.value'] = actor.system.characteristics.omcv.max + parseInt(ocvEq);

  if (dcvEq.includes('/')) {
    changes['data.characteristics.dcv.value'] = Math.round(actor.system.characteristics.dcv.max * (parseFloat(dcvEq.split('/')[0]) / parseFloat(dcvEq.split('/')[1])))
    // changes['data.characteristics.dmcv.value'] = Math.round(actor.system.characteristics.dmcv.max * (parseFloat(dcvEq.split("/")[0]) / parseFloat(dcvEq.split("/")[1])));
  } else {
    changes['data.characteristics.dcv.value'] = actor.system.characteristics.dcv.max + parseInt(dcvEq)
    // changes['data.characteristics.dmcv.value'] = actor.system.characteristics.dmcv.max + parseInt(dcvEq);
  }

  await actor.update(changes)
}
