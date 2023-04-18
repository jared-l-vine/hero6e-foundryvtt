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

HERO.characteristicDefaults = {
    "str": 10,
    "dex": 10,
    "con": 10,
    "int": 10,
    "ego": 10,
    "pre": 10,
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

HERO.characteristicsXMLKey = {
    "STR": "str",
    "DEX": "dex",
    "CON": "con",
    "INT": "int",
    "EGO": "ego",
    "PRE": "pre",
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
    "STR": {powerType: ["characteristic"]},
    "DEX": {powerType: ["characteristic"]},
    "CON": {powerType: ["characteristic"]},
    "INT": {powerType: ["characteristic"]},
    "EGO": {powerType: ["characteristic"]},
    "PRE": {powerType: ["characteristic"]},
    "OCV": {powerType: ["characteristic"]},
    "DCV": {powerType: ["characteristic"]},
    "OMCV": {powerType: ["characteristic"]},
    "DMCV": {powerType: ["characteristic"]},
    "SPD": {powerType: ["characteristic"]},
    "PD": {powerType: ["characteristic"]},
    "ED": {powerType: ["characteristic"]},
    "REC": {powerType: ["characteristic"]},
    "END": {powerType: ["characteristic"]},
    "BODY": {powerType: ["characteristic"]},
    "STUN": {powerType: ["characteristic"]},

    // Misc
    "CLINGING": {powerType: ["standard"]},
    "EXTRALIMBS": {powerType: ["standard"]},
    "SUMMON": {powerType: ["standard"]},

    // Mental
    "MINDSCAN": {powerType: ["mental"]},
    "TELEPATHY": {powerType: ["mental"]},
    
    
    // Senses
    "CLAIRSENTIENCE": {powerType: ["sense"]},  //UNUSUAL SENSES
    "NIGHTVISION": {powerType: ["sense"]}, 
    "ENHANCEDPERCEPTION": {powerType: ["sense"]},  
    

    // Attack
    "HANDTOHANDATTACK": {powerType: ["attack"]},
    "HKA": {powerType: ["attack"]},
    "TELEKINESIS": {powerType: ["attack"]},

    // Defense
    "FORCEWALL": { powerType: ["defense"], name: "Resistant Protection"}, // AKA BARRIER
    "FORCEFIELD": { powerType: ["defense"], name: "Barrier"},  // AKA RESISTANT PROTECTION

    // Movement
    "FLIGHT": { powerType: ["movement"]},
    "LEAPING": { powerType: ["movement"]},
    "TELEPORTATION": { powerType: ["movement"]},

    // Powers can include Skills.
    "ACROBATICS": {powerType: ["skill"]},
    "ACTING": {powerType: ["skill"]},
    "ANALYZE": {powerType: ["skill"]},
    "ANIMAL_HANDLER": {powerType: ["skill"]},
    "AUTOFIRE_SKILLS": {powerType: ["skill"]},
    "BREAKFALL": {powerType: ["skill"]},
    "BRIBERY": {powerType: ["skill"]},
    "BUGGING": {powerType: ["skill"]},
    "BUREAUCRATICS": {powerType: ["skill"]},
    "CHARM": {powerType: ["skill"]},
    "CLIMBING": {powerType: ["skill"]},
    "COMBAT_DRIVING": {powerType: ["skill"]},
    "COMBAT_PILOTING": {powerType: ["skill"]},
    "COMBAT_LEVELS": {powerType: ["skill"]},
    "COMPUTER_PROGRAMMING": {powerType: ["skill"]},
    "CONCEALMENT": {powerType: ["skill"]},
    "CONTORTIONIST": {powerType: ["skill"]},
    "CONVERSATION": {powerType: ["skill"]},
    "CRAMMING": {powerType: ["skill"]},
    "CRIMINOLOGY": {powerType: ["skill"]},
    "CRYPTOGRAPHY": {powerType: ["skill"]},
    "CUSTOMSKILL": {powerType: ["skill"]},
    "DEDUCTION": {powerType: ["skill"]},
    "DEFENSE_MANEUVER": {powerType: ["skill"]},
    "DEMOLITIONS": {powerType: ["skill"]},
    "DISGUISE": {powerType: ["skill"]},
    "ELECTRONICS": {powerType: ["skill"]},
    "FAST_DRAW": {powerType: ["skill"]},
    "FORENSIC_MEDICINE": {powerType: ["skill"]},
    "FORGERY": {powerType: ["skill"]},
    "GAMBLING": {powerType: ["skill"]},
    "HIGH_SOCIETY": {powerType: ["skill"]},
    "INTERROGATION": {powerType: ["skill"]},
    "INVENTOR": {powerType: ["skill"]},
    "KNOWLEDGE_SKILL": {powerType: ["skill"]},
    "LANGUAGES": {powerType: ["skill"]},
    "LIPREADING": {powerType: ["skill"]},
    "LOCKPICKING": {powerType: ["skill"]},
    "MECHANICS": {powerType: ["skill"]},
    "MENTAL_COMBAT_LEVELS": {powerType: ["skill"]},
    "MIMICRY": {powerType: ["skill"]},
    "NAVIGATION": {powerType: ["skill"]},
    "ORATORY": {powerType: ["skill"]},
    "PARAMEDICS": {powerType: ["skill"]},
    "PENALTY_SKILL_LEVELS": {powerType: ["skill"]},
    "PERSUASION": {powerType: ["skill"]},
    "POWERSKILL": {powerType: ["skill"]},
    "PROFESSIONAL_SKILL": {powerType: ["skill"]},
    "RAPID_ATTACK_HTH": {powerType: ["skill"]},
    "RIDING": {powerType: ["skill"]},
    "SCIENCE_SKILL": {powerType: ["skill"]},
    "SECURITY_SYSTEMS": {powerType: ["skill"]},
    "SHADOWING": {powerType: ["skill"]},
    "SKILL_LEVELS": {powerType: ["skill"]},
    "SLEIGHT_OF_HAND": {powerType: ["skill"]},
    "STEALTH": {powerType: ["skill"]},
    "STREETWISE": {powerType: ["skill"]},
    "SURVIVAL": {powerType: ["skill"]},
    "SYSTEMS_OPERATION": {powerType: ["skill"]},
    "TACTICS": {powerType: ["skill"]},
    "TEAMWORK": {powerType: ["skill"]},
    "TRACKING": {powerType: ["skill"]},
    "TRADING": {powerType: ["skill"]},
    "TRANSPORT_FAMILIARITY": {powerType: ["skill"]},
    "TWO_WEAPON_FIGHTING_HTH": {powerType: ["skill"]},
    "VENTRILOQUISM": {powerType: ["skill"]},
    "WEAPON_FAMILIARITY": {powerType: ["skill"]},
    "WEAPONSMITH": {powerType: ["skill"]},
}