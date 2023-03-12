import { HeroSystem6eItem, getItem } from './item.js'
import { editSubItem, deleteSubItem, isPowerSubItem, subItemUpdate } from '../powers/powers.js'
import { HEROSYS } from '../herosystem6e.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class HeroSystem6eItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['herosystem6e', 'sheet', 'item'],
      width: 520,
      height: 480,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }]
    })
  }

  /** @override */
  get template () {
    const path = 'systems/hero6efoundryvttv2/templates/item'
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.data.type}-sheet.hbs`
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()

    // Grab the item's data.
    const itemData = data.data

    // Re-define the template data references.
    data.item = itemData
    data.data = itemData.data
    data.config = CONFIG.HERO

    return data
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition (options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 192
    sheetBody.css('height', bodyHeight)
    return position
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    // Roll handlers, click handlers, etc. would go here.
    html.find('.rollable').click(this._onSheetAction.bind(this))

    // Add sub 'Item'
    html.find('.item-create').click(this._onSubItemCreate.bind(this))

    // Update Inventory Item
    html.find('.item-edit').click(this._onEditItem.bind(this))

    // Delete Inventory Item
    html.find('.item-delete').click(this._onDeleteItem.bind(this))

    // Item Description
    html.find('.textarea').each((id, inp) => {
      this.changeValue = async function (e) {
        if (e.code === 'Enter' || e.code === 'Tab') {
          if (!'linkId' in this.item.system || this.item.system.linkId === undefined) {
            const changes = []
            changes[`${e.target.name}`] = e.target.value
            await this.item.update(changes)
          } else {
            const type = this.item.type

            const linkId = this.item.system.linkId
            const subLinkId = this.item.system.subLinkId

            let item = game.items.get(linkId)

            if (item === undefined) {
              // item is not a game item / item belongs to an actor
              // sub items don't know the actor they belong to
              for (const key of game.actors.keys()) {
                const actor = game.actors.get(key)
                if (actor.items.has(linkId)) {
                  item = actor.items.get(linkId)
                }
              }
            }

            const changes = {}
            changes[`system.subItems.${type}.${subLinkId}.${e.target.name.split(".")[1]}`] = e.target.value
            await item.update(changes)
          }
        }
      }

      inp.addEventListener('keydown', this.changeValue.bind(this))
    })
  }

  /**
 * Handle mouse click events for character sheet actions
 * @param {MouseEvent} event    The originating click event
 * @private
 */
  _onSheetAction (event) {
    event.preventDefault()
    const button = event.currentTarget
    switch (button.dataset.action) {
      case 'hit-roll':
        return Dialog.confirm({
          title: `${game.i18n.localize('DND5E.CurrencyConvert')}`,
          content: `<p>${game.i18n.localize('DND5E.CurrencyConvertHint')}</p>`,
          yes: () => this.actor.convertCurrency()
        })
      case 'rollDeathSave':
        return this.actor.rollDeathSave({ event })
      case 'rollInitiative':
        return this.actor.rollInitiative({ createCombatants: true })
    }
  }

  async _updateObject (event, formData) {
    event.preventDefault()

    const expandedData = foundry.utils.expandObject(formData);

    const clickedElement = $(event.currentTarget);
    const form = clickedElement.closest('form[data-id][data-realId]')
    const id = form.data()?.id
    const realId = form.data()?.realid

    if(!id) { return; }

    if (realId) {
      subItemUpdate(realId, formData)
    } else {
      const item = getItem(id)

      await item.update(expandedData)
    }

    // const type = clickedElement.parents('[data-type]')?.data().type

    return

    if (event.currentTarget === null) {
      return
    }

    let valueName = event.currentTarget.name
    let value = event.currentTarget.value

    HEROSYS.log(event.currentTarget)
    HEROSYS.log(event.currentTarget.parent)
    const target = $(event.currentTarget).parents('.sheet-body').attr('data-item-id')
    HEROSYS.log(target)
    HEROSYS.log($(event.currentTarget).parents('.form-group').parents('.sheet-body').attr('data-item-id'))

    // this is necessary for item images
    if (valueName === 'img') {
      value = event.currentTarget.currentSrc
    }

    // this is necessary to make sure check boxes work
    if (event.currentTarget.dataset.dtype === 'Boolean') {
      value = event.currentTarget.checked
    }

    if (! isPowerSubItem(this.item._id)) {
      // normal items
      let changes = {}
      changes[`${valueName}`] = value

      await this.item.update(changes)

      if (this.item.type === 'movement') {
        changes = {}
        changes['data.value'] = parseInt(this.item.system.base) + parseInt(this.item.system.mod)

        if (this.item.actor !== null) {
          const spd = this.item.actor.system.characteristics.spd.value
          changes['data.velBase'] = Math.round((parseInt(this.item.system.base) * spd) / 12)
          changes['data.velValue'] = Math.round((changes['data.value'] * spd) / 12)
        }

        await this.item.update(changes)
      }
    } else {
      // power sub items
      const linkId = this.item.system.linkId
      const subLinkId = this.item.system.subLinkId

      HEROSYS.log('edit sub item')

      let item = game.items.get(linkId)

      if (item === undefined) {
        // item is not a game item / item belongs to an actor
        // sub items don't know the actor they belong to
        for (const key of game.actors.keys()) {
          const actor = game.actors.get(key)
          if (actor.items.has(linkId)) {
            item = actor.items.get(linkId)
          }
        }
      }

      const type = this.item.type

      const valueNameSplit = valueName.split('.')
      if (valueNameSplit.length > 0) {
        valueName = valueNameSplit[valueNameSplit.length - 1]
      }

      let changes = {}
      changes[`system.subItems.${type}.${subLinkId}.system.${valueName}`] = value
      await item.update(changes)

      if (type === 'movement') {
        const subItem = item.system.items[`${type}`][`${subLinkId}`]

        changes = {}
        changes[`system.subItems.${type}.${subLinkId}.system.value`] = parseInt(subItem.base) + parseInt(subItem.mod)

        await item.update(changes)

        // update item-sheet data
        changes = {}
        changes.name = subItem.name
        changes[`system.subItems.${type}.${subLinkId}.system.base`] = parseInt(subItem.base)
        changes[`system.subItems.${type}.${subLinkId}.system.mod`] = parseInt(subItem.mod)
        changes[`system.subItems.${type}.${subLinkId}.system.value`] = parseInt(subItem.base) + parseInt(subItem.mod)
        await this.item.update(changes)

        this._render()
      }
    }
  }

  async _onSubItemCreate (event) {
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

    const newItem = new HeroSystem6eItem(itemData)

    const id = Date.now().toString(32) + Math.random().toString(16).substring(2)
    const changes = {}
    changes[`system.subItems.${type}.${id}.system`] = newItem.system
    changes[`system.subItems.${type}.${id}.img`] = this.item.img
    changes[`system.subItems.${type}.${id}.name`] = name
    changes[`system.subItems.${type}.${id}._id`] = this.item._id + '-' + id

    return await this.item.update(changes)
  }

  async _onEditItem (event) {
    await editSubItem(event, this.item)
  }

  async _onDeleteItem (event) {
    await deleteSubItem(event, this.item)
  }
}
