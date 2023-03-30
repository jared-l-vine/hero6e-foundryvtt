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
      skillData.characteristic = skill.getAttribute('CHARACTERISTIC')
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
      HEROSYS.log(false, skillData.name + ' was not included in skills.  Likely Skill Enhancer')
      return
    }

    const itemData = {
      name,
      type: 'skill',
      system: skillData
    }

    await HeroSystem6eItem.create(itemData, { parent: this.actor })
}
