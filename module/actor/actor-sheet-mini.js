import { HeroSystem6eActorSheet } from "./actor-sheet.js";

export class HeroSystem6eActorSheetMini extends HeroSystem6eActorSheet {
    static get defaultOptions () {
        const path = 'systems/hero6efoundryvttv2/templates/actor-sheet-mini/actor-sheet-mini.hbs'
    
        return mergeObject(super.defaultOptions, {
          classes: ['herosystem6e', 'sheet', 'actor'],
          template: path,
          width: 800,
          height: 700,
          resizable: false,
          tabs: [
            { navSelector: '.sheet-item-tabs', contentSelector: '.sheet-body', initial: 'description' },
            { navSelector: '.sheet-edit-tabs', contentSelector: '.sheet-mode', initial: 'play' }
          ],
          heroEditable: false
        })
      }
}
