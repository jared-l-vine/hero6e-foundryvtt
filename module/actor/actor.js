import { HeroSystem6eActorActiveEffects } from "./actor-active-effects.js"
import { HeroSystem6eItem } from '../item/item.js'

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class HeroSystem6eActor extends Actor {

    /** @inheritdoc */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        //TODO: Add user configuration for initial prototype settings

        console.log("_preCreate")
        let prototypeToken = {
            // Leaving sight disabled.
            // TODO: Implement various Enhanced Visions
            // sight: { enabled: true }, 
            // bar1: { attribute: "characteristics.body" },
            // bar2: { attribute: "characteristics.stun" },
            // bar3: { attribute: "characteristics.end" },
            displayBars: CONST.TOKEN_DISPLAY_MODES.HOVER,
            displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
            flags: {
                [game.system.id]: {
                    bar3: {
                        attribute: "characteristics.end"
                    }
                }
            }

        }

        if (this.type === "pc") {
            prototypeToken = {
                ...prototypeToken,
                actorLink: true,
                disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
                displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
                displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,

            };

        }

        this.updateSource({ prototypeToken });

        // Bar3 is a flag
        //await this.prototypeToken.setFlag(game.system.id, "bar3", { "attribute": "characteristics.end" })

    }

    // Adding ActiveEffects seems complicated.
    // Make sure only one of the same ActiveEffect is added
    // Assumes ActiveEffect is a statusEffects.
    // TODO: Allow for a non-statusEffects ActiveEffect (like from a power)
    async addActiveEffect(activeEffect) {

        const newEffect = deepClone(activeEffect)
        newEffect.label = `${game.i18n.localize(newEffect.label)}`

        // Check for standard StatusEffects
        // flags.core.statusId appears to be necessary to associate with StatusEffects
        if (activeEffect.id) {
            newEffect.flags = { core: { statusId: activeEffect.id } }

            // Check if this ActiveEffect already exists
            const existingEffect = this.effects.find(o => o.flags?.core?.statusId === activeEffect.id);
            if (existingEffect) {
                //console.log(activeEffect.id + " already exists")
                return
            }
        }

        await this.createEmbeddedDocuments("ActiveEffect", [newEffect])

    }

    // Create & Apply ActiveEffects based on item powers
    async applyPowerEffects() {

        //TODO: Alll the ActiveEffects will bubble up to UI
        // showing all deletes and create.
        // Would be nice if there was a {render:false} option.

        // Remove existing effects
        const ids = this.effects.map(o => o.id)
        await this.deleteEmbeddedDocuments("ActiveEffect", ids)

        for (const power of this.items.filter(o => o.type === 'power' || o.type === 'equipment')) {
            let configPowerInfo = CONFIG.HERO.powers[power.system.rules]

            // Characteristics (via ActiveEffects)
            if (configPowerInfo && (configPowerInfo?.powerType || "").includes("characteristic")) {

                const key = power.system.rules.toLowerCase()

                // Add LEVELS to MAX
                let activeEffect =
                {
                    label: power.name + " (" + power.system.LEVELS + ")",
                    //id: newPower.system.rules,
                    icon: 'icons/svg/upgrade.svg',
                    origin: power.uuid,
                    changes: [
                        {
                            key: "system.characteristics." + key + ".max",
                            value: parseInt(power.system.LEVELS),
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        }
                    ]
                }

                // Add AE to Item (which is not tranferered to actor)
                // await power.update({
                //     effects:
                //         [
                //             activeEffect
                //         ]
                // })

                // Add Active Effect to Actor (because it wasn't tranferred from item)
                await this.addActiveEffect(activeEffect)



                // TODO: Add ActiveEffect to item.
                // The probme is v10 doesn't allow you to createEmbeddedDocuments on items embedded in actor


                // Set VALUE to new MAX
                const max = this.system.characteristics[key].max
                let changes = []
                changes["system.characteristics." + key + '.value'] = max
                changes["system.active"] = true
                await this.update(changes)

            }

            if (power.system.rules === "DENSITYINCREASE") {
                const levels = parseInt(parseInt(power.system.LEVELS))

                const strAdd = Math.floor(levels) * 5
                const pdAdd = Math.floor(levels)
                const edAdd = Math.floor(levels)

                let activeEffect =
                {
                    label: power.name + " (" + power.system.LEVELS + ")",
                    //id: newPower.system.rules,
                    icon: 'icons/svg/upgrade.svg',
                    origin: power.uuid,
                    changes: [
                        {
                            key: "system.characteristics.str.max",
                            value: strAdd,
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        },
                        {
                            key: "system.characteristics.pd.max",
                            value: pdAdd,
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        },
                        {
                            key: "system.characteristics.ed.max",
                            value: edAdd,
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        }
                    ]
                }

                // Add Active Effect to Actor (because it wasn't tranferred from item)
                await this.addActiveEffect(activeEffect)

                // Set VALUE to new MAX
                let changes = []
                changes["system.characteristics.str.value"] = this.system.characteristics.str.max
                changes["system.characteristics.pd.value"] = this.system.characteristics.pd.max
                changes["system.characteristics.ed.value"] = this.system.characteristics.ed.max
                changes["system.active"] = true
                await this.update(changes)


            }

            if (power.system.rules === "GROWTH" && this.system.is5e) {
                const levels = parseInt(parseInt(power.system.LEVELS))

                const strAdd = Math.floor(levels) * 5
                const bodyAdd = Math.floor(levels)
                const stunAdd = Math.floor(levels)
                const dcvAdd = -2 * Math.floor(levels / 3)

                let activeEffect =
                {
                    label: power.name + " (" + power.system.LEVELS + ")",
                    //id: newPower.system.rules,
                    icon: 'icons/svg/upgrade.svg',
                    origin: power.uuid,
                    changes: [
                        {
                            key: "system.characteristics.str.max",
                            value: strAdd,
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        },
                        {
                            key: "system.characteristics.body.max",
                            value: bodyAdd,
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        },
                        {
                            key: "system.characteristics.stun.max",
                            value: stunAdd,
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        },
                        {
                            key: "system.characteristics.dcv.max",
                            value: dcvAdd,
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD
                        }
                    ]
                }

                // Add Active Effect to Actor (because it wasn't tranferred from item)
                await this.addActiveEffect(activeEffect)

                // Set VALUE to new MAX
                let changes = []
                changes["system.characteristics.str.value"] = this.system.characteristics.str.max
                changes["system.characteristics.body.value"] = this.system.characteristics.body.max
                changes["system.characteristics.stun.value"] = this.system.characteristics.stun.max
                changes["system.characteristics.dcv.value"] = this.system.characteristics.dcv.max
                changes["system.active"] = true
                await this.update(changes)


            }

            // Defenses (create new defense item)
            if (configPowerInfo && (configPowerInfo?.powerType || "").includes("defense")) {

                // Prepare the item object.
                const itemData = {
                    name: power.name,
                    type: 'defense',
                    system: {
                        rules: power.system.rules,
                        resistant: false
                    }
                }

                let hardened = parseInt(power.system.modifiers.find(o => o.xmlid === 'HARDENED')?.LEVELS)
                if (hardened) {
                    itemData.system.hardened = hardened
                }

                let impenetrable = parseInt(power.system.modifiers.find(o => o.xmlid === "IMPENETRABLE")?.LEVELS)
                if (impenetrable) {
                    itemData.system.impenetrable = impenetrable
                }

                let addedDefense = false

                for (let key of ['pd', 'ed', 'md']) {
                    let levels = parseInt(power.system[key.toUpperCase() + "LEVELS"])
                    if (levels) {
                        itemData.name = power.name + " (" + (configPowerInfo.name || power.system.rules) + ")"
                        itemData.system.value = levels
                        itemData.system.defenseType = key

                        // FORCEFIELD/Resistant Protection
                        if (power.system.rules == "FORCEFIELD") {
                            itemData.system.resistant = true
                        }


                        // Forcewall / barrier 
                        if (power.system.rules == "FORCEWALL") {
                            itemData.system.active = false
                            itemData.system.resistant = true
                        }
                        await HeroSystem6eItem.create(itemData, { parent: this })
                        addedDefense = true
                    }
                }

                if (power.system.rules == "FLASHDEFENSE" && !addedDefense) {
                    itemData.system.defenseType = 'fd'
                    itemData.name = power.name + " (" + (configPowerInfo.name || power.system.rules) + ")"
                    itemData.system.value = parseInt(power.system.LEVELS)
                    await HeroSystem6eItem.create(itemData, { parent: this })
                    addedDefense = true
                }

                if (power.system.rules == "MENTALDEFENSE" && !addedDefense) {
                    itemData.system.defenseType = 'md'
                    itemData.name = power.name + " (" + (configPowerInfo.name || power.system.rules) + ")"
                    itemData.system.value = parseInt(power.system.LEVELS)
                    await HeroSystem6eItem.create(itemData, { parent: this })
                    addedDefense = true
                }

                if (power.system.rules == "POWERDEFENSE" && !addedDefense) {
                    itemData.system.defenseType = 'powd'
                    itemData.name = power.name + " (" + (configPowerInfo.name || power.system.rules) + ")"
                    itemData.system.value = parseInt(power.system.LEVELS)
                    await HeroSystem6eItem.create(itemData, { parent: this })
                    addedDefense = true
                }

                // Damage negation PD/ED/MD values are strangely in the modifiers
                if (power.system.rules == "DAMAGENEGATION" && !addedDefense) {
                    itemData.name = power.name + " (" + (configPowerInfo.name || power.system.rules) + ")"
                    itemData.system.defenseType = 'dnp'
                    itemData.system.value = parseInt(power.system.modifiers.find(o => o.xmlid === 'PHYSICAL').LEVELS)
                    if (itemData.system.value > 0) {
                        await HeroSystem6eItem.create(itemData, { parent: this })
                    }

                    itemData.system.defenseType = 'dne'
                    itemData.system.value = parseInt(power.system.modifiers.find(o => o.xmlid === 'ENERGY').LEVELS)
                    if (itemData.system.value > 0) {
                        await HeroSystem6eItem.create(itemData, { parent: this })
                    }

                    itemData.system.defenseType = 'dnm'
                    itemData.system.value = parseInt(power.system.modifiers.find(o => o.xmlid === 'MENTAL').LEVELS)
                    if (itemData.system.value > 0) {
                        await HeroSystem6eItem.create(itemData, { parent: this })
                    }

                    addedDefense = true
                }

                //DAMAGEREDUCTION 
                if (power.system.rules == "DAMAGEREDUCTION" && !addedDefense) {
                    itemData.name = power.name// + " ("  + (configPowerInfo.name || power.system.rules) + ")"
                    itemData.system.value = 0
                    if (power.system.OPTIONID.indexOf("25") > -1) {
                        itemData.system.value = 25
                    }
                    if (power.system.OPTIONID.indexOf("50") > -1) {
                        itemData.system.value = 50
                    }
                    if (power.system.OPTIONID.indexOf("75") > -1) {
                        itemData.system.value = 75
                    }
                    if (power.system.OPTIONID.indexOf("RESISTANT") > -1) {
                        itemData.system.resistant = true
                    }
                    switch (power.system.INPUT) {
                        case "Physical":
                            itemData.system.defenseType = 'drp'
                            await HeroSystem6eItem.create(itemData, { parent: this })
                            addedDefense = true
                            break
                        case "Energy":
                            itemData.system.defenseType = 'dre'
                            await HeroSystem6eItem.create(itemData, { parent: this })
                            addedDefense = true
                            break
                        case "Mental":
                            itemData.system.defenseType = 'drm'
                            await HeroSystem6eItem.create(itemData, { parent: this })
                            addedDefense = true
                            break
                    }
                }

                //KBRESISTANCE  
                if (power.system.rules == "KBRESISTANCE" && !addedDefense) {
                    itemData.system.defenseType = 'kbr'
                    itemData.system.value = parseInt(power.system.LEVELS)
                    await HeroSystem6eItem.create(itemData, { parent: this })
                    addedDefense = true
                }

                //LACKOFWEAKNESS  
                if (power.system.rules == "LACKOFWEAKNESS" && !addedDefense) {
                    itemData.system.defenseType = 'low'
                    itemData.system.value = parseInt(power.system.LEVELS)
                    await HeroSystem6eItem.create(itemData, { parent: this })
                    addedDefense = true
                }


                if (!addedDefense) {
                    if (game.settings.get(game.system.id, 'alphaTesting')) {
                        ui.notifications.warn(`${power.system.rules} not implemented during defense item creation`)
                        console.log(power)
                    }
                }


            }
        }

        // Combat Luck (is a TALENT with defense effects)
        let combatLuck = this.items.find(o => o.system.id === "COMBAT_LUCK" || o.system.rules === "COMBAT_LUCK")
        if (combatLuck) {

            // Prepare the item object.
            const itemData = {
                name: combatLuck.name,
                type: 'defense',

                system: {
                    rules: combatLuck.system.rules,
                    resistant: true,
                    value: parseInt(combatLuck.system.levels * 3)
                }
            }
            itemData.system.defenseType = 'pd'
            await HeroSystem6eItem.create(itemData, { parent: this })
            itemData.system.defenseType = 'ed'
            await HeroSystem6eItem.create(itemData, { parent: this })
        }

    }


    /**
     * Augment the basic actor data with additional dynamic data.
     */
    // prepareData() {
    //     super.prepareData();

    //     console.log(this)
    //     const actorData = this.system;
    //     // const data = actorData.data;
    //     // const flags = actorData.flags;

    //     // Make separate methods for each Actor type (character, npc, etc.) to keep
    //     // things organized.
    //     //if (actorData.type === 'character') 
    //     // All actors get same basic data (for now)
    //     // Might change when/if vehicles/robots are significantly different
    //     this._prepareCharacterData(actorData);


    // }

    /**
     * Prepare Character type specific data
     */
    // _prepareCharacterData(actorData) {
    //     const data = actorData;

    //     // Make modifications to data here. For example:

    //     // Loop through characteristics, and add their rolls to our sheet output.
    //     for (let [key, characteristic] of Object.entries(data.characteristics)) {
    //         characteristic.roll = Math.round(9 + (characteristic.value / 5));
    //     }

    //     this._prepareResource(data.body, data.characteristics['body']);
    //     this._prepareResource(data.stun, data.characteristics['stun']);
    //     this._prepareResource(data.end, data.characteristics['end']);

    //     for (let [key, characteristic] of Object.entries(data.characteristics)) {
    //         this._prepareCharacteristic(characteristic);
    //     }
    // }

    // _prepareCharacteristic(characteristic) {
    //     if (characteristic.modifier) {
    //         characteristic.value *= characteristic.modifier;
    //     }

    //     characteristic.value = Math.round(characteristic.value);
    // }

    // _prepareResource(resource, characteristic) {
    //     resource.max = characteristic.value;
    // }

    /** @override */
    // applyActiveEffects() {
    //     // The Active Effects do not have access to their parent at preparation time so we wait until this stage to
    //     // determine whether they are suppressed or not.

    //     return super.applyActiveEffects()
    // }

    // _onUpdate(data, options, userId) {
    //     console.log(data)
    //     super._onUpdate(data, options, userId);
    // }

    // Migrate data before validating.
    // Largely handles actor template changes.
    // static migrateData(data) {

    //     // Actor type='character' is no longer in template.json.
    //     // change actor type to 'pc' or 'npc' based on disposition.
    //     if (data.type === 'character') {
    //         let token = data.prototypeToken || data.token
    //         if (token) {

    //             if (token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
    //                 data.type = "pc"
    //             }
    //             else {
    //                 data.type = "npc"
    //             }
    //         }
    //     }
    //     return super.migrateData(data);
    // }

}