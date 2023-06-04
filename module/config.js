export const HERO = {};

HERO.bool = {
    "true": "True",
    "false": "False",
};

HERO.extraDice = {
    "zero": "+0",
    "pip": "+1",
    "half": "+1/2D6",
};

HERO.attacksWith = {
    "ocv": "OCV",
    "omcv": "OMCV",
};

HERO.defendsWith = {
    "dcv": "DCV",
    "dmcv": "DMCV",
};

HERO.defenseTypes = {
    "pd": "Physical Defense",
    "ed": "Energy Defense",
    "md": "Mental Defense",
    "rpd": "Resistant PD",
    "red": "Resistant ED",
    "rmd": "Resistant MD",
    "drp": "Damage Reduction Physical",
    "dre": "Damage Reduction Energy",
    "drm": "Damage Reduction Mental",
    "dnp": "Damage Negation Physical",
    "dne": "Damage Negation Energy",
    "dnm": "Damage Negation Mental",
    "powd": "Power Defense",
    "kbr": "Knockback Resistance",
    "fd": "Flash Defense",
    "br": "Barrier",
    "df": "Deflection"
};

HERO.defenseTypes5e = {
    "pd": "Physical Defense",
    "ed": "Energy Defense",
    "md": "Mental Defense",
    "rpd": "Resistant PD",
    "red": "Resistant ED",
    "rmd": "Resistant MD",
    "drp": "Damage Reduction Physical",
    "dre": "Damage Reduction Energy",
    "drm": "Damage Reduction Mental",
    "dnp": "Damage Negation Physical",
    "dne": "Damage Negation Energy",
    "dnm": "Damage Negation Mental",
    "powd": "Power Defense",
    "kbr": "Knockback Resistance",
    "fd": "Flash Defense",
    "br": "Barrier",
    "df": "Deflection",
    "low": "Lack of Weakness"
};

HERO.attackClasses = {
    "physical": "Physical",
    "energy": "Energy",
    "mental": "Mental"
};



HERO.characteristics = {
    "str": "STR",
    "dex": "DEX",
    "con": "CON",
    "int": "INT",
    "ego": "EGO",
    "pre": "PRE",
    "ocv": "OCV",
    "dcv": "DCV",
    "omcv": "OMCV",
    "dmcv": "DMCV",
    "spd": "SPD",
    "pd": "PD",
    "ed": "ED",
    "rec": "REC",
    "end": "END",
    "body": "BODY",
    "stun": "STUN",
    "running": "Running",
    "swimming": "Swimming",
    "leaping": "Leaping",
    "flying": "Flying",
};

HERO.characteristics5e = {
    "str": "STR",
    "dex": "DEX",
    "con": "CON",
    "body": "BODY",
    "int": "INT",
    "ego": "EGO",
    "pre": "PRE",
    "com": "COM",
    "pd": "PD",
    "ed": "ED",
    "spd": "SPD",
    "rec": "REC",
    "end": "END",
    "stun": "STUN",
    "ocv": "OCV",
    "dcv": "DCV",
    "omcv": "OMCV",
    "dmcv": "DMCV",
    "running": "Running",
    "swimming": "Swimming",
    "leaping": "Leaping",
    "flying": "Flying",
};

HERO.characteristicDefaults = {
    "str": 10,
    "dex": 10,
    "con": 10,
    "int": 10,
    "ego": 10,
    "pre": 10,
    "com": 10,
    "ocv": 3,
    "dcv": 3,
    "omcv": 3,
    "dmcv": 3,
    "spd": 2,
    "pd": 2,
    "ed": 2,
    "rec": 4,
    "end": 20,
    "body": 10,
    "stun": 20,
    "running": 12,
    "swimming": 4,
    "leaping": 4,
};

HERO.characteristicDefaults5e = {
    "str": 10,
    "dex": 10,
    "con": 10,
    "int": 10,
    "ego": 10,
    "pre": 10,
    "com": 10,
    "ocv": 3,
    "dcv": 3,
    "omcv": 3,
    "dmcv": 3,
    "spd": 2,
    "pd": 2,
    "ed": 2,
    "rec": 4,
    "end": 20,
    "body": 10,
    "stun": 20,
    "running": 6,
    "swimming": 2,
    "leaping": 1,
};

HERO.characteristicCosts = {
    "str": 1,
    "dex": 2,
    "con": 1,
    "int": 1,
    "ego": 1,
    "pre": 1,
    "ocv": 5,
    "dcv": 5,
    "omcv": 3,
    "dmcv": 3,
    "spd": 10,
    "pd": 1,
    "ed": 1,
    "rec": 1,
    "end": 1 / 5,
    "body": 1,
    "stun": 1 / 2,
    "running": 1,
    "swimming": 1 / 2,
    "leaping": 1 / 2,
};

HERO.characteristicCosts5e = {
    "str": 1,
    "dex": 3,
    "con": 2,
    "body": 2,
    "int": 1,
    "ego": 2,
    "pre": 1,
    "com": 1 / 2,
    "pd": 1,
    "ed": 1,
    "spd": 10,
    "rec": 2,
    "end": 1 / 2,
    "stun": 1,
    "ocv": 5,
    "dcv": 5,
    "omcv": 3,
    "dmcv": 3,
    "running": 2,
    "swimming": 1 / 2,
    "leaping": 1 / 2,
};


HERO.characteristicsXMLKey = {
    "STR": "str",
    "DEX": "dex",
    "CON": "con",
    "INT": "int",
    "EGO": "ego",
    "PRE": "pre",
    "COM": "com",
    "OCV": "ocv",
    "DCV": "dcv",
    "OMCV": "omcv",
    "DMCV": "dmcv",
    "SPD": "spd",
    "PD": "pd",
    "ED": "ed",
    "REC": "rec",
    "END": "end",
    "BODY": "body",
    "STUN": "stun",
    "RUNNING": "running",
    "SWIMMING": "swimming",
    "LEAPING": "leaping",
    "FLIGHT": "flying",
    "GENERAL": "general"
};

HERO.skillCharacteristics = {
    "general": "General",
    "str": "STR",
    "dex": "DEX",
    "con": "CON",
    "int": "INT",
    "ego": "EGO",
    "pre": "PRE",
};

HERO.skillCharacteristics5e = {
    "general": "General",
    "str": "STR",
    "dex": "DEX",
    "con": "CON",
    "int": "INT",
    "ego": "EGO",
    "pre": "PRE",
    "com": "COM",
};

HERO.skillTraining = {
    "untrained": "Untrained",
    "familiar": "Familiar",
    "everyman": "Everyman",
    "proficient": "Proficient",
    "trained": "Trained",
};

HERO.hitLocationsToHit = {
    "3": "Head",
    "4": "Head",
    "5": "Head",
    "6": "Hand",
    "7": "Arm",
    "8": "Arm",
    "9": "Shoulder",
    "10": "Chest",
    "11": "Chest",
    "12": "Stomach",
    "13": "Vitals",
    "14": "Thigh",
    "15": "Leg",
    "16": "Leg",
    "17": "Foot",
    "18": "Foot",
}

HERO.hitLocations = {
    // Location : [x Stun, x N Stun, x Body, OCV modifier]
    "Head": [5, 2, 2, -8],
    "Hand": [1, 0.5, 0.5, -6],
    "Arm": [2, 0.5, 0.5, -5],
    "Shoulder": [3, 1, 1, -5],
    "Chest": [3, 1, 1, -5],
    "Stomach": [4, 1.5, 1, -7],
    "Vitals": [4, 1.5, 2, -8],
    "Thigh": [2, 1, 1, -4],
    "Leg": [2, 0.5, 0.5, -6],
    "Foot": [1, 0.5, 0.5, -8],
};

HERO.combatManeuvers = {
    // Maneuver : [phase, OCV, DCV, Effects]
    "Block": ["1/2", "+0", "+0", "Blocks HTH attacks, Abort"],
    "Brace": ["0", "+2", "1/2", "+2 OCV only to offset the Range Modifier"],
    "Disarm": ["1/2", "-2", "+0", "Disarm target, requires STR vs. STR Roll"],
    "Dodge": ["1/2", "+0", "+3", "Dodge all attacks, Abort"],
    "Grab": ["1/2", "-1", "-2", "Grab Two Limbs; can Squeeze, Slam, or Throw"],
    "Grab By": ["1/2 †", "-3", "-4", "Move and Grab object, +(v/10) to STR"],
    "Haymaker": ["1/2*", "+0", "-5", "+4 Damage Classes to any attack"],
    "Move By": ["1/2 †", "-2", "-2", "((STR/2) + (v/10))d6; attacker takes 1/3 damage"],
    "Move Through": ["1/2 †", "-v/10", "-3", "(STR + (v/6))d6; attacker takes 1/2 or full damage"],
    "Multiple Attack": ["1", "var", "1/2", "Attack one or more targets multiple times"],
    "Set": ["1", "+1", "+0", "Take extra time to aim a Ranged attack at a target"],
    "Shove": ["1/2", "-1", "-1", "Push target back 1m per 5 STR used"],
    "Strike": ["1/2", "+0", "+0", "STR damage or by weapon type"],
    "Throw": ["1/2", "+0", "+0", "Throw object or character, does STR damage"],
    "Trip": ["1/2", "-1", "-2", "Knock a target to the ground, making him Prone"],
    "Other Attacks": ["1/2", "+0", "+0", ""],
}

HERO.combatManeuversOptional = {
    // Maneuver : [phase, OCV, DCV, Effects]
    "Choke": ["1/2", "-2", "-2", "NND 1d6, Grab One Limb"],
    "Club Weapon": ["1/2", "+0", "+0", "Killing weapon does equivalent Normal Damage"],
    "Cover": ["1/2", "-2", "+0", "Target held at gunpoint"],
    "Dive For Cover": ["1/2", "+0", "+0", "Character avoids attack; Abort"],
    "Hipshot": ["1/2", "-1", "+0", "+1", "DEX only for purposes of initiative"],
    "Pulling A Punch": ["1/2", "-1/5d6", "+0", "Strike, normal STUN damage, 1/2 BODY damage"],
    "Roll With A Punch": ["1/2", "-2", "-2", "Block after being hit, take 1/2 damage; Abort"],
    "Snap Shot": ["1", "-1", "+0", "Lets character duck back behind cover"],
    "Strafe": ["1/2 †", "-v/6", "-2", "Make Ranged attack while moving"],
    "Suppression Fire": ["1/2", "-2", "+0", "Continuous fire through an area, must be Autofire"],
}

HERO.movementPowers = {
    "running": "Running",
    "swimming": "Swimming",
    "leaping": "Leaping",
    "flight": "Flight",
    "swinging": "Swinging",
    "teleportation": "Teleportation",
    "tunneling": "Tunneling",
    "extradimensionalmovement": "Extra Dimensional Movement",
    "ftl": "Faster Than Light"
}

// Power Info
// Valid XMLID's for powers
HERO.powers = {

    // Characteristics (will likely use active effects for these)
    "STR": { powerType: ["characteristic"], costEnd: true },
    "DEX": { powerType: ["characteristic"] },
    "CON": { powerType: ["characteristic"] },
    "INT": { powerType: ["characteristic"] },
    "EGO": { powerType: ["characteristic"] },
    "PRE": { powerType: ["characteristic"] },
    "OCV": { powerType: ["characteristic"] },
    "DCV": { powerType: ["characteristic"] },
    "OMCV": { powerType: ["characteristic"] },
    "DMCV": { powerType: ["characteristic"] },
    "SPD": { powerType: ["characteristic"] },
    "PD": { powerType: ["characteristic"] },
    "ED": { powerType: ["characteristic"] },
    "REC": { powerType: ["characteristic"] },
    "END": { powerType: ["characteristic"] },
    "BODY": { powerType: ["characteristic"] },
    "STUN": { powerType: ["characteristic"] },

    // Misc
    "CLINGING": { powerType: ["standard"] },
    "EXTRALIMBS": { powerType: ["standard"], costPerLevel: 0 },
    "SUMMON": { powerType: ["standard"] },
    "DESOLIDIFICATION": { powerType: ["body-affecting", "standard"], name: "Desolidification" },
    "REGENERATION": { powerType: ["special"], percievability: "imperceptible", duration: "persistent", target: "self only", range: "self", costEnd: false },
    "HEALING": {
        powerType: ["adjustment"],
        percievability: "obvious",
        duration: "instant",
        target: "target's dcv",
        range: "no range",
        costEnd: true,
        costPerLevel: 10,
    },
    "STRETCHING": {
        powerType: ["body-affecting", "standard"],
        percievability: "obvious",
        duration: "constant",
        target: "self only",
        range: "self",
        costEnd: true,
        costPerLevel: 1
    },
    "LIFESUPPORT": {
        name: "Life Support",
        powerType: ["standard"],
        percievability: "imperceptible",
        duration: "persistent",
        target: "self only",
        range: "self",
        costEnd: false
    },
    "AID": {
        name: "Aid",
        powerType: ["adjustment"],
        percievability: "obvious",
        duration: "Instant",
        target: "target’s DCV",
        range: "no range",
        costEnd: true,
        costPerLevel: 6,
    },
    "SHAPESHIFT": {
        name: "Shape Shift",
        powerType: ["body-affecting"],
        percievability: "obvious",
        duration: "constant",
        target: "self only",
        range: "self",
        costEnd: true
    },
    "DENSITYINCREASE": {
        name: "Density Increase",
        powerType: ["body-affecting", "standard"],
        percievability: "obvious",
        duration: "constant",
        target: "self only",
        range: "self",
        costEnd: true,
        costPerLevel: 4,
    },
    "NAKEDMODIFIER": {  // INDEPENDENT ADVANTAGE
        powerType: [],
        costEnd: true,
        costPerLevel: 1,
    },
    "GROWTH": {
        name: "Growth",
        powerType: ["body-affecting", "size"],
        percievability: "obvious",
        duration: "constant",
        target: "self only",
        range: "self",
        costEnd: true
    },




    // Mental
    "MINDSCAN": { powerType: ["mental"] },
    "TELEPATHY": { powerType: ["mental"] },


    // Senses
    "CLAIRSENTIENCE": { powerType: ["sense"] },  //UNUSUAL SENSES
    "NIGHTVISION": { powerType: ["sense"] },
    "ENHANCEDPERCEPTION": { powerType: ["sense"] },
    "MENTALAWARENESS": { powerType: ["sense"], senseGroup: "mental", senseType: "passive" },
    "PENETRATIVE": { powerType: ["sense"] },
    "DETECT": { powerType: ["sense"], costPerLevel: 1 },
    "TARGETINGSENSE": { powerType: ["sense"] },
    "TRACKINGSENSE": { powerType: ["sense"] },
    "FINDWEAKNESS": { powerType: ["sense", "special"] },


    // Attack
    "HANDTOHANDATTACK": { powerType: ["attack"] },
    "HKA": { powerType: ["attack"], costPerLevel: 15 },
    "TELEKINESIS": {
        powerType: ["attack"],
        costEnd: true,
        costPerLevel: 3 / 2
    },
    "RKA": { powerType: ["attack"], costPerLevel: 15 },
    "ENERGYBLAST": { powerType: ["attack"] },
    "DARKNESS": { powerType: ["sense-affecting", "attack", "standard"] },
    "DISPEL": { powerType: ["attack", "standard"] },
    "ENTANGLE": { powerType: ["attack", "standard"] },
    "IMAGES": {
        name: "Images",
        powerType: ["attack", "sense-affecting", "standard"],
        percievability: "obvious",
        duration: "constant",
        target: "area (see text)",
        range: "standard",
        costEnd: true
    },
    "EXTRADC": { powerType: ["martial"], costPerLevel: 4 },

    // Defense
    "FORCEWALL": { powerType: ["defense"], name: "Barrier" }, // AKA BARRIER
    "FORCEFIELD": {
        powerType: ["defense"],
        name: "Resistant Protection",
        costPerLevel: 3 / 2
    },  // AKA RESISTANT PROTECTION
    "FLASHDEFENSE": {
        powerType: ["defense", "special"],
        name: "Flash Defense",
        percievability: "inobvious",
        duration: "persistent",
        target: "self only",
        range: "self",
        costEnd: false,
        costPerLevel: 1,
    },
    "MENTALDEFENSE": {
        powerType: ["defense", "special"],
        name: "Mental Defense",
        costPerLevel: 1
    },
    "POWERDEFENSE": {
        powerType: ["defense", "special"],
        name: "Power Defense",
        percievability: "inobvious",
        duration: "persistent",
        target: "self only",
        range: "self",
        costEnd: false,
        costPerLevel: 1,
    },
    "DAMAGENEGATION": {
        powerType: ["defense", "special"],
        name: "Damage Negation",
        percievability: "inobvious",
        duration: "persistent",
        target: "self only",
        range: "self",
        costEnd: false
    },
    "DAMAGEREDUCTION": {
        powerType: ["defense", "standard"],
        name: "Damage Reduction",
        percievability: "inobvious",
        duration: "persistent",
        target: "self only",
        range: "self",
        costEnd: false
    },
    "KBRESISTANCE": {
        powerType: ["defense", "standard"],
        name: "Knockback Resistance",
        percievability: "imperceptible",
        duration: "persistent",
        target: "self only",
        range: "self",
        costEnd: false
    },
    "LACKOFWEAKNESS": {
        powerType: ["defense", "special"],
        name: "Knockback Resistance",
        percievability: "imperceptible",
        duration: "persistent",
        target: "self only",
        range: "self",
        costEnd: false,
        costPerLevel: 1,
    },


    // Movement
    "FLIGHT": { powerType: ["movement"], costEnd: true, costPerLevel: 1, },
    "LEAPING": { powerType: ["movement"], costEnd: true, costPerLevel: 0.5, },
    "TELEPORTATION": { powerType: ["movement"], costEnd: true, costPerLevel: 1, },
    "SWINGING": { powerType: ["movement"], costEnd: true, costPerLevel: 0.5, },
    "TUNNELING": { powerType: ["movement"], costEnd: true, costPerLevel: 1, },
    "RUNNING": { powerType: ["movement"], costEnd: true, costPerLevel: 1, },

    // PERKS
    "REPUTATION": {
        powerType: ["talent"],
        name: "Positive Reputation",
        costPerLevel: 0,
    },
    "CONTACT": {
        powerType: ["talent"],
        name: "Contact",
        costPerLevel: 1,
    },

    // Powers can include Talents
    "COMBAT_LUCK": { powerType: ["talent"], costPerLevel: 6 },
    "COMBAT_SENSE": {
        powerType: ["talent"],
        name: "Combat Sense",
        costPerLevel: 1,
    },

    // Powers can include Skills.
    "ACROBATICS": { powerType: ["skill"] },
    "ACTING": { powerType: ["skill"] },
    "ANALYZE": { powerType: ["skill"] },
    "ANIMAL_HANDLER": { powerType: ["skill"], categorized: true },
    "AUTOFIRE_SKILLS": { powerType: ["skill"] },
    "BREAKFALL": { powerType: ["skill"] },
    "BRIBERY": { powerType: ["skill"] },
    "BUGGING": { powerType: ["skill"] },
    "BUREAUCRATICS": { powerType: ["skill"] },
    "CHARM": { powerType: ["skill"] },
    "CLIMBING": { powerType: ["skill"] },
    "COMBAT_DRIVING": { powerType: ["skill"] },
    "COMBAT_PILOTING": { powerType: ["skill"] },
    "COMBAT_LEVELS": { powerType: ["skill"] },
    "COMPUTER_PROGRAMMING": { powerType: ["skill"] },
    "CONCEALMENT": { powerType: ["skill"] },
    "CONTORTIONIST": { powerType: ["skill"] },
    "CONVERSATION": { powerType: ["skill"] },
    "CRAMMING": { powerType: ["skill"] },
    "CRIMINOLOGY": { powerType: ["skill"] },
    "CRYPTOGRAPHY": { powerType: ["skill"] },
    "CUSTOMSKILL": { powerType: ["skill"] },
    "DEDUCTION": { powerType: ["skill"] },
    "DEFENSE_MANEUVER": { powerType: ["skill"] },
    "DEMOLITIONS": { powerType: ["skill"] },
    "DISGUISE": { powerType: ["skill"] },
    "ELECTRONICS": { powerType: ["skill"] },
    "FAST_DRAW": { powerType: ["skill"] },
    "FORENSIC_MEDICINE": { powerType: ["skill"] },
    "FORGERY": { powerType: ["skill"], categorized: true },
    "GAMBLING": { powerType: ["skill"], categorized: true },
    "HIGH_SOCIETY": { powerType: ["skill"] },
    "INTERROGATION": { powerType: ["skill"] },
    "INVENTOR": { powerType: ["skill"] },
    "KNOWLEDGE_SKILL": { powerType: ["skill"], costPerLevel: 1 },
    "LANGUAGES": { powerType: ["skill"] },
    "LIPREADING": { powerType: ["skill"] },
    "LOCKPICKING": { powerType: ["skill"] },
    "MECHANICS": { powerType: ["skill"] },
    "MENTAL_COMBAT_LEVELS": { powerType: ["skill"] },
    "MIMICRY": { powerType: ["skill"] },
    "NAVIGATION": { powerType: ["skill"], categorized: true },
    "ORATORY": { powerType: ["skill"] },
    "PARAMEDICS": { powerType: ["skill"] },
    "PENALTY_SKILL_LEVELS": { powerType: ["skill"] },
    "PERSUASION": { powerType: ["skill"] },
    "POWERSKILL": { powerType: ["skill"] },
    "PROFESSIONAL_SKILL": { powerType: ["skill"] },
    "RAPID_ATTACK_HTH": { powerType: ["skill"] },
    "RIDING": { powerType: ["skill"] },
    "SCIENCE_SKILL": { powerType: ["skill"] },
    "SECURITY_SYSTEMS": { powerType: ["skill"] },
    "SHADOWING": { powerType: ["skill"] },
    "SKILL_LEVELS": { powerType: ["skill"] },
    "SLEIGHT_OF_HAND": { powerType: ["skill"] },
    "STEALTH": { powerType: ["skill"] },
    "STREETWISE": { powerType: ["skill"] },
    "SURVIVAL": { powerType: ["skill"], categorized: true },
    "SYSTEMS_OPERATION": { powerType: ["skill"] },
    "TACTICS": { powerType: ["skill"] },
    "TEAMWORK": { powerType: ["skill"] },
    "TRACKING": { powerType: ["skill"] },
    "TRADING": { powerType: ["skill"] },
    "TRANSPORT_FAMILIARITY": { powerType: ["skill"] },
    "TWO_WEAPON_FIGHTING_HTH": { powerType: ["skill"] },
    "VENTRILOQUISM": { powerType: ["skill"] },
    "WEAPON_FAMILIARITY": { powerType: ["skill"] },
    "WEAPONSMITH": { powerType: ["skill"], categorized: true },
}


// These (mostly 5e) powers are rebranded as 6e powers
HERO.powersRebrand = {
    "ARMOR": "FORCEFIELD"
}

// For some reason the BASECOST of some modifiers/adder are 0, some are just wrong
HERO.ModifierOverride = {
    "DIFFICULTTODISPEL": { BASECOST: 0.25 },
    "IMPENETRABLE": { BASECOST: 0.25 },
    "DIMENSIONS": { BASECOST: 5 },
    "IMPROVEDNONCOMBAT": { BASECOST: 5 },
    "DEFBONUS": { BASECOST: 2 },
    "CONTINUOUSCONCENTRATION": { BASECOST: -0.25 },
    "ALWAYSOCCURS": { BASECOST: 0, MULTIPLIER: 2 },
}

HERO.areaOfEffect = {
    types: {
        none: "None",
        radius: "Radius",
        cone: "Cone",
        line: "Line",
        surface: "Surface",
        any: "Any Area"
    }
}

HERO.stunBodyDamages = {
    "stunbody": "Stun and Body",
    "stunonly": "Stun only",
    "bodyonly": "Body only",
    "effectonly": "Effect only"
}

HERO.knockbackMultiplier = {
    0: "No Knockback",
    1: "Knockback",
    2: "Double Knockback"
}