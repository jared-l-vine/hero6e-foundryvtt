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

}