// import { HeroSystem6eCard } from "./card.js";
import { modifyRollEquation, getTokenChar } from "../utility/util.js"



/// Dialog box for AttackOptions
export async function AttackOptions(item)
{
  const data = {
      item: item,
      state: null,
      str: item.actor.system.characteristics.str.value
  }

  if (game.settings.get("hero6efoundryvttv2", "hit locations")) {
    data.useHitLoc = true;
    data.hitLoc = CONFIG.HERO.hitLocations; 
  }

  const template = "systems/hero6efoundryvttv2/templates/attack/item-attack-card2.hbs"
  const html = await renderTemplate(template, data)
  return new Promise(resolve => {
    const data = {
      title: item.actor.name + " roll to hit",
      content: html,
      buttons: {
        normal: {
          label: "Roll to Hit",
          callback: html => resolve(_processAttackOptions(item, html[0].querySelector("form")))
        },
        // cancel: {
        //   label: "cancel",
        //   callback: html => resolve({canclled: true})
        // }
      },
      default: "normal",
      close: () => resolve({cancelled: true})
    }
    new Dialog(data, null).render(true)
  });

}

async function _processAttackOptions(item, form)
{
  // convert form data into json object
  const formData = new FormData(form)
  let options = {}
  for (const [key, value] of formData) {
    options[key] = value
  }

  await AttackToHit(item, options)
}


/// ChatMessage showing Attack To Hit
export async function AttackToHit(item, options)
{
  console.log("Attack", item, options)
  const template = "systems/hero6efoundryvttv2/templates/chat/item-toHit-card2.hbs"

  const actor = item.actor
  const itemId = item._id
  const itemData = item.system;

  const hitCharacteristic = actor.system.characteristics[itemData.uses].value;
  let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];

  let automation = game.settings.get("hero6efoundryvttv2", "automation");

  // -------------------------------------------------
  // attack roll
  // -------------------------------------------------
  let rollEquation = "11 + " + hitCharacteristic;
  rollEquation = modifyRollEquation(rollEquation, item.system.toHitMod);
  rollEquation = modifyRollEquation(rollEquation, options.toHitMod);
  let noHitLocationsPower = false;
  if (game.settings.get("hero6efoundryvttv2", "hit locations") && options.aim !== "none" && !noHitLocationsPower) {
      rollEquation = modifyRollEquation(rollEquation, CONFIG.HERO.hitLocations[options.aim][3]);
  }
  rollEquation = rollEquation + " - 3D6";

  let attackRoll = new Roll(rollEquation, actor.getRollData());
  let result = await attackRoll.evaluate({async: true});
  let renderedResult = await result.render();

  let hitRollData = result.total;
  let hitRollText = "Hits a " + toHitChar + " of " + hitRollData;
  // -------------------------------------------------

  let useEnd = false;
  let enduranceText = "";
  if (game.settings.get("hero6efoundryvttv2", "use endurance")) {
    useEnd = true;
    let valueEnd = actor.system.characteristics.end.value
    let itemEnd = item.system.end;
    let newEnd = valueEnd - itemEnd;
    let spentEnd = itemEnd;

    if(itemData.usesStrength) {
        let strEnd =  Math.round(actor.system.characteristics.str.value / 10);
        if (options.effectiveStr <= actor.system.characteristics.str.value) {
            strEnd =  Math.round(options.effectiveStr / 10);
        }

        newEnd = parseInt(newEnd) - parseInt(strEnd);
        spentEnd = parseInt(spentEnd) + parseInt(strEnd);
    }
    
    if (newEnd < 0) {
        enduranceText = 'Spent ' + valueEnd + ' END and ' + Math.abs(newEnd) + ' STUN';
    } else {
        enduranceText = 'Spent ' + spentEnd + ' END';
    }

    if ((automation === "all") || (automation === "npcOnly" && !actor.hasPlayerOwner) || (automation === "pcEndOnly")) {
      let changes = {};
      if (newEnd < 0) {
          changes = {
              "data.characteristics.end.value": 0,
              "data.characteristics.stun.value": parseInt(actor.system.characteristics.stun.value) + parseInt(newEnd),
          }
      } else {
          changes = {
              "data.characteristics.end.value": newEnd,
          }
      }
      await actor.update(changes);
    }
  }

  // let targets = []
  // for (let target of Array.from(game.user.targets))
  // {
  //   targets.push({name: target.actor.name, id: target.id })
  // }

  let cardData = {
    // dice rolls
    //rolls: [attackRoll],
    renderedHitRoll: renderedResult,
    hitRollText: hitRollText,
    hitRollValue: result.total,

    // data for damage card
    item,
    ...options,
    hitRollData: hitRollData,
    effectiveStr: options.effectiveStr,
    targets: Array.from(game.user.targets),

    // endurance
    useEnd: useEnd,
    enduranceText: enduranceText,
  };

  // render card
  let cardHtml = await renderTemplate(template, cardData) //wait HeroSystem6eToHitCard2._renderInternal(item, actor, stateData);
  
  let token = actor.token;

  let speaker = ChatMessage.getSpeaker({ actor: actor, token })
  speaker["alias"] = actor.name;

  const chatData = {
      user:  game.user._id,
      content: cardHtml,
      speaker: speaker
  }

  
  return ChatMessage.create(chatData)
}