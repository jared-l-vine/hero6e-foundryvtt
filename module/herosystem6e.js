// Import Modules
import { HERO } from "./config.js";
import { HeroSystem6eActor } from "./actor/actor.js";
import { HeroSystem6eActorSheet } from "./actor/actor-sheet.js";
import { HeroSystem6eItem } from "./item/item.js";
import { HeroSystem6eItemSheet } from "./item/item-sheet.js";
import * as chat from "./chat.js";
import * as macros from "./macros.js";
import { HeroSystem6eCardHelpers } from "./card/card-helpers.js";
import { HeroSystem6eActorActiveEffects } from "./actor/actor-active-effects.js";

Hooks.once('init', async function() {

    game.herosystem6e = {
        applications: {
            HeroSystem6eActorSheet,
            HeroSystem6eItemSheet,
        },
        entities: {
            HeroSystem6eActor,
            HeroSystem6eItem,
        },
        macros: macros,
        rollItemMacro: macros.rollItemMacro,
        config : HERO
    };

    CONFIG.HERO = HERO;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20 + @abilities.dex.mod",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = HeroSystem6eActor;
    CONFIG.Item.entityClass = HeroSystem6eItem;
    console.log(CONFIG.statusEffects);
    CONFIG.statusEffects = HeroSystem6eActorActiveEffects.getEffects();
    console.log(CONFIG.statusEffects);

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("herosystem6e", HeroSystem6eActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("herosystem6e", HeroSystem6eItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createHeroSystem6eMacro(data, slot));
});

Hooks.on("renderChatMessage", (app, html, data) => {
    // Display action buttons
    chat.displayChatActionButtons(app, html, data);
    HeroSystem6eCardHelpers.onMessageRendered(html);
});
Hooks.on("renderChatLog", (app, html, data) => HeroSystem6eCardHelpers.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => HeroSystem6eCardHelpers.chatListeners(html));

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createHeroSystem6eMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.herosystem6e.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "herosystem6e.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}