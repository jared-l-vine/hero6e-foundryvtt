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
    "powd": "Power Defense",
    "dn": "Damage Negative",
    "dr": "Damage Reduction",
    "misc": "Miscellaneous",
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
    "6": "Hands",
    "7": "Arms",
    "8": "Arms",
    "9": "Shoulders",
    "10": "Chest",
    "11": "Chest",
    "12": "Stomach",
    "13": "Vitals",
    "14": "Thighs",
    "15": "Legs",
    "16": "Legs",
    "17": "Feet",
    "18": "Feet",
}

HERO.hitLocations = {
    // Location : [x Stun, x N Stun, x Body, OCV modifier]
    "Head": [5, 2, 2, -8],
    "Hands": [1, 0.5, 0.5, -6],
    "Arms": [2, 0.5, 0.5, -5],
    "Shoulders": [3, 1, 1, -5],
    "Chest": [3, 1, 1, -5],
    "Stomach": [4, 1.5, 1, -7],
    "Vitals": [4, 1.5, 2, 2, -8],
    "Thighs": [2, 1, 1, -4],
    "Legs": [2, 0.5, 0.5, -6],
    "Feet": [1, 0.5, 0.5, -8],
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