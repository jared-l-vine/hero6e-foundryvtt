import { HeroSystem6eItem } from "./item.js";
import { editSubItem, deleteSubItem } from "../powers/powers.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class HeroSystem6eItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["herosystem6e", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/hero6e-foundryvtt-v2/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
      const data = super.getData();

      // Grab the item's data.
      const itemData = data.data;

      // Re-define the template data references.
      data.item = itemData;
      data.data = itemData.data;
      data.config = CONFIG.HERO;


    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
    html.find(".rollable").click(this._onSheetAction.bind(this));

    // Add sub 'Item'
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(this._onEditItem.bind(this));
		
    // Delete Inventory Item
    html.find('.item-delete').click(this._onDeleteItem.bind(this));

    // Item Description
    html.find('.textarea').each((id, inp) => {
			this.changeValue = function(e) {
				if (e.code === "Enter" || e.code === "Tab") {
					let changes = []
					changes[`${e.target.name}`] = e.target.value
					this.item.update(changes);
				}
			}

			inp.addEventListener("keydown", this.changeValue.bind(this));
		})
  }

    /**
 * Handle mouse click events for character sheet actions
 * @param {MouseEvent} event    The originating click event
 * @private
 */
    _onSheetAction(event) {
        event.preventDefault();
        const button = event.currentTarget;
        switch (button.dataset.action) {
            case "hit-roll":
                return Dialog.confirm({
                    title: `${game.i18n.localize("DND5E.CurrencyConvert")}`,
                    content: `<p>${game.i18n.localize("DND5E.CurrencyConvertHint")}</p>`,
                    yes: () => this.actor.convertCurrency()
                });
            case "rollDeathSave":
                return this.actor.rollDeathSave({ event: event });
            case "rollInitiative":
                return this.actor.rollInitiative({ createCombatants: true });
        }
    }

    async _updateObject(event) {
      event.preventDefault();

      if (event.currentTarget === null) {
        return
      }

      let valueName = event.currentTarget.name;
      let value = event.currentTarget.value;

      // this is necessary for item images
      if (valueName === "img") {
        value = event.currentTarget.currentSrc;
        //console.log(event.currentTarget.currentSrc.replace('http://localhost:30000/', ''))
      }

      // this is necessary to make sure check boxes work
      if (event.currentTarget.dataset.dtype === "Boolean") {
        value = event.currentTarget.checked;
      }

      if (! "linkId" in this.item.data.data || this.item.data.data.linkId === undefined) {
        // normal items     
        let changes = {};
        changes[`${valueName}`] = value;

        await this.item.update(changes);

        if (this.item.type === "movement") {
          changes = {};
          changes["data.value"] = parseInt(this.item.data.data.base) + parseInt(this.item.data.data.mod);

          if (this.item.actor !== null) {
            let spd = this.item.actor.data.data.characteristics.spd.value;
            changes["data.velBase"] = Math.round((parseInt(this.item.data.data.base) * spd) / 12);
            changes["data.velValue"] = Math.round((changes["data.value"] * spd) / 12);
          }

          await this.item.update(changes)
        }

        return

      } else {
        // power sub items
        let linkId = this.item.data.data.linkId;
        let subLinkId = this.item.data.data.subLinkId;

        let item = game.items.get(linkId);

        if (item === undefined) {
          // item is not a game item / item belongs to an actor
          // sub items don't know the actor they belong to
          for (const key of game.actors.keys()) {
            let actor = game.actors.get(key);
            if (actor.items.has(linkId)) {
              item = actor.items.get(linkId);
            }
          }
        }

        let type = this.item.type;

        let valueNameSplit = valueName.split(".");
        if (valueNameSplit.length > 0) {
          valueName = valueNameSplit[valueNameSplit.length - 1]
        }

        let changes = {};
        changes[`data.items.${type}.${subLinkId}.${valueName}`] = value;
        await item.update(changes);

        if (type === "movement") {
          let subItem = item.data.data.items[`${type}`][`${subLinkId}`];

          changes = {};
          changes[`data.items.${type}.${subLinkId}.value`] = parseInt(subItem.base) + parseInt(subItem.mod);

          await item.update(changes);

          // update item-sheet data
          changes = {};          
          changes["name"] = subItem.name;
          changes["data.base"] = parseInt(subItem.base);
          changes["data.mod"] = parseInt(subItem.mod);
          changes["data.value"] = parseInt(subItem.base) + parseInt(subItem.mod);
          await this.item.data.update(changes);

          this._render()
        }

        return
      }
    }

    async _onItemCreate(event) {
      event.preventDefault();
      const header = event.currentTarget;
      // Get the type of item to create.
      const type = header.dataset.type;
      // Grab any data associated with this control.
      const data = duplicate(header.dataset);
      // Initialize a default name.
      const name = `New ${type.capitalize()}`;
      // Prepare the item object.
      const itemData = {
        name: name,
        type: type,
        data: data
      };

      let newItem = new HeroSystem6eItem(itemData)

      let id = Date.now().toString(32) + Math.random().toString(16).substring(2);
      let changes = {};
      changes[`data.items.${type}.${id}`] = newItem.data.data;
      changes[`data.items.${type}.${id}.img`] = this.item.img;
      changes[`data.items.${type}.${id}.name`] = name;
      changes[`data.items.${type}.${id}.visible`] = true;

      return await this.item.update(changes);
    }

    async _onEditItem(event) {
      await editSubItem(event, this.item);
    }

    async _onDeleteItem(event) {
      await deleteSubItem(event, this.item);
    }
}
