import { HeroSystem6eItem } from "./item.js"

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
    const path = "systems/hero6e-foundryvtt-experimental/templates/item";
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

      if (! "linkId" in this.item.data.data || this.item.data.data.linkId === undefined) {
        let changes = {};
        changes[`${valueName}`] = value;

        return await this.item.update(changes);

      } else {
        let linkId = this.item.data.data.linkId;
        let subLinkId = this.item.data.data.subLinkId;

        let item = game.items.get(linkId);
        let type = this.item.type;

        let valueNameSplit = valueName.split(".");
        if (valueNameSplit.length > 0) {
          valueName = valueNameSplit[valueNameSplit.length - 1]
        }

        let changes = {};
        changes[`data.items.${type}.${subLinkId}.${valueName}`] = value;
        return await item.update(changes);
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
      event.preventDefault();

      let id = event.currentTarget.id;
      let type = event.currentTarget.type;

      let data = this.item.data.data.items[`${type}`][`${id}`];
      data["linkId"] = this.item.id;
      data["subLinkId"] = id;

      const itemData = {
        name: data.name,
        type: data.type,
        data: data
      };

      let tempItem = new HeroSystem6eItem(itemData);
      return await tempItem.sheet.render(true);
    }

    async _onDeleteItem(event) {
      event.preventDefault();

      let id = event.currentTarget.id;
      let type = event.currentTarget.type;

      let changes = {}
      changes[`data.items.${type}.${id}.visible`] = false;

      return await this.item.update(changes)     
    }
}
