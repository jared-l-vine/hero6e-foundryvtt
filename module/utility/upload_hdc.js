import { HEROSYS } from "../herosystem6e.js";
import { HeroSystem6eItem } from "../item/item.js";


export async function applyCharacterSheet(xmlDoc) {
    console.log("applyCharacterSheet")

    const characterTemplate = xmlDoc.getElementsByTagName('CHARACTER')[0].getAttribute("TEMPLATE")
    const characterInfo = xmlDoc.getElementsByTagName('CHARACTER_INFO')[0]
    const characteristics = xmlDoc.getElementsByTagName('CHARACTERISTICS')[0]
    const skills = xmlDoc.getElementsByTagName('SKILLS')[0]
    const powers = xmlDoc.getElementsByTagName('POWERS')[0]
    const perks = xmlDoc.getElementsByTagName('PERKS')[0]
    const talents = xmlDoc.getElementsByTagName('TALENTS')[0]
    const martialarts = xmlDoc.getElementsByTagName('MARTIALARTS')[0]
    const complications = xmlDoc.getElementsByTagName('DISADVANTAGES')[0]
    const equipment = xmlDoc.getElementsByTagName('EQUIPMENT')[0]
    const image = xmlDoc.getElementsByTagName('IMAGE')[0]





    // let elementsToLoad = ["POWERS", "PERKS", "TALENTS", "MARTIALARTS", "DISADVANTAGES"]

    // Individual changes to the actor are not very effecient.
    // Instead save all the changes and perform a bulk update.
    const changes = []
    changes[`system.characterTemplate`] = characterTemplate

    if (characterInfo.getAttribute('CHARACTER_NAME') !== '') {
        let name = characterInfo.getAttribute('CHARACTER_NAME')
        changes[`name`] = name

        // Override name of prototype token if HDC upload was from library
        if (this.actor.prototypeToken) {
            changes[`prototypeToken.name`] = name
        }

        // Overwrite token name if PC
        if (this.token) {
            if (this.actor.type == 'pc') {
                await this.token.update({ name: name })
            }
        }
    }

    // Biography
    let Biography = ""
    for (let child of characterInfo.children) {
        let text = child.textContent.trim();
        if (text) {
            Biography += "<p><b>" + child.nodeName + "</b>: " + text + "</p>"
        }
    }
    changes[`system.biography`] = Biography;

    // Remove all items from
    // for (const item of this.actor.items) {
    //   await item.delete()
    // }
    // This is a faster (bulk) operation to delete all the items
    await this.actor.deleteEmbeddedDocuments("Item", Array.from(this.actor.items.keys()))


    // determine spd upfront for velocity calculations
    let spd
    let value
    for (const characteristic of characteristics.children) {
        const key = CONFIG.HERO.characteristicsXMLKey[characteristic.getAttribute('XMLID')]
        value = CONFIG.HERO.characteristicDefaults[key] + parseInt(characteristic.getAttribute('LEVELS'))

        if (key === 'spd') {
            spd = value
        }
    }

    for (const characteristic of characteristics.children) {
        const key = CONFIG.HERO.characteristicsXMLKey[characteristic.getAttribute('XMLID')]
        value = CONFIG.HERO.characteristicDefaults[key] + parseInt(characteristic.getAttribute('LEVELS'))
        changes[`system.characteristics.${key}.value`] = value
        changes[`system.characteristics.${key}.max`] = value
        changes[`system.characteristics.${key}.core`] = value

        if (key in CONFIG.HERO.movementPowers) {
            let name = characteristic.getAttribute('NAME')
            name = (name === '') ? characteristic.getAttribute('ALIAS') : name
            const velocity = Math.round((spd * value) / 12)
            const itemData = {
                name: name,
                type: 'movement',
                system: {
                    type: key,
                    editable: false,
                    base: value,
                    value,
                    velBase: velocity,
                    velValue: velocity,
                    class: key,
                }
            }

            await HeroSystem6eItem.create(itemData, { parent: this.actor })
        }
    }

    await this.actor.update(changes)

    // Initial 5e support
    // 5th edition has no edition designator, so assuming if there is no 6E then it is 5E.
    if (characterTemplate.includes("builtIn.") && !characterTemplate.includes("6E.")) {
        const figuredChanges = {}
        figuredChanges[`system.is5e`] = true  // used in item-attack.js to modify killing attack stun multiplier

        // One major difference between 5E and 6E is figured characteristics.

        // Physical Defense (PD) STR/5
        const pdLevels = this.actor.system.characteristics.pd.max - CONFIG.HERO.characteristicDefaults.pd;
        const pdFigured = Math.round(this.actor.system.characteristics.str.max / 5)
        figuredChanges[`system.characteristics.pd.max`] = pdLevels + pdFigured
        figuredChanges[`system.characteristics.pd.value`] = pdLevels + pdFigured
        figuredChanges[`system.characteristics.pd.base`] = pdFigured //this.actor.system.characteristics.pd.base + pdFigured
        figuredChanges[`system.characteristics.pd.core`] = pdLevels + pdFigured
        figuredChanges[`system.characteristics.pd.figured`] = pdFigured

        // Energy Defense (ED) CON/5
        const edLevels = this.actor.system.characteristics.ed.max - CONFIG.HERO.characteristicDefaults.ed;
        const edFigured = Math.round(this.actor.system.characteristics.con.max / 5)
        figuredChanges[`system.characteristics.ed.max`] = edLevels + edFigured
        figuredChanges[`system.characteristics.ed.value`] = edLevels + edFigured
        figuredChanges[`system.characteristics.ed.base`] = edFigured //this.actor.system.characteristics.ed.base + edFigured
        figuredChanges[`system.characteristics.ed.core`] = edLevels + edFigured
        figuredChanges[`system.characteristics.ed.figured`] = edFigured

        // Speed (SPD) 1 + (DEX/10)
        const spdLevels = this.actor.system.characteristics.spd.max - CONFIG.HERO.characteristicDefaults.spd;
        const spdFigured = 1 + Math.floor(this.actor.system.characteristics.dex.max / 10)
        figuredChanges[`system.characteristics.spd.max`] = spdLevels + spdFigured
        figuredChanges[`system.characteristics.spd.value`] = spdLevels + spdFigured
        figuredChanges[`system.characteristics.spd.base`] = spdFigured //this.actor.system.characteristics.spd.base + spdFigured
        figuredChanges[`system.characteristics.spd.core`] = spdLevels + spdFigured
        figuredChanges[`system.characteristics.spd.figured`] = spdFigured

        // Recovery (REC) (STR/5) + (CON/5)
        const recLevels = this.actor.system.characteristics.rec.max - CONFIG.HERO.characteristicDefaults.rec;
        const recFigured = Math.round(this.actor.system.characteristics.str.max / 5) + Math.round(this.actor.system.characteristics.con.max / 5)
        figuredChanges[`system.characteristics.rec.max`] = recLevels + recFigured
        figuredChanges[`system.characteristics.rec.value`] = recLevels + recFigured
        figuredChanges[`system.characteristics.rec.base`] = recFigured //this.actor.system.characteristics.rec.base + recFigured
        figuredChanges[`system.characteristics.rec.core`] = recLevels + recFigured
        figuredChanges[`system.characteristics.rec.figured`] = recFigured

        // Endurance (END) 2 x CON
        const endLevels = this.actor.system.characteristics.end.max - CONFIG.HERO.characteristicDefaults.end;
        const endFigured = Math.round(this.actor.system.characteristics.con.max * 2)
        figuredChanges[`system.characteristics.end.max`] = endLevels + endFigured
        figuredChanges[`system.characteristics.end.value`] = endLevels + endFigured
        figuredChanges[`system.characteristics.end.base`] = endFigured //this.actor.system.characteristics.end.base + endFigured
        figuredChanges[`system.characteristics.end.core`] = endLevels + endFigured
        figuredChanges[`system.characteristics.end.figured`] = endFigured

        // Stun (STUN) BODY+(STR/2)+(CON/2) 
        const stunLevels = this.actor.system.characteristics.stun.max - CONFIG.HERO.characteristicDefaults.stun;
        const stunFigured = this.actor.system.characteristics.body.max + Math.round(this.actor.system.characteristics.str.max / 2) + Math.round(this.actor.system.characteristics.con.max / 2)
        figuredChanges[`system.characteristics.stun.max`] = stunLevels + stunFigured
        figuredChanges[`system.characteristics.stun.value`] = stunLevels + stunFigured
        figuredChanges[`system.characteristics.stun.base`] = stunFigured //this.actor.system.characteristics.stun.base + stunFigured
        figuredChanges[`system.characteristics.stun.core`] = stunLevels + stunFigured
        figuredChanges[`system.characteristics.stun.figured`] = stunFigured


        // Base OCV & DCV = Attacker’s DEX/3
        const baseCv = Math.round(this.actor.system.characteristics.dex.max / 3)
        figuredChanges[`system.characteristics.ocv.max`] = baseCv // + this.actor.system.characteristics.ocv.max - this.actor.system.characteristics.ocv.base
        figuredChanges[`system.characteristics.ocv.value`] = baseCv // + this.actor.system.characteristics.ocv.max - this.actor.system.characteristics.ocv.base
        figuredChanges[`system.characteristics.ocv.base`] = 0 //baseCv + this.actor.system.characteristics.ocv.max - this.actor.system.characteristics.ocv.base
        figuredChanges[`system.characteristics.dcv.max`] = baseCv // + this.actor.system.characteristics.dcv.max - this.actor.system.characteristics.dcv.base
        figuredChanges[`system.characteristics.dcv.value`] = baseCv //+ this.actor.system.characteristics.dcv.max - this.actor.system.characteristics.dcv.base
        figuredChanges[`system.characteristics.dcv.base`] = 0 //baseCv + this.actor.system.characteristics.dcv.max - this.actor.system.characteristics.dcv.base

        //Base Ego Combat Value = EGO/3
        const baseEcv = Math.round(this.actor.system.characteristics.ego.max / 3)
        figuredChanges[`system.characteristics.omcv.max`] = baseEcv //+ this.actor.system.characteristics.omcv.max - this.actor.system.characteristics.omcv.base
        figuredChanges[`system.characteristics.omcv.value`] = baseEcv //+ this.actor.system.characteristics.omcv.max - this.actor.system.characteristics.omcv.base
        figuredChanges[`system.characteristics.omcv.base`] = 0 //baseEcv + this.actor.system.characteristics.omcv.max - this.actor.system.characteristics.omcv.base
        figuredChanges[`system.characteristics.dmcv.max`] = baseEcv //+ this.actor.system.characteristics.dmcv.max - this.actor.system.characteristics.dmcv.base
        figuredChanges[`system.characteristics.dmcv.value`] = baseEcv //+ this.actor.system.characteristics.dmcv.max - this.actor.system.characteristics.dmcv.base
        figuredChanges[`system.characteristics.dmcv.base`] = 0 //baseEcv + this.actor.system.characteristics.dmcv.max - this.actor.system.characteristics.dmcv.base


        await this.actor.update(figuredChanges)
    }



    for (const skill of skills.children) {
        await uploadSkill.call(this, skill)
    }

    // Perception Skill
    const itemDataPerception = {
        name: 'Perception',
        type: 'skill',
        system: {
            characteristic: "int",
            state: 'trained',
            levels: "0"
        }
    }

    await HeroSystem6eItem.create(itemDataPerception, { parent: this.actor })

    const relevantFields = ['BASECOST', 'LEVELS', 'ALIAS', 'MULTIPLIER', 'NAME', 'OPTION_ALIAS', 'SFX',
        'PDLEVELS', 'EDLEVELS', 'MDLEVELS', 'INPUT', 'OPTIONID' // FORCEFIELD
    ]
    for (const power of powers.children) {
        let xmlid = power.getAttribute('XMLID')
        const name = power.getAttribute('NAME')
        const alias = power.getAttribute('ALIAS')
        const levels = power.getAttribute('LEVELS')
        const input = power.getAttribute('INPUT')
        let activeCost = levels * 5;

        if (xmlid === 'GENERIC_OBJECT') { continue; }

        // Rebrand?
        xmlid = CONFIG.HERO.powersRebrand[xmlid] || xmlid;

        // Check if we have CONFIG info about this power
        let configPowerInfo = CONFIG.HERO.powers[xmlid]
        if (configPowerInfo) {
            // switch (configPowerInfo.powerType)
            // {
            //   case "attack": break // TODO: unimplemented
            //   case "characteristic": break // TODO: unimplemented
            //   case "defense": break // TODO: unimplemented
            //   case "mental": break // TODO: unimplemented
            //   case "movement": break // handled elsewhere?
            //   case "sense": break // handled elsewhere?
            //   case "skill": await uploadSkill.call(this, power); break
            //   default : ui.notifications.warn(`${xmlid} not handle during HDC upload of ${this.actor.name}`)
            // }
            if ((configPowerInfo?.powerType || "").includes("skill")) {
                await uploadSkill.call(this, power);
            }

            // Detect attacks
            //let configPowerInfo = CONFIG.HERO.powers[power.system.rules]
            if (configPowerInfo.powerType.includes("attack")) {
                await uploadAttack.call(this, power);
            }

        }
        else {
            if (game.settings.get(game.system.id, 'alphaTesting')) {
                ui.notifications.warn(`${xmlid} not handled during HDC upload of ${this.actor.name}`)
                console.log(power)
            }

        }

        let itemName = name
        if (name === undefined || name === '') {
            itemName = alias
        }

        const powerData = {}

        for (const attribute of power.attributes) {
            const attName = attribute.name

            if (relevantFields.includes(attName)) {
                const attValue = attribute.value

                powerData[attName] = attValue
            }
        }

        const modifiers = {}
        for (const modifier of power.children) {
            const xmlidModifier = modifier.getAttribute('XMLID')

            if (xmlidModifier !== null) {
                modifiers.push({
                    xmlid: xmlidModifier,
                    alias: modifier.getAttribute('ALIAS'),
                    comments: modifier.getAttribute('ALIAS'),
                    option: modifier.getAttribute('OPTION'),
                    optionId: modifier.getAttribute('OPTIONID'),
                    optionAlias: modifier.getAttribute('OPTION_ALIAS'),
                    LEVELS: modifier.getAttribute('LEVELS'),
                })
            }
        }
        powerData.modifiers = modifiers

        // Description (eventual goal is to largely match Hero Designer)
        // TODO: This should probably be moved to the sheets code
        // so when the power is modified in foundry, the power
        // description updates as well.
        // If in sheets code it may handle drains/suppresses nicely.
        switch (alias) {
            case "PRE":
                powerData.description = "+" + levels + " PRE";
                activeCost = 0;
                break;
            case "Mind Scan": powerData.description = levels + "d6 Mind Scan (" +
                input + " class of minds)";
                break;
            default:
                powerData.description = alias;

        }

        for (let modifier of powerData.modifiers) {
            if (modifier.alias) powerData.description += "; " + modifier.alias
            if (modifier.comments) powerData.description += "; " + modifier.comments
            if (modifier.option) powerData.description += "; " + modifier.option
            if (modifier.optionId) powerData.description += "; " + modifier.optionId
            if (modifier.optionAlias) powerData.description += "; " + modifier.optionAlias
        }

        powerData.rules = xmlid

        let type = ''
        let itemData = {}
        if (xmlid.toLowerCase() in CONFIG.HERO.movementPowers) {
            type = 'movement'

            const velocity = Math.round((spd * levels) / 12)

            powerData.max = levels
            powerData.value = levels
            powerData.velBase = velocity
            powerData.velValue = velocity


            itemData = {
                name: itemName,
                type,
                system: powerData,
                levels
            }



        } else {
            type = 'power'

            itemName = (itemName === '') ? 'unnamed' : itemName

            // TODO: END estimate is too simple for publishing.  
            // Want to minimize incorrect info.  Needs improvment.
            //powerData.end = math.round(activeCost/10);

            itemData = {
                name: itemName,
                type,
                system: powerData,
                levels,
                input
            }
        }

        let newPower = await HeroSystem6eItem.create(itemData, { parent: this.actor })

        // // ActiveEffect for Characteristics
        // if (configPowerInfo && configPowerInfo.powerType.includes("characteristic")) {
        //   console.log(newPower.system.rules)

        //   let activeEffect =
        //   {
        //     label: newPower.name + " (" + levels + ")",
        //     //id: newPower.system.rules,
        //     //icon: 'icons/svg/daze.svg',
        //     changes: [
        //       {
        //         key: "data.characteristics." + newPower.system.rules.toLowerCase() + ".value",
        //         value: parseInt(levels),
        //         mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE
        //       }
        //     ]
        //   }
        //   await this.actor.addActiveEffect(activeEffect)

        //}


    }

    for (const perk of perks.children) {
        await uploadBasic.call(this, perk, 'perk')
    }

    for (const talent of talents.children) {
        await uploadTalent.call(this, talent, 'talent')
    }

    for (const complication of complications.children) {
        await uploadBasic.call(this, complication, 'complication')
    }

    for (const equip of equipment.children) {
        await uploadBasic.call(this, equip, 'equipment')
    }

    // EXTRA DC's from martial arts
    let extraDc = 0
    const _extraDc = martialarts.getElementsByTagName('EXTRADC')[0]
    if (_extraDc) {
        extraDc = parseInt(_extraDc.getAttribute("LEVELS"))
    }

    // Possible TK martiarts (very rare with GM approval; requires BAREHAND weapon element with telekinesis/Psychokinesis in notes)
    let usesTk = false
    const _weaponElement = martialarts.getElementsByTagName('WEAPON_ELEMENT')[0]
    if (_weaponElement && $(_weaponElement).find('[XMLID="BAREHAND"]')[0] && $(powers).find('[XMLID="TELEKINESIS"]')[0]) {

        const notes = _weaponElement.getElementsByTagName("NOTES")[0] || ""
        if (notes.textContent.match(/kinesis/i)) {
            usesTk = true
        }
    }
    for (const martialart of martialarts.children) {
        await uploadMartial.call(this, martialart, 'martialart', extraDc, usesTk)
    }

    // combat maneuvers
    async function loadCombatManeuvers(dict, actor) {
        for (const entry of Object.entries(dict)) {
            const v = entry[1]
            const itemData = {
                name: entry[0],
                type: 'maneuver',
                data: {
                    phase: v[0],
                    ocv: v[1],
                    dcv: v[2],
                    effects: v[3],
                    active: false
                }
            }

            await HeroSystem6eItem.create(itemData, { parent: actor })
        }
    }

    await loadCombatManeuvers(CONFIG.HERO.combatManeuvers, this.actor)

    if (game.settings.get('hero6efoundryvttv2', 'optionalManeuvers')) {
        await loadCombatManeuvers(CONFIG.HERO.combatManeuversOptional, this.actor)
    }

    // ActiveEffects
    // TODO: Creating ActiveEffects initially on the Item should
    // allow easier implementation of power toggles and associated ActiveEffects.
    await this.actor.applyPowerEffects()



    // Actor Image
    if (image) {
        let filename = image.getAttribute("FileName")
        let extension = filename.split('.').pop()
        let base64 = "data:image/" + extension + ";base64," + image.textContent
        let path = "worlds/" + game.world.id
        if (this.actor.img.indexOf(filename) == -1) {
            await ImageHelper.uploadBase64(base64, filename, path)
            await this.actor.update({ [`img`]: path + '/' + filename })
        }
    }


    // Default Strike attack
    let itemData = {
        type: "attack",
        name: "strike",
        system: {
            //xmlid: "HANDTOHANDATTACK",
            knockbackMultiplier: 1,
            usesStrength: true,
            rules: "This is the basic attack maneuver"
        }

    }
    await HeroSystem6eItem.create(itemData, { parent: this.actor })




    ui.notifications.info(`${this.actor.name} upload complete`)

}


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

    // Marital Arts
    if (xml.getAttribute('BASECOST')) itemData['system.baseCost'] = xml.getAttribute('BASECOST')
    if (xml.getAttribute('OCV')) itemData['system.ocv'] = xml.getAttribute('OCV')
    if (xml.getAttribute('DCV')) itemData['system.dcv'] = xml.getAttribute('DCV')
    if (xml.getAttribute('DC')) itemData['system.dc'] = xml.getAttribute('DC')
    if (xml.getAttribute('PHASE')) itemData['system.phase'] = xml.getAttribute('PHASE')
    if (xml.getAttribute('ACTIVECOST')) itemData['system.activeCost'] = xml.getAttribute('ACTIVECOST')
    if (xml.getAttribute('DISPLAY')) itemData['system.description'] = xml.getAttribute('DISPLAY')
    if (xml.getAttribute('EFFECT')) itemData['system.effect'] = xml.getAttribute('EFFECT')

    await HeroSystem6eItem.create(itemData, { parent: this.actor })
}

export async function uploadMartial(power, type, extraDc, usesTk) {
    let name = power.getAttribute('NAME')
    name = (name === '') ? power.getAttribute('ALIAS') : name

    const xmlid = power.getAttribute('XMLID')

    if (xmlid === 'GENERIC_OBJECT') { return; }

    let itemData = {
        'type': type,
        'name': name,
        'system.id': xmlid,
        'system.rules': power.getAttribute('ALIAS')
    }

    // Marital Arts
    if (power.getAttribute('BASECOST')) itemData['system.baseCost'] = power.getAttribute('BASECOST')
    if (power.getAttribute('OCV')) itemData['system.ocv'] = parseInt(power.getAttribute('OCV'))
    if (power.getAttribute('DCV')) itemData['system.dcv'] = parseInt(power.getAttribute('DCV'))
    if (power.getAttribute('DC')) itemData['system.dc'] = parseInt(power.getAttribute('DC'))
    if (power.getAttribute('PHASE')) itemData['system.phase'] = power.getAttribute('PHASE')
    if (power.getAttribute('ACTIVECOST')) itemData['system.activeCost'] = power.getAttribute('ACTIVECOST')
    if (power.getAttribute('DISPLAY')) itemData['system.description'] = power.getAttribute('DISPLAY')
    if (power.getAttribute('EFFECT')) itemData['system.effect'] = power.getAttribute('EFFECT')

    await HeroSystem6eItem.create(itemData, { parent: this.actor })

    // Make attack out of the martial art
    itemData.type = 'attack'
    itemData.img = "icons/svg/downgrade.svg";

    // Strike like?
    if (itemData['system.effect']) {
        let dc = itemData['system.dc'] + extraDc
        if (itemData['system.effect'].match(/NORMALDC/)) {
            itemData['system.knockbackMultiplier'] = 1
            if (usesTk) {
                itemData['system.usesTk'] = true
            } else {
                itemData['system.usesStrength'] = true
            }
            itemData['system.dice'] = dc
        }

        if (itemData['system.effect'].match(/KILLINGDC/)) {
            let dice = Math.floor(dc / 3);
            let pips = dc - (dice * 3);
            let extraDice = 'zero'
            if (pips == 1) extraDice = 'pip'
            if (pips == 2) extraDice = 'half'
            itemData['system.knockbackMultiplier'] = 1
            if (usesTk) {
                itemData['system.usesTk'] = true
            } else {
                itemData['system.usesStrength'] = true
            }
            itemData['system.killing'] = true
            itemData['system.dice'] = dice
            itemData['system.extraDice'] = extraDice
        }
    }

    // If this isn't an attack where we roll dice, so ignore it for now
    if (!itemData['system.dice']) {
        return;
    }


    // Extra DC's is not an attack (ignore for now)
    if (xmlid === "EXTRADC") return;

    // WEAPON_ELEMENT is not an attack (ignore for now)
    if (xmlid === "WEAPON_ELEMENT") return;


    await HeroSystem6eItem.create(itemData, { parent: this.actor })
}

export async function uploadTalent(xml, type) {
    let name = xml.getAttribute('NAME')
    name = (name === '') ? xml.getAttribute('ALIAS') : name

    const xmlid = xml.getAttribute('XMLID')

    const levels = parseInt(xml.getAttribute('LEVELS'))

    if (xmlid === 'GENERIC_OBJECT') { return; }

    let other = {}

    switch (xmlid) {
        case ('LIGHTNING_REFLEXES_ALL'): {
            other = {
                'levels': levels,
                'option_alias': xml.getAttribute('OPTION_ALIAS')
            }
            break;
        }
        default: {
            break;
        }
    }

    let itemData = {
        'type': type,
        'name': name,
        'system.id': xmlid,
        'system.rules': xml.getAttribute('ALIAS'),
        'system.other': other
    }
    if (levels) {
        itemData['system.levels'] = levels;
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

    if (skill.hasAttribute("OPTION_ALIAS")) {
        skillData.optionAlias = skill.getAttribute('OPTION_ALIAS')
    }

    // determine Skill Roll
    // if (skillData.state === 'everyman') {
    //     skillData.roll = '8-'
    // } else if (skillData.state === 'familiar') {
    //     skillData.roll = '8-'
    // } else if (skillData.state === 'proficient') {
    //     skillData.roll = '10-'
    // } else if (skillData.state === 'trained') {
    //     const charValue = ((skillData.characteristic.toLowerCase() !== 'general') && (skillData.characteristic.toLowerCase() != '')) ?
    //         this.actor.system.characteristics[`${skillData.characteristic.toLowerCase()}`].value : 0

    //     const rollVal = 9 + Math.round(charValue / 5) + parseInt(skillData.levels)
    //     skillData.roll = rollVal.toString() + '-'
    // } else {
    //     // This is likely a Skill Enhancer.
    //     // Skill Enahncers provide a discount to the purchase of asssociated skills.
    //     // They no not change the roll.
    //     // Skip for now.
    //     HEROSYS.log(false, xmlid + ' was not included in skills.  Likely Skill Enhancer')
    //     return
    // }

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

    // Attempt to calculate atvantages
    //let advantages = 1;
    //for (let mod in powers.)

    // Active cost is required for endurance calculation.
    // It should include all advantages (which we don't handle very well at the moment)
    let activeCost = (levels * 5)
    let end = Math.round(activeCost / 10 - 0.01);

    let itemData = {
        name,
        type: "attack",
        system: {
            class: input === "ED" ? "energy" : "physical",
            dice: levels,
            end: end,
            extraDice: "zero",
            killing: false,
            knockbackMultiplier: 1,
            targets: "dcv",
            uses: "ocv",
            usesStrength: true,
            activeCost: activeCost,
        }
    }

    // Armor Piercing
    let ARMORPIERCING = power.querySelector('[XMLID="ARMORPIERCING"]')
    if (ARMORPIERCING) {
        itemData.system.piercing = parseInt(ARMORPIERCING.getAttribute("LEVELS"))
    }

    // Penetrating
    let PENETRATING = power.querySelector('[XMLID="PENETRATING"]')
    if (PENETRATING) {
        itemData.system.penetrating = parseInt(PENETRATING.getAttribute("LEVELS"))
    }

    // No Knockback
    let NOKB = power.querySelector('[XMLID="NOKB"]')
    if (NOKB) {
        itemData.system.knockbackMultiplier = 0
    }

    // Double Knockback
    let DOUBLEKB = power.querySelector('[XMLID="DOUBLEKB"]')
    if (DOUBLEKB) {
        itemData.system.knockbackMultiplier = 2
    }

    // Alternate Combat Value (uses OMCV against DCV)
    let ACV = power.querySelector('[XMLID="ACV"]')
    if (ACV) {
        if (ACV.getAttribute('OPTION_ALIAS') === "uses OMCV against DCV") {
            itemData.system.uses = 'omcv'
            itemData.system.targets = 'dcv'
        }
        if (ACV.getAttribute('OPTION_ALIAS') === "uses OCV against DMCV") {
            itemData.system.uses = 'ocv'
            itemData.system.targets = 'dmcv'
        }
        if (ACV.getAttribute('OPTION_ALIAS') === "uses OMCV against DCV") {
            itemData.system.uses = 'omcv'
            itemData.system.targets = 'dcv'
        }
    }


    if (power.querySelector('[XMLID="PLUSONEPIP"]')) {
        itemData.system.extraDice = "pip"
    }

    if (power.querySelector('[XMLID="PLUSONEHALFDIE"]')) {
        itemData.system.extraDice = "half"
    }

    if (power.querySelector('[XMLID="MINUSONEPIP"]')) {
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

    if (xmlid === "HANDTOHANDATTACK") {
        await HeroSystem6eItem.create(itemData, { parent: this.actor })
        return
    }

    if (xmlid === "HKA") {
        itemData.system.killing = true
        await HeroSystem6eItem.create(itemData, { parent: this.actor })
        return
    }


    if (xmlid === "TELEKINESIS") {
        // levels is the equivalent strength
        itemData.system.extraDice = "zero"
        itemData.system.dice = Math.floor(levels / 5)
        if (levels % 5 >= 3) itemData.system.extraDice = "half"
        itemData.name += " (TK strike)"
        itemData.system.usesStrength = false
        await HeroSystem6eItem.create(itemData, { parent: this.actor })
        return
    }

    if (xmlid === "ENERGYBLAST") {
        itemData.system.usesStrength = false
        await HeroSystem6eItem.create(itemData, { parent: this.actor })
        return
    }

    if (xmlid === "RKA") {
        itemData.system.killing = true
        itemData.system.usesStrength = false
        await HeroSystem6eItem.create(itemData, { parent: this.actor })
        return
    }


    if (game.settings.get(game.system.id, 'alphaTesting')) {
        ui.notifications.warn(`${xmlid} not implemented during HDC upload of ${this.actor.name}`)
    }
}

export function SkillRollUpdateValue(item) {
    let skillData = item.system
    if (skillData.state === 'everyman') {
        skillData.roll = '8-'
    } else if (skillData.state === 'familiar') {
        skillData.roll = '8-'
    } else if (skillData.state === 'proficient') {
        skillData.roll = '10-'
    } else if (skillData.state === 'trained') {
        const charValue = ((skillData.characteristic.toLowerCase() !== 'general') && (skillData.characteristic.toLowerCase() != '')) ?
            item.actor.system.characteristics[`${skillData.characteristic.toLowerCase()}`].value : 0

        const rollVal = 9 + Math.round(charValue / 5) + parseInt(skillData.levels)
        skillData.roll = rollVal.toString() + '-'
    } else {
        // This is likely a Skill Enhancer.
        // Skill Enahncers provide a discount to the purchase of asssociated skills.
        // They no not change the roll.
        // Skip for now.
        HEROSYS.log(false, (skillData.xmlid || item.name) + ' was not included in skills.  Likely Skill Enhancer')
        return
    }
}
