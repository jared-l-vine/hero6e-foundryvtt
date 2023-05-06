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
        for (let item of data.actor.items) {

            // showToggle
            if (data.actor.effects.find(o => o.origin === this.actor.items.get(item._id).uuid)) {
                item.system.showToggle = true
            }

            // Damage
            if (item.type == 'attack') {
                item.system.damage = item.system.dice
                switch (item.system.extraDice) {
                    case 'zero':
                        item.system.damage += 'D6'
                        break
                    case 'pip':
                        item.system.damage += 'D6+1'
                        break
                    case 'half':
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
                item.system.defenseType = CONFIG.HERO.defenseTypes[item.system.defenseType]
            }

            items.push(item)
        }
        data.items = items;

        return data
    }

}