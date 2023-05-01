import { HEROSYS } from "../herosystem6e.js";

function determineDefense(targetActor, attackItem) {
    const attackType = attackItem.system.class
    const piericng = parseInt(attackItem.system.piercing)
    const penetrating = parseInt(attackItem.system.penetrating)



    let PD = parseInt(targetActor.system.characteristics.pd.value);
    let ED = parseInt(targetActor.system.characteristics.ed.value);
    let MD = 0;
    let rPD = 0; // resistant physical defense
    let rED = 0; // resistant energy defense
    let rMD = 0; // resistant mental defense
    let DRP = 0; // damage reduction physical
    let DRE = 0; // damage reduction energy
    let DRM = 0; // damage reduction mental
    let DNP = 0; // damage negation physical
    let DNE = 0; // damage negation energy
    let DNM = 0; // damage negation mental
    let knockbackResistance = 0;

    // Armor Piericng of natural PD and ED
    if (piericng)
    {
        PD = Math.round(PD/2)
        ED = Math.round(ED/2)
    }

    // Impenetrable (defense vs penetrating)
    let impenetrableValue = 0;



    // tags (defenses) will be displayed on apply damage card
    let defenseTags = []

    switch(attackType) {
        case 'physical':
            defenseTags.push({name: 'PD', value: PD, title:'Natural PD'})
            break;
        case 'energy':
            defenseTags.push({name: 'ED', value: PD, title:'Natural ED'})
            break;
        case 'mental':
            break;
    }


    if (targetActor.items.size > 0) {
        for (let i of targetActor.items) {
            if (i.type === "defense" && i.system.active) {
                let value = parseInt(i.system.value);
                let valueAp = value
                let valueImp = 0

                // Hardened
                const hardened = parseInt(i.system.hardened)

                // Armor Piercing
                if (piericng > hardened)
                {
                    valueAp = Math.round(valueAp/2)
                }

                // Impenetrable
                const impenetrable = parseInt(i.system.impenetrable)

                // Penetrating
                if (penetrating <= impenetrable)
                {
                    valueImp = valueAp
                    //console.log("Amor Piercing", i.name, value, valueAp)
                }


                switch ((i.system.resistant ? "r" : "") + i.system.defenseType) {
                    case "pd": // Physical Defense
                        PD += valueAp;
                        if (attackType === 'physical') 
                        {
                            defenseTags.push({name: 'PD', value: valueAp, title: i.name})
                            impenetrableValue += valueImp
                        }
                        break;
                    case "ed": // Energy Defense
                        ED += valueAp
                        if (attackType === 'energy') {
                            defenseTags.push({name: 'ED', value: valueAp, title: i.name})
                            impenetrableValue += valueImp
                        }
                        break;
                    case "md": // Mental Defense
                        MD += valueAp
                        if (attackType === 'mental') {
                            defenseTags.push({name: 'MD', value: valueAp, title: i.name})
                            impenetrableValue += valueImp
                        }
                        break;
                    case "rpd": // Resistant PD
                        rPD += valueAp
                        if (attackType === 'physical') {
                            defenseTags.push({name: 'rPD', value: valueAp, title: i.name})
                            impenetrableValue += valueImp
                        }
                        break;
                    case "red": // Resistant ED
                        rED += valueAp
                        if (attackType === 'energy') {
                            defenseTags.push({name: 'rED', value: valueAp, title: i.name})
                            impenetrableValue += valueImp
                        }
                        break;
                    case "rmd": // Resistant MD
                        rMD += valueAp
                        if (attackType === 'mental') {
                            defenseTags.push({name: 'rMD', value: valueAp, title: i.name})
                            impenetrableValue += valueImp
                        }
                        break;
                    case "drp": // Damage Reduction Physical
                        DRP = Math.max(DRP, value);
                        break;
                    case "dre": // Damage Reduction Energy
                        DRE = Math.max(DRE, value);
                        break;
                    case "drm": // Damage Reduction Mental
                        DRM = Math.max(DRM, value);
                        break;
                    case "dnp": // Damage Negation Physical
                        DNP += value
                        break;
                    case "dne": // Damage Negation Energy
                        DNE += value
                        break;
                    case "dnm": // Damage Negation Mental
                        DNM += value
                        break;
                    case "kbr": // Knockback Resistance
                        knockbackResistance += value;
                        if (attackType != 'mental' && game.settings.get("hero6efoundryvttv2", "knockback")) {
                            defenseTags.push({name: 'KB Resistance', value: value, title: i.name})
                        }
                        break;
                    default:
                        console.log(i.system.defenseType + " not yet supported!");
                        break;
                }
            }
            // if ((i.type === "power" || i.type === "equipment") && "items" in i.system && "defense" in i.system.subItems) {
            //     for (const [key, value] of Object.entries(i.system.subItems.defense)) {
            //         if (value.visible && value.active) {
            //             switch (value.defenseType) {
            //                 case "pd":
            //                     PD += parseInt(value.value);
            //                     break;
            //                 case "ed":
            //                     ED += parseInt(value.value);
            //                     break;
            //                 case "md":
            //                     MD += parseInt(value.value);
            //                     break;
            //                 case "rpd":
            //                     rPD += parseInt(value.value);
            //                     break;
            //                 case "red":
            //                     rED += parseInt(value.value);
            //                     break;
            //                 case "rmd":
            //                     rMD += parseInt(value.value);
            //                     break;
            //                 case "drp":
            //                     DRP = Math.max(DRP, parseInt(value.value));
            //                     break;
            //                 case "dre":
            //                     DRE = Math.max(DRE, parseInt(value.value));
            //                     break;
            //                 case "drm":
            //                     DRM = Math.max(DRM, parseInt(value.value));
            //                     break;
            //                 case "dnp":
            //                     DNP += parseInt(value.value);
            //                     break;
            //                 case "dne":
            //                     DNE += parseInt(value.value);
            //                     break;
            //                 case "dnm":
            //                     DNM += parseInt(value.value);
            //                     break;
            //                 case "kbr":
            //                     knockbackResistance += parseInt(value.value);
            //                     break;
            //                 default:
            //                     console.log(value.defenseType + " not yet supported!");
            //                     break;
            //             }
            //         }
            //     }
            // }
        }
    }

    let defenseValue = 0;
    let resistantValue = 0;
    let damageReductionValue = 0;
    let damageNegationValue = 0;
    switch(attackType) {
        case 'physical':
            defenseValue = PD;
            resistantValue = rPD;
            damageReductionValue = DRP;
            damageNegationValue = DNP;
            break;
        case 'energy':
            defenseValue = ED;
            resistantValue = rED;
            impenetrableValue = Math.max(ED, rED);
            damageReductionValue = DRE;
            damageNegationValue = DNE;
            break;
        case 'mental':
            defenseValue = MD;
            resistantValue = rMD;
            impenetrableValue = Math.max(MD, rMD);
            damageReductionValue = DRM;
            damageNegationValue = DNM;
            break;
    }

    return [ defenseValue, resistantValue, impenetrableValue, damageReductionValue, damageNegationValue, knockbackResistance, defenseTags ];
}

export { determineDefense };