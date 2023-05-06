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

    // override actor.items (which is a map) to an array with some custom properties
    let items = []
    for(let item of data.actor.items)
    {
      if (data.actor.effects.find(o => o.origin === this.actor.items.get(item._id).uuid))
      {
        item.showToggle = true
      }
      items.push(item)
    }
    data.items = items;

    return data
  }

}