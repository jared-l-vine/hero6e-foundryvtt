import { HEROSYS } from "../herosystem6e.js";
import { HeroSystem6eItem } from "../item/item.js";

export async function uploadBasic(xml, type) {
  let name = xml.getAttribute('NAME')
  name = (name === '') ? xml.getAttribute('ALIAS') : name

  const xmlid = xml.getAttribute('XMLID')

  if (xmlid === 'GENERIC_OBJECT') { return; }

  let itemData = {
    'type': type,
    'name': name,
    'system.id': xmlid,
    'system.rules': xml.getAttribute('ALIAS')
  }

  await HeroSystem6eItem.create(itemData, { parent: this.actor })
}

export async function uploadTalent(xml, type) {
  let name = xml.getAttribute('NAME')
  name = (name === '') ? xml.getAttribute('ALIAS') : name

  const xmlid = xml.getAttribute('XMLID')

  if (xmlid === 'GENERIC_OBJECT') { return; }

  let other = {}

  switch (xmlid) {
    case ('LIGHTNING_REFLEXES_ALL'): {
      other = {
        'levels': xml.getAttribute('LEVELS'),
        'option_alias': xml.getAttribute('OPTION_ALIAS')
      }
      break;
    }
    default: {
      break;
    }
  }

  const itemData = {
    'type': type,
    'name': name,
    'system.id': xmlid,
    'system.rules': xml.getAttribute('ALIAS'),
    'system.other': other
  }

  await HeroSystem6eItem.create(itemData, { parent: this.actor })
}

export async function uploadSkill(skill) {
    const xmlid = skill.getAttribute('XMLID')
    
    if (xmlid === 'GENERIC_OBJECT') { return; }

    let description = skill.getAttribute('ALIAS')

    if (xmlid === 'KNOWLEDGE_SKILL' || xmlid === 'PROFESSIONAL_SKILL' || xmlid === 'SCIENCE_SKILL') {
      if (skill.hasAttribute('INPUT')) {
        description += ': ' + skill.getAttribute('INPUT')
      }
    }

    let name = ''

    if (skill.hasAttribute('NAME') && skill.getAttribute('NAME') !== '') {
      name = skill.getAttribute('NAME')
    } else {
      name = description
    }

    name = (name === '') ? description : name

    const skillData = {
      levels: skill.getAttribute('LEVELS'),
      state: 'trained'
    }

    skillData.description = description

    if (skill.attributes.getNamedItem('CHARACTERISTIC')) {
      skillData.characteristic = skill.getAttribute('CHARACTERISTIC').toLowerCase()
    } else {
      skillData.characteristic = ''
    }

    if (skill.attributes.getNamedItem('FAMILIARITY')) {
      if (skill.getAttribute('FAMILIARITY') === 'Yes') {
        skillData.state = 'familiar'

        if (skill.getAttribute('EVERYMAN') === 'Yes') {
          skillData.state = 'everyman'
        }
      }

      if (skill.getAttribute('PROFICIENCY') === 'Yes') {
        skillData.state = 'proficient'
      }
    } else {
      skillData.state = 'noroll'
    }

    if (xmlid === 'PROFESSIONAL_SKILL') skillData.ps = true

    if (skill.hasAttribute('PARENTID')) {
      skillData.parentid = skill.getAttribute('PARENTID')
    }

    if (skill.hasAttribute('ID')) {
      skillData.hdcid = skill.getAttribute('ID')
    }

    if (skill.hasAttribute("OPTION_ALIAS"))
    {
      skillData.optionAlias = skill.getAttribute('OPTION_ALIAS')
    }

    // determine Skill Roll
    if (skillData.state === 'everyman') {
      skillData.roll = '8-'
    } else if (skillData.state === 'familiar') {
      skillData.roll = '8-'
    } else if (skillData.state === 'proficient') {
      skillData.roll = '10-'
    } else if (skillData.state === 'trained') {
      const charValue = ((skillData.characteristic.toLowerCase() !== 'general') && (skillData.characteristic.toLowerCase() != '')) ?
        this.actor.system.characteristics[`${skillData.characteristic.toLowerCase()}`].value : 0

      const rollVal = 9 + Math.round(charValue / 5) + parseInt(skillData.levels)
      skillData.roll = rollVal.toString() + '-'
    } else
    {
      // This is likely a Skill Enhancer.
      // Skill Enahncers provide a discount to the purchase of asssociated skills.
      // They no not change the roll.
      // Skip for now.
      HEROSYS.log(false, xmlid + ' was not included in skills.  Likely Skill Enhancer')
      return
    }

    const itemData = {
      name,
      type: 'skill',
      system: skillData
    }

    await HeroSystem6eItem.create(itemData, { parent: this.actor })
}

export async function uploadAttack(power) {
  const xmlid = power.getAttribute('XMLID')
  let configPowerInfo = CONFIG.HERO.powers[xmlid]

  // Verify we have an attack
  if (!configPowerInfo.powerType.includes("attack")) return

  let description = power.getAttribute('ALIAS')
  let name = ''
  if (power.hasAttribute('NAME') && power.getAttribute('NAME') !== '') {
    name = power.getAttribute('NAME')
  } else {
    name = description
  }

  const levels = parseInt(power.getAttribute('LEVELS'))
  const input = power.getAttribute('INPUT')

  let itemData = {
    name,
    type: "attack",
    system: {
      class: input === "ED" ? "energy" : "physical",
      dice: levels,
      end: 0,
      extraDice: "zero",
      killing: false,
      knockbackMultiplier: 1,
      targets: "dcv",
      uses: "ocv",
      usesStrength: true,
    }
  }

  // Armor Piercing
  let ARMORPIERCING = power.querySelector('[XMLID="ARMORPIERCING"]')
  if (ARMORPIERCING)
  {
    itemData.system.piercing = parseInt(ARMORPIERCING.getAttribute("LEVELS"))
  }

  // Penetrating
  let PENETRATING = power.querySelector('[XMLID="PENETRATING"]')
  if (PENETRATING)
  {
    itemData.system.penetrating = parseInt(PENETRATING.getAttribute("LEVELS"))
  }

  // No Knockback
  let NOKB = power.querySelector('[XMLID="NOKB"]')
  if (NOKB)
  {
    itemData.system.knockbackMultiplier = 0
  }

  // Double Knockback
  let DOUBLEKB = power.querySelector('[XMLID="DOUBLEKB"]')
  if (DOUBLEKB)
  {
    itemData.system.knockbackMultiplier = 2
  }

    
  if (power.querySelector('[XMLID="PLUSONEPIP"]'))
  {
    itemData.system.extraDice = "pip"
  }

  if (power.querySelector('[XMLID="PLUSONEHALFDIE"]'))
  {
    itemData.system.extraDice = "half"
  }

  if (power.querySelector('[XMLID="MINUSONEPIP"]'))
  {
    // Typically only allowed for killing attacks.
    // Appears that +1d6-1 is roughly equal to +1/2 d6
    itemData.system.extraDice = "half"
  }

  const aoe = power.querySelector('[XMLID="AOE"]')
  if (aoe) {
    itemData.system.areaOfEffect = { 
      type: aoe.getAttribute('OPTION_ALIAS').toLowerCase(),
      value: parseInt(aoe.getAttribute('LEVELS'))
    }
  }

  if (xmlid === "HANDTOHANDATTACK")
  {
    await HeroSystem6eItem.create(itemData, { parent: this.actor })
    return
  }

  if (xmlid === "HKA")
  {
    itemData.system.killing = true
    await HeroSystem6eItem.create(itemData, { parent: this.actor })
    return
  }

  
  if (xmlid === "TELEKINESIS")
  {
    // levels is the equivalent strength
    itemData.system.extraDice = "zero"
    itemData.system.dice = Math.floor(levels / 5)
    if (levels % 5 >=3) itemData.system.extraDice = "half"
    itemData.name += " (TK strike)"
    itemData.system.usesStrength = false
    await HeroSystem6eItem.create(itemData, { parent: this.actor })
    return
  }

  if (xmlid === "ENERGYBLAST")
  {
    itemData.system.usesStrength = false
    await HeroSystem6eItem.create(itemData, { parent: this.actor })
    return
  }

  if (xmlid === "RKA")
  {
    itemData.system.killing = true
    itemData.system.usesStrength = false
    await HeroSystem6eItem.create(itemData, { parent: this.actor })
    return
  }
   

  if (game.settings.get(game.system.id, 'alphaTesting')) {
    ui.notifications.warn(`${xmlid} not implemented during HDC upload of ${this.actor.name}`)
  }
}
