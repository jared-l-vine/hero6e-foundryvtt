import { HEROSYS } from "./herosystem6e"

export function AttackCheck()
{
  HEROSYS.log(false, "AttackCheck", this)
  
  let rollFormula = "3d6"
  let rollData = {
  }
  let messageData = {
    speaker: ChatMessage.getSpeaker()
  }
  //new rollItemMacro(rollFormula, rollData).roll({async:true}).toMessage(messageData);
}

async function GetAttackOptions(itemId)
{
  HEROSYS.log(false, "GetAttackOptions")

  const template = "systems/hero6efoundryvttv2/templates/attack/item-attack-card.hbs"
  const html = await renderTemplate(template, {})

  return new Promise(resolve => {
    const data = {
      title: "title",
      content: html,
      buttons: {
        normal: {
          label: "label",
          callback: html => resolve(_processAttackOptions(html[0].querySelector("form")))
        },
        calcel: {
          label: "cancel",
          callback: html => resolve({canclled: true})
        }
      },
      default: "normal",
      close: () => resolve({cancelled: true})
    }
    new Dialog(data, null).render(true)
  });
}

function _processAttackOptions(form)
{
  return {

  }
}