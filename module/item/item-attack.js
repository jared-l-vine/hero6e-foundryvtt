// import { HeroSystem6eCard } from "./card.js";
import { modifyRollEquation, getTokenChar } from "../utility/util.js"

export async function chatListeners(html) {
  // Called by carrd-helpers.js
  html.on('click', 'button.roll-damage', this._onRollDamage.bind(this));
  html.on('click', 'button.apply-damage', this._onApplyDamage.bind(this));
}



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
        if (options.effectivestr <= actor.system.characteristics.str.value) {
            strEnd =  Math.round(options.effectivestr / 10);
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

  let targetIds = []
  for (let target of Array.from(game.user.targets))
  {
    targetIds.push(target.id )
  }

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
    //effectivestr: options.effectivestr,
    targets: Array.from(game.user.targets),
    targetIds: targetIds,

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
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: result,
    user:  game.user._id,
    content: cardHtml,
    speaker: speaker,
  }

  
  return ChatMessage.create(chatData)
}

// Event handler for when the Roll Damage button is 
// clicked on item-attack-card2.hbs
// Notice the chatListeners function in this file.
export async function _onRollDamage(event)
{
  const button = event.currentTarget;
  const toHitData = {...button.dataset}
  const item = fromUuidSync(toHitData.itemid);
  const template = "systems/hero6efoundryvttv2/templates/chat/item-damage-card2.hbs"
  const actor = item.actor
  const itemId = item._id
  const itemData = item.system;

  console.log("_onRollDamage", item, toHitData);

  let damageRoll = itemData.dice;

  // let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];

  // let automation = game.settings.get("hero6efoundryvttv2", "automation");

  let tags = []
  tags.push({value: itemData.dice, name: "base" })

  if(itemData.usesStrength) {
    // let strDamage = Math.floor((actor.system.characteristics.str.value - 10)/5)
    // if (toHitData.effectivestr <= actor.system.characteristics.str.value) {
    //     strDamage = Math.floor((toHitData.effectivestr)/5);
    // }
    let strDamage = Math.floor(Math.max(toHitData.effectivestr, actor.system.characteristics.str.value)/5)

    if (strDamage > 0) {
        damageRoll = parseInt(damageRoll) + parseInt(strDamage)
        tags.push({value: strDamage, name: "strength" })
    }
  }

  let pip = 0;

  damageRoll = damageRoll < 0 ? 0 : damageRoll;

  // needed to split this into two parts for damage negation
  switch (itemData.extraDice) {
    case 'zero':
      pip += 0;
      break;
    case 'pip':
      pip += 1;
      break;
    case 'half':
      pip += 2;
      break;
  }

  if (pip < 0) {
    damageRoll = "0D6";
  } else {
    switch (pip) {
      case 0:
        damageRoll += "D6";
        break;
      case 1:
        damageRoll += "D6+1";
        break;
      case 2:
        damageRoll += "D6+1D3"
        break;
    }
  }

  damageRoll = modifyRollEquation(damageRoll, toHitData.damagemod);
  if (parseInt(toHitData.damagemod) !=0)
  {
    tags.push({value: toHitData.damagemod, name: "misc" })
  }

  let roll = new Roll(damageRoll, actor.getRollData());
  let damageResult = await roll.roll({async: true});
  let damageRenderedResult = await damageResult.render();

  // Need actual dice rolls for Damage Negation
  let dice = []
  for (let d of damageResult.terms[0].results)
  {
    dice.push(d.result)
  }

  const damageDetail = await _calcDamage(dice, item, toHitData)




  let cardData = {
    item: item,
    // dice rolls
    renderedDamageRoll: damageRenderedResult,
    renderedStunMultiplierRoll: damageDetail.renderedStunMultiplierRoll,

    // hit locations
    // useHitLoc: useHitLoc,
    // hitLocText: hitLocText,

    // body
    bodyDamage: damageDetail.bodyDamage,
    bodyDamageEffective: damageDetail.body,
    countedBody: damageDetail.countedBody,

    // stun
    stunDamage: damageDetail.stunDamage,
    stunDamageEffective: damageDetail.stun,
    hasRenderedDamageRoll: true,
    stunMultiplier: damageDetail.stunMultiplier,
    hasStunMultiplierRoll: damageDetail.hasStunMultiplierRoll,
    dice: dice,

    // misc
    targetIds: toHitData.targetids,
    tags: tags,

    
  };

  // render card
  let cardHtml = await renderTemplate(template, cardData) //await HeroSystem6eDamageCard2._renderInternal(actor, item, null, cardData);

  let speaker = ChatMessage.getSpeaker()


  const chatData = {
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: damageResult,

    user:  game.user._id,
    content: cardHtml,
    speaker: speaker,
  }

  return ChatMessage.create(chatData);


}


// Event handler for when the Apply Damage button is 
// clicked on item-damage-card2.hbs
// Notice the chatListeners function in this file.
export async function _onApplyDamage(event)
{
  
  console.log(event)



  // Check to make sure we have a selected token
  if (canvas.tokens.controlled.length == 0)
  {
    return ui.notifications.warn(`You must select at least one token before applying damage.`);
  }

  for(let token of canvas.tokens.controlled)
  {
   _onApplyDamageToSpecificToken(event, token.id)
  }

}

export async function _onApplyDamageToSpecificToken(event, tokenId)
{
  const button = event.currentTarget;
  const damageData = {...button.dataset}
  const item = fromUuidSync(damageData.itemid)
  const template = "systems/hero6efoundryvttv2/templates/chat/item-damage-card2.hbs"
  const actor = item.actor
  const itemId = item._id
  const itemData = item.system;

  const token = canvas.tokens.get(tokenId)

  console.log("_onApplyDamageToSpecificToken", token.name, damageData)

  // We need to recalcuate damage to account for possible Damage Negation
  const damageDetail = await _calcDamage(damageData.dice, item, damageData)
  console.log(damageDetail)

}


async function _calcDamage(dice, item, options)
{
  
  let damageDetail = {}
  const itemData = item.system
  damageDetail.body = 0;
  damageDetail.stun = 0;
  damageDetail.countedBody = 0;
  damageDetail.damageResult = {}
  damageDetail.damageResult.total = 0

  // Recreate roll
  //let terms = []
  for (let d of dice)
  {
    damageDetail.damageResult.total += d
    // if (terms.length > 0)
    // {
    //   terms.push(new OperatorTerm({operator: "+"}))
    // }
    // terms.push(new Die({number: d, faces: 6}))
  }

  damageDetail.dice = dice;

  damageDetail.hasStunMultiplierRoll = false;
  damageDetail.renderedStunMultiplierRoll = null;
  damageDetail.stunMultiplier = 1;

  if (itemData.killing) {
    damageDetail.hasStunMultiplierRoll = true;
    damageDetail.body = damageResult.total;

    let stunRoll = new Roll("1D3", actor.getRollData());
    let stunResult = await stunRoll.roll();
    let renderedStunResult = await stunResult.render();
    damageDetail.renderedStunMultiplierRoll = renderedStunResult;

    if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
      damageDetail.stunMultiplier =  hitLocationModifiers[0];
    } else {
      damageDetail.stunMultiplier = stunResult.total;
    }

    damageDetail.stun = damageDetail.body * stunMultiplier;
  }
  else {
      // counts body damage for non-killing attack
      for (let die of dice) {
          switch (die.result) {
              case 1:
                damageDetail.countedBody += 0;
                  break;
              case 6:
                damageDetail.countedBody += 2;
                  break;
              default:
                damageDetail.countedBody += 1;
                  break;
          }
      }

      damageDetail.stun = damageDetail.damageResult.total;
      damageDetail.body = damageDetail.countedBody;
  }

  damageDetail.bodyDamage = damageDetail.body;
  damageDetail.stunDamage = damageDetail.stun;

  damageDetail.effects = "";
  if (item.system.effects !== "") {
    damageDetail.effects = item.system.effects + ";"
  }

  damageDetail.hitLocText = "";
  if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
      if(itemData.killing) {
          // killing attacks apply hit location multiplier after resistant damage protection has been subtracted
          damageDetail.body = damageDetail.body * hitLocationModifiers[2];

          damageDetail.hitLocText = "Hit " + hitLocation + " (x" + hitLocationModifiers[0] + " STUN x" + hitLocationModifiers[2] + " BODY)";
      } else {
          // stun attacks apply N STUN hit location multiplier after defenses
          damageDetail.stun = damageDetail.stun * hitLocationModifiers[1];
          damageDetail.body = damageDetail.body * hitLocationModifiers[2];

          damageDetail.hitLocText = "Hit " + hitLocation + " (x" + hitLocationModifiers[1] + " STUN x" + hitLocationModifiers[2] + " BODY)";
      }

      damageDetail.hasStunMultiplierRoll = false;
  }

  

  // minimum damage rule
  if (damageDetail.stun < damageDetail.body) {
    damageDetail.stun = damageDetail.body;
    damageDetail.effects += "minimum damage invoked; "
  }

  damageDetail.stun = Math.round(damageDetail.stun)
  damageDetail.body = Math.round(damageDetail.body)

  return damageDetail
}