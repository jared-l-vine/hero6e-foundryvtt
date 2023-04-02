import { HEROSYS } from "../herosystem6e.js";

function determineDefense(targetActor, attackType) {
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

    if (targetActor.items.size > 0) {
        for (let i of targetActor.items) {
            if (i.type === "defense" && i.system.active) {
                switch (i.system.defenseType) {
                    case "pd":
                        PD += parseInt(i.system.value);
                        break;
                    case "ed":
                        ED += parseInt(i.system.value);
                        break;
                    case "md":
                        MD += parseInt(i.system.value);
                        break;
                    case "rpd":
                        rPD += parseInt(i.system.value);
                        break;
                    case "red":
                        rED += parseInt(i.system.value);
                        break;
                    case "rmd":
                        rMD += parseInt(i.system.value);
                        break;
                    case "drp":
                        DRP = Math.max(DRP, parseInt(i.system.value));
                        break;
                    case "dre":
                        DRE = Math.max(DRE, parseInt(i.system.value));
                        break;
                    case "drm":
                        DRM = Math.max(DRM, parseInt(i.system.value));
                        break;
                    case "dnp":
                        DNP += parseInt(i.system.value);
                        break;
                    case "dne":
                        DNE += parseInt(i.system.value);
                        break;
                    case "dnm":
                        DNM += parseInt(i.system.value);
                        break;
                    case "kbr":
                        knockbackResistance += parseInt(i.system.value);
                        break;
                    default:
                        console.log(i.system.defenseType + " not yet supported!");
                        break;
                }
            }
            if ((i.type === "power" || i.type === "equipment") && "items" in i.system && "defense" in i.system.subItems) {
                for (const [key, value] of Object.entries(i.system.subItems.defense)) {
                    if (value.visible && value.active) {
                        switch (value.defenseType) {
                            case "pd":
                                PD += parseInt(value.value);
                                break;
                            case "ed":
                                ED += parseInt(value.value);
                                break;
                            case "md":
                                MD += parseInt(value.value);
                                break;
                            case "rpd":
                                rPD += parseInt(value.value);
                                break;
                            case "red":
                                rED += parseInt(value.value);
                                break;
                            case "rmd":
                                rMD += parseInt(value.value);
                                break;
                            case "drp":
                                DRP = Math.max(DRP, parseInt(value.value));
                                break;
                            case "dre":
                                DRE = Math.max(DRE, parseInt(value.value));
                                break;
                            case "drm":
                                DRM = Math.max(DRM, parseInt(value.value));
                                break;
                            case "dnp":
                                DNP += parseInt(value.value);
                                break;
                            case "dne":
                                DNE += parseInt(value.value);
                                break;
                            case "dnm":
                                DNM += parseInt(value.value);
                                break;
                            case "kbr":
                                knockbackResistance += parseInt(value.value);
                                break;
                            default:
                                console.log(value.defenseType + " not yet supported!");
                                break;
                        }
                    }
                }
            }
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
            damageReductionValue = DRE;
            damageNegationValue = DNE;
            break;
        case 'mental':
            defenseValue = MD;
            resistantValue = rMD;
            damageReductionValue = DRM;
            damageNegationValue = DNM;
            break;
    }

    return [ defenseValue, resistantValue, damageReductionValue, damageNegationValue, knockbackResistance ];
}

export { determineDefense };