// Import Modules
import { HERO } from "./config.js";
import { POWERS } from "./powers/powers-rules.js";
import { HeroSystem6eActor } from "./actor/actor.js";
import { HeroSystem6eActorSheet } from "./actor/actor-sheet.js";
import { HeroSystem6eActorSheetMini } from "./actor/actor-sheet-mini.js"
import { HeroSystem6eActorSidebarSheet } from "./actor/actor-sidebar-sheet.js";
import { HeroSystem6eToken, HeroSystem6eTokenDocument } from "./actor/actor-token.js";
import { HeroSystem6eItem } from "./item/item.js";
import { HeroSystem6eItemSheet } from "./item/item-sheet.js";
import * as chat from "./chat.js";
import * as macros from "./macros.js";
import { HeroSystem6eCardHelpers } from "./card/card-helpers.js";
import { HeroSystem6eActorActiveEffects } from "./actor/actor-active-effects.js";
import HeroSystem6eTemplate from "./template.js";
import { HeroSystem6eCombat, HeroSystem6eCombatTracker } from "./combat.js";
import SettingsHelpers from "./settings/settings-helpers.js";
import { HeroSystem6eTokenHud } from "./bar3/tokenHud.js";
import { extendTokenConfig } from "./bar3/extendTokenConfig.js";

Hooks.once('init', async function () {

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
    rollItemMacro: rollItemMacro,
    config: HERO
  };

  CONFIG.HERO = HERO;

  CONFIG.POWERS = POWERS;

  CONFIG.Combat.documentClass = HeroSystem6eCombat;

  /**
  * Set an initiative formula for the system
  * @type {String}
  */
  CONFIG.Combat.initiative = {
    formula: "@characteristics.dex.value + (@characteristics.int.value / 100)",
    decimals: 2
  };

  // debug
  // CONFIG.debug.hooks = true;

  // Define custom Entity classes
  CONFIG.Actor.documentClass = HeroSystem6eActor;
  CONFIG.Item.documentClass = HeroSystem6eItem;
  CONFIG.Token.documentClass = HeroSystem6eTokenDocument;
  CONFIG.Token.objectClass = HeroSystem6eToken;
  //CONFIG.Token.prototypeSheetClass = HeroSystem6eTokenConfig
  CONFIG.statusEffects = HeroSystem6eActorActiveEffects.getEffects();
  //CONFIG.MeasuredTemplate.objectClass = HeroSystem6eTemplate;
  CONFIG.ui.combat = HeroSystem6eCombatTracker;

  SettingsHelpers.initLevelSettings();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("herosystem6e", HeroSystem6eActorSheet);
  Actors.registerSheet("herosystem6e", HeroSystem6eActorSidebarSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("herosystem6e", HeroSystem6eItemSheet, { makeDefault: true });

  // Actors.registerSheet("herosystem6e", HeroSystem6eActorSheetMini, { makeDefault: false });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper('is_active_segment', function (actives, index) {
    return actives[index];
  });
});

Hooks.once("init", () => {
  // if (!game.modules.get('drag-ruler')?.active) {
    Ruler.prototype._getSegmentLabel = function _getSegmentLabel(segmentDistance, totalDistance, isTotal) {
      let rangeMod = Math.ceil(Math.log2(totalDistance / 8)) * 2;

      rangeMod = rangeMod < 0 ? 0 : rangeMod;

      let label = "[" + Math.round(segmentDistance.distance) + " m]" + "\n-" + rangeMod + " Range Modifier"

      return label
    };
  // }
});

// Hooks.on('getSceneControlButtons', (buttons) => {
//   // const UnTTool = {
//   //     activeTool: "types",
//   //     icon: "scene-control-icon",
//   //     layer: "UnT",
//   //     name: "UnT",
//   //     title: game.i18n.localize("UnT.Name"),
//   //     tools: [],
//   //     visible: true
//   // }

//   // UnTTool.tools.push({
//   //     name: "types",
//   //     icon: "scene-control-icon-types",
//   //     title: game.i18n.localize("UnT.SceneControl.Types"),
//   //     button: true,
//   //     onClick: () => {
//   //         const typeForm = new TypingForm()
//   //         typeForm.render(true)
//   //     },
//   // })

//   // if(game.user.isGM) {
//   //    // GM only controls
//   // }


//   const tokenSelectButton = buttons[0].tools[0]

//   // buttons.push(UnTTool)
//   HEROSYS.log(buttons[0].tools[0])
// })

Hooks.on('controlToken', function(token, controlled) {
  const sceneControls = ui.controls//.controls.find(control => control.name === 'token');
  if (sceneControls.activeControl !== "token") { return; }
  if (sceneControls.activeTool !== "select") { return; }

  HEROSYS.log('control token ready!')

  const tokensControlled = canvas.tokens.controlled.length;

  if (tokensControlled !== 1 || !controlled) {
      return
  }

  movementRadioSelectRender()


  return
  sceneControls.tools.push(radialMenuButton)

});

Hooks.on('renderSceneControls', function(sceneControls, html) {
  HEROSYS.log(sceneControls)

  return
  if (sceneControls.activeControl === "token" && sceneControls.activeTool === "select") {
    HEROSYS.log('lets add some stuff here!')
    HEROSYS.log(html)

    const radialMenuButton = $(`
      <div class="conatiner">
        <div class="radio">
          <input id="radio-1" name="radio" type="radio" data-tool="walk" checked>
          <label for="radio-1" class="radio-label">Walk</label>
        </div>

        <div class="radio">
          <input id="radio-1" name="radio" type="radio" data-tool="run" checked>
          <label for="radio-1" class="radio-label">Run</label>
        </div>

        <div class="radio">
          <input id="radio-1" name="radio" type="radio" data-tool="fly" checked>
          <label for="radio-1" class="radio-label">Fly</label>
        </div>
      </div>
  `);

    // Add event handlers
    radialMenuButton.find('[data-tool]').click(function() {
      const tool = $(this).attr('data-tool');

      HEROSYS.log(tool)

      switch (tool) {
          case 'walk':
              // Do something for walk
              break;
          case 'run':
              // Do something for run
              break;
          case 'fly':
              // Do something for fly
              break;
      }

      // Set this button as active
      radialMenuButton.find('.active').removeClass('active');
      $(this).addClass('active');
    });

    // html.append('<div>hello there!</div>')
    html.append(radialMenuButton)
  }
})

function movementRadioSelectRender() {
  const tokenControlButton = $(".scene-control[data-control='token']");

  const relevantToken = canvas.tokens.controlled[0];

  HEROSYS.log(relevantToken)
  const movmentItems = relevantToken.actor.items.filter((e) => e.type === "movement");

  const radioOptions = movmentItems.map((item, index) => `
    <div class="radio">
      <input id="radio-${index}" name="radio" type="radio" data-tool="${item.name}"${index === 0 ? ' checked' : ''}>
      <label for="radio-${index}" class="radio-label">${item.name}</label>
    </div>
  `).join('');

  const radioSelect = $(`<div class="radio-container">${radioOptions}</div>`);

  radioSelect.find('[data-tool]').click(function() {
    const tool = $(this).attr('data-tool');

    HEROSYS.log(tool)

    // Set this button as active
    radioSelect.find('.active').removeClass('active');
    $(this).addClass('active');
  });


  if (tokenControlButton.find('.radio-container').length > 0) {
    tokenControlButton.find('.radio-container').remove();
  }

  tokenControlButton.append(radioSelect);
}

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createHeroSystem6eMacro(bar, data, slot));
});

Hooks.on("renderChatMessage", (app, html, data) => {
  // Display action buttons
  chat.displayChatActionButtons(app, html, data);
  HeroSystem6eCardHelpers.onMessageRendered(html);
});
Hooks.on("renderChatLog", (app, html, data) => HeroSystem6eCardHelpers.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => HeroSystem6eCardHelpers.chatListeners(html));
Hooks.on("updateActor", (app, html, data) => {
  app.sheet._render()

  for (let combat of game.combats) {
    combat._onActorDataUpdate();
  }
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(HEROSYS.ID);
});

Hooks.once('dragRuler.ready', (SpeedProvider) => {
  class HeroSysSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        {id: "walk", default: 0x00FF00, name: "my-module-id.speeds.walk"},
        {id: "dash", default: 0xFFFF00, name: "my-module-id.speeds.dash"},
        {id: "run", default: 0xFF8000, name: "my-module-id.speeds.run"}
      ]
    }

    getRanges(token) {
      const baseSpeed = 5//token.actor.data.speed

      // A character can always walk it's base speed and dash twice it's base speed
      const ranges = [
        {range: baseSpeed, color: "walk"},
        {range: baseSpeed * 2, color: "dash"}
      ]

      // Characters that aren't wearing armor are allowed to run with three times their speed
      if (!token.actor.data.isWearingArmor) {
        ranges.push({range: baseSpeed * 3, color: "dash"})
      }

      return ranges
    }   
  }

  dragRuler.registerSystem(HEROSYS.module, HeroSysSpeedProvider)
});

export class HEROSYS {
  static ID = "HEROSYS";

  static module = "hero6efoundryvttv2";

  // static log(force, ...args) {
  static log(...args) {
    // const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

    //if (shouldLog) {
    console.log(this.ID, '|', ...args);
    //}
  }
}

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
function createHeroSystem6eMacro(bar, data, slot) {

  // Check if we want to override the default macro (open sheet)
  if (data.type === "Item" && typeof data.uuid === "string") {
    const item = fromUuidSync(data.uuid);
    if (item.isRollable()) {
      handleMacroCreation(bar, data, slot, item)
      return false
    }
  }
}

async function handleMacroCreation(bar, data, slot, item) {
  console.log("createHeroSystem6eMacro", item)
  if (!item) return;
  if (!item.roll) return;

  // Create the macro command
  const command = `game.herosystem6e.rollItemMacro("${item.name}", "${item.type}");`;
  let macro = game.macros.find(m => m.command === command && m.name === item.name && m.img === item.img);
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
}


/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName, itemType) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  let item = actor ? actor.items.find(i => i.name === itemName && (!itemType || i.type == itemType)) : null;
  console.log("rollItemMacro", item)

  // The selected actor does not have an item with this name.
  if (!item) {
    item = null
    // Search all owned tokens for this item
    for (let token of canvas.tokens.ownedTokens) {
      actor = token.actor
      item = actor.items.find(i => i.name === itemName && (!itemType || i.type == itemType))
      if (item) {
        break;
      }
    }

    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an ${itemType || 'item'} named ${itemName}`);
  }


  // Trigger the item roll
  return item.roll();
}


// The default Foundry cone angle is 53.13 degrees.
// This will set the default angle to 60 degrees.
// REF: https://github.com/dmdorman/hero6e-foundryvtt/issues/40
Hooks.on("setup", () => CONFIG.MeasuredTemplate.defaults.angle = 60);


// Migration Script
// For now we will migrate EVERY time
// TODO: add version setting check
// REF: https://www.youtube.com/watch?v=Hl23n3MvtaI
Hooks.once("ready", function () {
  if (!game.user.isGM) {
    return;
  }

  //console.log("migrateWorld")
  migrateActorTypes()
  migrateKnockback()
  //migrateWorld();

});

// async function migrateWorld()
// {
//   for (let actor of game.actors.contents) {
//     const updateData = migrateActorData(actor.system);
//     if (!foundry.utils.isEmpty(updateData)) {
//       console.log(`Migrating Actor entity ${actor.name}.`);
//       await actor.update(updateData);
//     }
//   }
// }

// function migrateActorData(actor)
// {
//   let updateData = {};
//   //updateData["system.type"] = 'complication';
//   return updateData;
// }

// Change Actor type from "character" to "pc"
async function migrateActorTypes() {
  const updates = [];
  for (let actor of game.actors) {
    if (actor.type !== "character") continue;

    if (actor.prototypeToken.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
      updates.push({ _id: actor.id, type: "pc" });
    }
    else {
      updates.push({ _id: actor.id, type: "npc" });
    }

  }
  if (updates.length > 0) {
    await Actor.updateDocuments(updates);
    ui.notifications.info(`${updates.length} actors migrated.`)
  }
}

// Change Attack knockback to knockbackMultiplier
async function migrateKnockback() {
  let updates = [];
  for (let actor of game.actors) {
    for (let item of actor.items) {
      if (item.type === 'attack') {
        if (item.system.knockback && parseInt(item.system.knockbackMultiplier) == 0) {
          updates.push({ _id: item.id, system: { knockbackMultiplier: 1, knockback: null } });
        }
      }
    }
    if (updates.length > 0) {
      await Item.updateDocuments(updates, { parent: actor });
      ui.notifications.info(`${updates.length} attacks migrated for ${actor.name}.`)
      updates = []
    }
  }

}


// Remove Character from selectable actor types
Hooks.on("renderDialog", (dialog, html, data) => {
  if (html[0].querySelector(".window-title").textContent != "Create New Actor") return
  let option = html[0].querySelector("option[value*='character']")
  if (option) option.remove()
})


//Modify TokenHUD (need 3 bars: end, stun, body)
Hooks.on("renderTokenHUD", HeroSystem6eTokenHud);
Hooks.on("renderTokenConfig", extendTokenConfig);