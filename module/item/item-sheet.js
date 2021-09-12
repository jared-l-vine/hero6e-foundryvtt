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
    const path = "systems/herosystem6e/templates/item";
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
}
