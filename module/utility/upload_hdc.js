import { HEROSYS } from "../herosystem6e.js";
import { HeroSystem6eItem } from "../item/item.js";
import { RoundFavorPlayerDown } from "../utility/round.js"


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
    let changes = {}
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

    // 6e vs 5e
    let characteristicCosts = CONFIG.HERO.characteristicCosts
    if (this.actor.system.is5e) {
        characteristicCosts = CONFIG.HERO.characteristicCosts5e
    }

    // Caracteristics for 6e
    let characteristicKeys = Object.keys(characteristicCosts)


    // determine spd upfront for velocity calculations
    //let spd
    let value
    let characteristicDefaults = CONFIG.HERO.characteristicDefaults
    if (this.actor.system.is5e) {
        characteristicDefaults = CONFIG.HERO.characteristicDefaults5e
    }

    for (const characteristic of characteristics.children) {
        const key = CONFIG.HERO.characteristicsXMLKey[characteristic.getAttribute('XMLID')]
        const levels = parseInt(characteristic.getAttribute('LEVELS'))
        value = characteristicDefaults[key] + levels


        if (key === "running" && this.actor.system.is5e) {
            console.log(key)
        }

        if (key === "leaping" && this.actor.system.is5e) {
            const str = parseInt(changes[`system.characteristics.str.core`])
            if (str >= 3) value = 0.5
            if (str >= 5) value = 1
            if (str >= 8) value = 1.5
            if (str >= 10) value = 2
            if (str >= 13) value = 2.5
            if (str >= 15) value = 3
            if (str >= 18) value = 3.5
            if (str >= 20) value = 4
            if (str >= 23) value = 4.5
            if (str >= 25) value = 5
            if (str >= 28) value = 5.5
            if (str >= 30) value = 6
            if (str >= 35) value = 7
            if (str >= 40) value = 8
            if (str >= 45) value = 9
            if (str >= 50) value = 10
            if (str >= 55) value = 11
            if (str >= 60) value = 12
            if (str >= 65) value = 13
            if (str >= 70) value = 14
            if (str >= 75) value = 15
            if (str >= 80) value = 16
            if (str >= 85) value = 17
            if (str >= 90) value = 18
            if (str >= 95) value = 19
            if (str >= 100) value = 20 + Math.floor((str - 100) / 5)
            changes[`system.characteristics.leaping.base`] = value
            value += parseInt(characteristic.getAttribute('LEVELS'))

        }

        changes[`system.characteristics.${key}.value`] = value
        changes[`system.characteristics.${key}.max`] = value
        changes[`system.characteristics.${key}.core`] = value
        let cost = Math.round(levels * characteristicCosts[key])
        changes[`system.characteristics.${key}.basePointsPlusAdders`] = cost
        changes[`system.characteristics.${key}.realCost`] = cost
        changes[`system.characteristics.${key}.activePoints`] = cost

        if (key in CONFIG.HERO.movementPowers) {
            let name = characteristic.getAttribute('NAME')
            name = (name === '') ? characteristic.getAttribute('ALIAS') : name
            //const velocity = Math.round((spd * value) / 12)
            const itemData = {
                name: name,
                type: 'movement',
                system: {
                    type: key,
                    editable: false,
                    base: value,
                    value,
                    //velBase: velocity,
                    //velValue: velocity,
                    class: key,
                }
            }

            await HeroSystem6eItem.create(itemData, { parent: this.actor })
        }
    }

    await this.actor.update(changes)
    changes = {}

    // Initial 5e support
    // 5th edition has no edition designator, so assuming if there is no 6E then it is 5E.
    if (characterTemplate.includes("builtIn.") && !characterTemplate.includes("6E.")) {
        const figuredChanges = {}
        figuredChanges[`system.is5e`] = true  // used in item-attack.js to modify killing attack stun multiplier

        // One major difference between 5E and 6E is figured characteristics.

        // Physical Defense (PD) STR/5
        const pdLevels = this.actor.system.characteristics.pd.max - CONFIG.HERO.characteristicDefaults5e.pd;
        const pdFigured = Math.round(this.actor.system.characteristics.str.max / 5)
        figuredChanges[`system.characteristics.pd.max`] = pdLevels + pdFigured
        figuredChanges[`system.characteristics.pd.value`] = pdLevels + pdFigured
        figuredChanges[`system.characteristics.pd.base`] = pdFigured //this.actor.system.characteristics.pd.base + pdFigured
        figuredChanges[`system.characteristics.pd.core`] = pdLevels + pdFigured
        figuredChanges[`system.characteristics.pd.figured`] = pdFigured

        // Energy Defense (ED) CON/5
        const edLevels = this.actor.system.characteristics.ed.max - CONFIG.HERO.characteristicDefaults5e.ed;
        const edFigured = Math.round(this.actor.system.characteristics.con.max / 5)
        figuredChanges[`system.characteristics.ed.max`] = edLevels + edFigured
        figuredChanges[`system.characteristics.ed.value`] = edLevels + edFigured
        figuredChanges[`system.characteristics.ed.base`] = edFigured //this.actor.system.characteristics.ed.base + edFigured
        figuredChanges[`system.characteristics.ed.core`] = edLevels + edFigured
        figuredChanges[`system.characteristics.ed.figured`] = edFigured


        // Speed (SPD) 1 + (DEX/10)   can be fractional
        const spdLevels = this.actor.system.characteristics.spd.max - CONFIG.HERO.characteristicDefaults5e.spd;
        const spdFigured = 1 + parseFloat(parseFloat(this.actor.system.characteristics.dex.max / 10).toFixed(1))
        figuredChanges[`system.characteristics.spd.max`] = Math.floor(spdLevels + spdFigured)
        figuredChanges[`system.characteristics.spd.value`] = Math.floor(spdLevels + spdFigured)
        figuredChanges[`system.characteristics.spd.base`] = spdFigured //this.actor.system.characteristics.spd.base + spdFigured
        figuredChanges[`system.characteristics.spd.core`] = Math.floor(spdLevels + spdFigured)
        figuredChanges[`system.characteristics.spd.figured`] = spdFigured
        figuredChanges[`system.characteristics.spd.realCost`] = (spdFigured - spdLevels) * CONFIG.HERO.characteristicCosts5e.spd


        // Recovery (REC) (STR/5) + (CON/5)
        const recLevels = this.actor.system.characteristics.rec.max - CONFIG.HERO.characteristicDefaults5e.rec;
        const recFigured = Math.round(this.actor.system.characteristics.str.max / 5) + Math.round(this.actor.system.characteristics.con.max / 5)
        figuredChanges[`system.characteristics.rec.max`] = recLevels + recFigured
        figuredChanges[`system.characteristics.rec.value`] = recLevels + recFigured
        figuredChanges[`system.characteristics.rec.base`] = recFigured //this.actor.system.characteristics.rec.base + recFigured
        figuredChanges[`system.characteristics.rec.core`] = recLevels + recFigured
        figuredChanges[`system.characteristics.rec.figured`] = recFigured
        figuredChanges[`system.characteristics.red.realCost`] = recLevels * CONFIG.HERO.characteristicCosts5e.red

        // Endurance (END) 2 x CON
        const endLevels = this.actor.system.characteristics.end.max - CONFIG.HERO.characteristicDefaults5e.end;
        const endFigured = Math.round(this.actor.system.characteristics.con.max * 2)
        figuredChanges[`system.characteristics.end.max`] = endLevels + endFigured
        figuredChanges[`system.characteristics.end.value`] = endLevels + endFigured
        figuredChanges[`system.characteristics.end.base`] = endFigured //this.actor.system.characteristics.end.base + endFigured
        figuredChanges[`system.characteristics.end.core`] = endLevels + endFigured
        figuredChanges[`system.characteristics.end.figured`] = endFigured


        // Stun (STUN) BODY+(STR/2)+(CON/2) 
        const stunLevels = this.actor.system.characteristics.stun.max - CONFIG.HERO.characteristicDefaults5e.stun;
        const stunFigured = this.actor.system.characteristics.body.max + Math.round(this.actor.system.characteristics.str.max / 2) + Math.round(this.actor.system.characteristics.con.max / 2)
        figuredChanges[`system.characteristics.stun.max`] = stunLevels + stunFigured
        figuredChanges[`system.characteristics.stun.value`] = stunLevels + stunFigured
        figuredChanges[`system.characteristics.stun.base`] = stunFigured //this.actor.system.characteristics.stun.base + stunFigured
        figuredChanges[`system.characteristics.stun.core`] = stunLevels + stunFigured
        figuredChanges[`system.characteristics.stun.figured`] = stunFigured
        figuredChanges[`system.characteristics.stun.realCost`] = stunLevels * CONFIG.HERO.characteristicCosts5e.stun


        // Base OCV & DCV = Attacker’s DEX/3
        const baseCv = Math.round(this.actor.system.characteristics.dex.max / 3)
        figuredChanges[`system.characteristics.ocv.max`] = baseCv // + this.actor.system.characteristics.ocv.max - this.actor.system.characteristics.ocv.base
        figuredChanges[`system.characteristics.ocv.value`] = baseCv // + this.actor.system.characteristics.ocv.max - this.actor.system.characteristics.ocv.base
        figuredChanges[`system.characteristics.ocv.base`] = 0 //baseCv + this.actor.system.characteristics.ocv.max - this.actor.system.characteristics.ocv.base
        figuredChanges[`system.characteristics.dcv.max`] = baseCv // + this.actor.system.characteristics.dcv.max - this.actor.system.characteristics.dcv.base
        figuredChanges[`system.characteristics.dcv.value`] = baseCv //+ this.actor.system.characteristics.dcv.max - this.actor.system.characteristics.dcv.base
        figuredChanges[`system.characteristics.dcv.base`] = 0 //baseCv + this.actor.system.characteristics.dcv.max - this.actor.system.characteristics.dcv.base
        figuredChanges[`system.characteristics.ocv.realCost`] = 0
        figuredChanges[`system.characteristics.dcv.realCost`] = 0

        //Base Ego Combat Value = EGO/3
        const baseEcv = Math.round(this.actor.system.characteristics.ego.max / 3)
        figuredChanges[`system.characteristics.omcv.max`] = baseEcv //+ this.actor.system.characteristics.omcv.max - this.actor.system.characteristics.omcv.base
        figuredChanges[`system.characteristics.omcv.value`] = baseEcv //+ this.actor.system.characteristics.omcv.max - this.actor.system.characteristics.omcv.base
        figuredChanges[`system.characteristics.omcv.base`] = 0 //baseEcv + this.actor.system.characteristics.omcv.max - this.actor.system.characteristics.omcv.base
        figuredChanges[`system.characteristics.dmcv.max`] = baseEcv //+ this.actor.system.characteristics.dmcv.max - this.actor.system.characteristics.dmcv.base
        figuredChanges[`system.characteristics.dmcv.value`] = baseEcv //+ this.actor.system.characteristics.dmcv.max - this.actor.system.characteristics.dmcv.base
        figuredChanges[`system.characteristics.dmcv.base`] = 0 //baseEcv + this.actor.system.characteristics.dmcv.max - this.actor.system.characteristics.dmcv.base
        figuredChanges[`system.characteristics.omcv.realCost`] = 0
        figuredChanges[`system.characteristics.dmcv.realCost`] = 0

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


    for (const power of powers.children) {
        await uploadPower.call(this, power, 'power')
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
        await uploadPower.call(this, equip, 'equipment')
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

    // Calculate realCost & Active Points for bought as characteristics
    let realCost = 0;
    let activePoints = 0;
    if (this.actor.system.is5e) {
        for (const key of Object.keys(CONFIG.HERO.characteristicCosts5e)) {
            realCost += parseInt(this.actor.system.characteristics[key].realCost || 0);
        }
    } else {
        for (const key of Object.keys(CONFIG.HERO.characteristicCosts)) {
            realCost += parseInt(this.actor.system.characteristics[key].realCost || 0);
        }
    }
    activePoints = realCost
    // Add in costs for items
    for (let item of this.actor.items.filter(o => o.type != 'attack' && o.type != 'defense' && o.type != 'movement' && !o.system.duplicate)) {
        console.log(item.type, item.name, item.system.realCost)

        // Equipment is typically purchased with money, not character points
        if (item.type != 'equipment') {
            realCost += parseInt(item.system.realCost || 0);
        }
        activePoints += parseInt(item.system.activePoints || 0);
    }
    await this.actor.update({ 'system.points': realCost, 'system.activePoints': activePoints })

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
        'system.rules': xmlid,
        'system.name': xml.getAttribute('ALIAS') || xmlid,
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

    const configPowerInfo = CONFIG.HERO.powers[xmlid]
    if (configPowerInfo && configPowerInfo.name && !itemData['system.description']) {
        itemData['system.description'] = configPowerInfo.name
    }
    if (!itemData['system.description']) {
        itemData['system.description'] = xmlid
    }

    await HeroSystem6eItem.create(itemData, { parent: this.actor })

    // Detect attacks
    if (configPowerInfo && configPowerInfo.powerType.includes("attack")) {
        await uploadAttack.call(this, xml);
    }
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

export async function uploadSkill(skill, duplicate) {
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
        xmlid: xmlid,
        baseCost: skill.getAttribute('BASECOST'),
        levels: skill.getAttribute('LEVELS'),
        state: 'trained',
        option: skill.getAttribute('OPTION'),
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

    skillData.everyman = skill.getAttribute('EVERYMAN')

    skillData.adders = []

    for (let adder of skill.getElementsByTagName("ADDER")) {
        skillData.adders.push({
            xmlid: adder.getAttribute('XMLID'),
            alias: adder.getAttribute('ALIAS'),
            comments: adder.getAttribute('ALIAS'),
            option: adder.getAttribute('OPTION'),
            optionId: adder.getAttribute('OPTIONID'),
            optionAlias: adder.getAttribute('OPTION_ALIAS'),
            levels: adder.getAttribute('LEVELS'),
            baseCost: parseFloat(adder.getAttribute('BASECOST')),
        })
    }

    // Real Cost and Active Points
    let _basePointsPlusAdders = calcBasePointsPlusAdders(skillData)
    let _activePoints = calcActivePoints(_basePointsPlusAdders, skillData)
    let _realCost = calcRealCost(_activePoints, skillData)
    skillData.basePointsPlusAdders = _basePointsPlusAdders
    skillData.activePoints = _activePoints
    skillData.realCost = _realCost
    if (duplicate) {
        skillData.duplicate = true
    }

    const itemData = {
        name,
        type: 'skill',
        system: skillData,
    }

    await HeroSystem6eItem.create(itemData, { parent: this.actor })

}

function calcBasePointsPlusAdders(system) {
    const xmlid = system.rules || system.xmlid //xmlItem.getAttribute('XMLID')
    const basePoints = parseFloat(system.baseCost|| system.BASECOST) //parseInt(xmlItem.getAttribute('BASECOST'))
    const levels = parseFloat(system.levels || system.LEVELS) //parseInt(xmlItem.getAttribute('LEVELS'))
    const adders = system.adders || [] //xmlItem.getElementsByTagName("ADDER")

    // Everyman skills are free
    if (system.everyman == "Yes") {
        return 0
    }

    if (xmlid == "MENTAL_COMBAT_LEVELS")
        console.log(xmlid)


    // Categorized Skills typically cost 2 CP per category,
    // 1 CP per subcategory, and +1 to the roll per +2 CP. The
    // Skills most commonly exploded in this manner include
    // Animal Handler, Forgery, Gambling,

    let cost = 0
    for (let adder of adders) {

        // Some skills have subgroups like TRANSPORT_FAMILIARITY, we will ignore the top level
        // const subAdders = adder.getElementsByTagName("ADDER")
        // if (subAdders.length) {
        //     continue;
        // }

        const adderBaseCost = parseInt(adder.baseCost || adder.BASECOST) //parseInt(adder.getAttribute("BASECOST") || 0)
        if (cost >= 2 && adderBaseCost == 2) {
            cost += 1
        }
        else {
            cost += adderBaseCost
        }
    }

    // Some skills have default cost of 3; should really be picking specifics
    if (["ANIMAL_HANDLER", "FORGERY", "GAMBLING", "NAVIGATION", "SURVIVAL", "WEAPONSMITH"].includes(xmlid) && cost == 0) {
        return 3
    }

    // Some skill have a default cost of 3; Transport Familiarity
    if (["TRANSPORT_FAMILIARITY"].includes(xmlid) && cost == 0) {
        return 1
    }


    // Rebrand?
    let _xmlid = CONFIG.HERO.powersRebrand[xmlid] || xmlid;

    // Check if we have CONFIG info about this power
    let configPowerInfo = CONFIG.HERO.powers[_xmlid]

    // Levels
    // TODO: List each skill in config.js and include cost per level
    let costPerLevel = 2
    if (configPowerInfo && configPowerInfo.powerType.includes("skill")) {
        if (["KNOWLEDGE_SKILL"].includes(xmlid)) {
            costPerLevel = 1
        }

        if (["MENTAL_COMBAT_LEVELS", "PENALTY_SKILL_LEVELS"].includes(xmlid)) {
            switch (system.option) {
                case "SINGLE": costPerLevel = 1; break;
                case "TIGHT": costPerLevel = 3; break;
                case "BROAD": costPerLevel = 6; break;
            }
        }

        if (xmlid == "SKILL_LEVELS") {
            switch (system.option) {
                case "CHARACTERISTIC": costPerLevel = 2; break;
                case "RELATED": costPerLevel = 3; break;
                case "GROUP": costPerLevel = 4; break;
                case "AGILITY": costPerLevel = 6; break;
                case "NONCOMBAT": costPerLevel = 10; break;
                case "SINGLEMOVEMENT": costPerLevel = 2; break;
                case "ALLMOVEMENT": costPerLevel = 3; break;
                case "OVERALL": costPerLevel = 12; break;
            }
        }

        cost += parseInt(levels) * costPerLevel;

    } else {
        let _xmlid = CONFIG.HERO.powersRebrand[xmlid] || xmlid
        let costPerLevel = parseFloat(CONFIG.HERO.powers[_xmlid]?.cost || CONFIG.HERO.characteristicCosts[_xmlid.toLocaleLowerCase()] || 5)
        let _cost = parseInt(levels) * costPerLevel
        // Costs 3 points for every 2 levels, you can't purchase half a level
        if (costPerLevel == 3 / 2 && _cost % 1 > 0) {
            _cost = Math.floor(_cost + 2)
        }
        cost += Math.ceil(_cost)
    }

    // CUSTOMSKILL has minimum cost of 1
    if (xmlid == "CUSTOMSKILL" && cost == 0) {
        return 1
    }

    return basePoints + cost
}

function calcActivePoints(_basePointsPlusAdders, system) {
    // Active Points = (Base Points + cost of any Adders) x (1 + total value of all Advantages)

    const xmlid = system.rules || system.xmlid //xmlItem.getAttribute('XMLID')
    const modifiers = system.modifiers || system.MODIFIER || [] //xmlItem.getElementsByTagName("ADDER")


    let advantages = 0
    for (let modifier of modifiers) {
        const modifierBaseCost = parseFloat(modifier.baseCost || 0)
        if (modifierBaseCost > 0) {
            advantages += modifierBaseCost;
        }

        // Some modifiers may have ADDERS
        const adders = modifier.adders //modifier.getElementsByTagName("ADDER")
        if (adders.length) {
            for (let adder of adders) {
                const adderBaseCost = parseFloat(modifier.baseCost || 0)
                if (adderBaseCost > 0) {
                    advantages += adderBaseCost;
                }
            }
        }
    }

    const _activePoints = _basePointsPlusAdders * (1 + advantages)

    return RoundFavorPlayerDown(_activePoints)
}

function calcRealCost(_activeCost, system) {
    // Real Cost = Active Cost / (1 + total value of all Limitations)
    const xmlid = system.rules || system.xmlid //xmlItem.getAttribute('XMLID')
    const levels = parseFloat(system.levels || system.LEVELS) //parseInt(xmlItem.getAttribute('LEVELS'))
    const modifiers = system.modifiers || [] //xmlItem.getElementsByTagName("ADDER")

    if (xmlid == "DAMAGEREDUCTION")
        console.log(xmlid)

    let limitations = 0
    for (let modifier of modifiers) {
        const modifierBaseCost = parseFloat(modifier.baseCost || 0)
        if (modifierBaseCost < 0) {
            limitations += -modifierBaseCost;
        }

        // Some modifiers may have ADDERS as well (like a focus)
        const adders = modifier.adders
        if (adders.length) {
            for (let adder of adders) {
                const adderBaseCost = parseFloat(modifier.baseCost || 0)
                if (adderBaseCost < 0) {
                    limitations += -adderBaseCost;
                }
            }
        }
    }

    const _realCost = _activeCost / (1 + limitations)

    // ToDo: I thik there is a minimum of 1 here, but Everyday skills are 0, so not quite sure what to do yet.
    return RoundFavorPlayerDown(_realCost)
}

export async function uploadPower(power, type) {
    let xmlid = power.getAttribute('XMLID')
    const name = power.getAttribute('NAME')
    const alias = power.getAttribute('ALIAS')
    const levels = power.getAttribute('LEVELS')
    const input = power.getAttribute('INPUT')
    const optionAlias = power.getAttribute("OPTION_ALIAS")

    const relevantFields = ['BASECOST', 'LEVELS', 'ALIAS', 'MULTIPLIER', 'NAME', 'OPTION_ALIAS', 'SFX',
        'PDLEVELS', 'EDLEVELS', 'MDLEVELS', 'INPUT', 'OPTIONID', 'BASECOST' // FORCEFIELD
    ]
    if (xmlid === 'GENERIC_OBJECT') return;

    // Rebrand?
    xmlid = CONFIG.HERO.powersRebrand[xmlid] || xmlid;

    // Check if we have CONFIG info about this power
    let configPowerInfo = CONFIG.HERO.powers[xmlid]
    if (configPowerInfo) {

        if ((configPowerInfo?.powerType || "").includes("skill")) {
            await uploadSkill.call(this, power, true);
        }

        // Detect attacks
        //let configPowerInfo = CONFIG.HERO.powers[power.system.rules]
        if (configPowerInfo.powerType.includes("attack")) {
            await uploadAttack.call(this, power, true);
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

    powerData.rules = xmlid

    for (const attribute of power.attributes) {
        const attName = attribute.name

        if (relevantFields.includes(attName)) {
            const attValue = attribute.value

            powerData[attName] = attValue
        }
    }

    const modifiers = []
    for (const modifier of power.children) {
        const xmlidModifier = modifier.getAttribute('XMLID')

        if (xmlidModifier !== null) {
            let _mod = {
                xmlid: xmlidModifier,
                alias: modifier.getAttribute('ALIAS'),
                comments: modifier.getAttribute('ALIAS'),
                option: modifier.getAttribute('OPTION'),
                optionId: modifier.getAttribute('OPTIONID'),
                optionAlias: modifier.getAttribute('OPTION_ALIAS'),
                levels: modifier.getAttribute('LEVELS'),
                baseCost: parseFloat(modifier.getAttribute('BASECOST')),
                adders: [],
            }

            // Not sure why DIFFICULTTODISPEL baseCost is 0
            if (xmlidModifier == 'DIFFICULTTODISPEL') {
                _mod.baseCost = parseInt(_mod.levels) * 0.25
                _mod.optionAlias = "x" + (parseInt(_mod.levels) + 1) + " Active Cost"
            }

            if (xmlidModifier == "IMPENETRABLE") {
                _mod.baseCost = parseInt(_mod.levels) * 0.25
                _mod.optionAlias = "x" + parseInt(_mod.levels)
            }

            for (let adder of modifier.getElementsByTagName("ADDER")) {
                _mod.adders.push({
                    xmlid: adder.getAttribute('XMLID'),
                    alias: adder.getAttribute('ALIAS'),
                    comments: adder.getAttribute('ALIAS'),
                    option: adder.getAttribute('OPTION'),
                    optionId: adder.getAttribute('OPTIONID'),
                    optionAlias: adder.getAttribute('OPTION_ALIAS'),
                    levels: adder.getAttribute('LEVELS'),
                    baseCost: parseFloat(adder.getAttribute('BASECOST')),
                })
            }
            modifiers.push(_mod)
        }
    }
    powerData.modifiers = modifiers

    // Real Cost and Active Points
    let _basePointsPlusAdders = calcBasePointsPlusAdders(powerData)
    let _activePoints = calcActivePoints(_basePointsPlusAdders, powerData)
    let _realCost = calcRealCost(_activePoints, powerData)
    powerData.basePointsPlusAdders = _basePointsPlusAdders
    powerData.activePoints = _activePoints
    powerData.realCost = _realCost

    // Description (eventual goal is to largely match Hero Designer)
    // TODO: This should probably be moved to the sheets code
    // so when the power is modified in foundry, the power
    // description updates as well.
    // If in sheets code it may handle drains/suppresses nicely.
    switch (xmlid) {
        // case "PRE":
        //     powerData.description = "+" + levels + " PRE";
        //     //activeCost = 0;
        //     break;
        case "Mind Scan": powerData.description = levels + "d6 Mind Scan (" +
            input + " class of minds)";
            break;
        // case "DAMAGEREDUCTION":
        //     powerData.description = input + " " + optionAlias
        //     break;
        case "FORCEFIELD": powerData.description = alias + " ("
            let ary = []
            if (parseInt(powerData.PDLEVELS)) ary.push(powerData.PDLEVELS + " PD")
            if (parseInt(powerData.EDLEVELS)) ary.push(powerData.EDLEVELS + " ED")
            if (parseInt(powerData.MDLEVELS)) ary.push(powerData.MDLEVELS + " MD")
            powerData.description += ary.join("/") + ")"
            break;
        default:
            if (configPowerInfo && configPowerInfo.powerType.includes("characteristic")) {
                powerData.description = "+" + levels + " " + alias;
                break;
            }
            powerData.description = (input ? input + " " : "") + (optionAlias || alias)

        //powerData.description = xmlid;

    }

    // Active Points
    if (power.getAttribute('SHOW_ACTIVE_COST') == "Yes") {
        powerData.description += " (" + powerData.activePoints + " Active Points)"
    }

    // Advantages sorted low to high
    for (let modifier of powerData.modifiers.filter(o => o.baseCost >= 0).sort((a, b) => { return a.baseCost - b.baseCost })) {
        powerData.description += createPowerDescriptionPartial(modifier, name)
    }

    // Disadvantages sorted low to high
    for (let modifier of powerData.modifiers.filter(o => o.baseCost < 0).sort((a, b) => { return a.baseCost - b.baseCost })) {
        powerData.description += createPowerDescriptionPartial(modifier, name)
    }



    let itemData = {}
    if (xmlid.toLowerCase() in CONFIG.HERO.movementPowers) {
        type = 'movement'

        // const velocity = Math.round((spd * levels) / 12)

        // powerData.max = levels
        // powerData.value = levels
        // powerData.velBase = velocity
        // powerData.velValue = velocity


        itemData = {
            name: itemName,
            type,
            system: powerData,
            levels
        }



    } else {

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
}

function createPowerDescriptionPartial(modifier, powerName) {



    let result = ""
    if (modifier.alias) result += "; " + modifier.alias || "?"
    // if (modifier.comments) powerData.description += "; " + modifier.comments
    // if (modifier.option) powerData.description += "; " + modifier.option
    // if (modifier.optionId) powerData.description += "; " + modifier.optionId

    result += " ("
    if (modifier.optionAlias && !["VISIBLE"].includes(modifier.xmlid)) result += modifier.optionAlias + ", "

    let fraction = ""

    if (modifier.baseCost == 0) {
        fraction += "?"
        if (game.settings.get(game.system.id, 'alphaTesting')) {
            ui.notifications.warn(`${powerName} has an unhandeled modifier (${modifier.xmlid})`)
        }
    }

    if (modifier.baseCost > 0) {
        fraction += "+"
    }
    let wholeNumber = Math.trunc(modifier.baseCost)

    if (wholeNumber != 0) {
        fraction += wholeNumber + " "
    }
    else if (modifier.baseCost < 0) {
        fraction += "-"
    }
    switch (Math.abs(modifier.baseCost % 1)) {
        case 0: break;
        case 0.25: fraction += "1/4"; break;
        case 0.5: fraction += "1/2"; break;
        case 0.75: fraction += "3/4"; break;
        default: fraction += modifier.baseCost % 1;
    }
    result += fraction.trim() + ")"
    return result;
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

    // Attempt to calculate avantages
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
