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