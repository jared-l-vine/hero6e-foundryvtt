// Import Modules
import { HERO } from "./config.js";
import { POWERS } from "./powers/powers-rules.js";
import { HeroSystem6eActor } from "./actor/actor.js";
import { HeroSystem6eActorSheet } from "./actor/actor-sheet.js";
import { HeroSystem6eToken, HeroSystem6eTokenDocument } from "./actor/actor-token.js";
import { HeroSystem6eItem } from "./item/item.js";
import { HeroSystem6eItemSheet } from "./item/item-sheet.js";
import * as chat from "./chat.js";
import * as macros from "./macros.js";
import { HeroSystem6eCardHelpers } from "./card/card-helpers.js";
import { HeroSystem6eActorActiveEffects } from "./actor/actor-active-effects.js";
import HeroSystem6eTemplate from "./template.js";
import { HeroSystem6eRuler } from "./ruler.js";
import { HeroSystem6eCombat, HeroSystem6eCombatTracker } from "./combat.js";
import SettingsHelpers from "./settings/settings-helpers.js";

Hooks.once('init', async function() {

    game.herosystem6e = {
        applications: {
            HeroSystem6eActorSheet,
            HeroSystem6eItemSheet,
        },
        entities: {
            HeroSystem6eActor,
            HeroSystem6eItem,
            HeroSystem6eTokenDocument,
            HeroSystem6eToken
        },
        canvas: {
            HeroSystem6eTemplate
        },
        macros: macros,
        rollItemMacro: macros.rollItemMacro,
        config : HERO
    };

    CONFIG.HERO = HERO;

    CONFIG.POWERS = POWERS;

    CONFIG.Combat.documentClass = HeroSystem6eCombat;

    /**
    * Set an initiative formula for the system
    * @type {String}
    */
    CONFIG.Combat.initiative = {
        formula: "@characteristics.dex.current",
        decimals: 2
    };

    // debug
    // CONFIG.debug.hooks = true;

    // Define custom Entity classes
    CONFIG.Actor.entityClass = HeroSystem6eActor;
    CONFIG.Item.entityClass = HeroSystem6eItem;
    CONFIG.Token.documentClass = HeroSystem6eTokenDocument;
    CONFIG.Token.objectClass = HeroSystem6eToken;
    CONFIG.statusEffects = HeroSystem6eActorActiveEffects.getEffects();
    CONFIG.MeasuredTemplate.objectClass = HeroSystem6eTemplate;
    CONFIG.ui.combat = HeroSystem6eCombatTracker;

    SettingsHelpers.initLevelSettings();

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

    Handlebars.registerHelper('is_active_segment', function (actives, index) {
        return actives[index];
    });
});

Hooks.once("init", () => {
    Ruler = HeroSystem6eRuler;
})

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
Hooks.on("updateActor", (app, html, data) => {
    for (let combat of game.combats) {
        combat._onActorDataUpdate();
    }
});

/*
Hooks.on("chatCommandsReady", function(chatCommands) {
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/powers",
        invokeOnCommand: (chatlog, messageText, chatdata) => {
            var powerKey = messageText.toUpperCase();
            if (CONFIG.POWERS[powerKey] === undefined) {
                var usage = 'USAGE: /powers key || valid keys:';

                
                for (var key of Object.keys(CONFIG.POWERS).sort()) {
                    usage += "\n\t" + key.toLowerCase();
                }

                console.log(usage)
                
                return usage
            }
            else {
                return CONFIG.POWERS[powerKey];
            }
        },
        shouldDisplayToChat: true,
        createdMessageType: 0,
        iconClass: "fa-sticky-note",
        description: "Prints power rules",
    }));

    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/load",
        invokeOnCommand: (chatlog, messageText, chatdata) => {
            var actor;
            var actorName;
            for (const value of window.game.actors.values()) {
                actor = value.data;
                actorName = actor.name.replace(/ /g, "_");
                console.log(actorName);
            }

            for (const folder of window.game.folders.values()) {
                console.log(folder.data.name)
            }

            console.log(window.game.data.system.path + '\\..\\..\\' + window.game.data.world.id)
        },
        shouldDisplayToChat: false,
        createdMessageType: 0,
        iconClass: "fa-sticky-note",
        description: "Loads hdcs",
    }));
}); 
*/

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