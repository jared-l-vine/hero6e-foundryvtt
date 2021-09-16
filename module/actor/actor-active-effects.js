export class HeroSystem6eActorActiveEffects {
    static getEffects() {
        return [
            HeroSystem6eActorActiveEffects.stunEffect,
            HeroSystem6eActorActiveEffects.bleedingEffect,
            HeroSystem6eActorActiveEffects.unconsciousEffect,
            HeroSystem6eActorActiveEffects.deadEffect,
        ];
    }

    static stunEffect = {
        label: "EFFECT.StatusStunned",
        id: "stunned",
        icon: 'icons/svg/daze.svg',
        changes: [
            { key: "data.characteristics.ocv.modifier", value: 0.5, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE },
            { key: "data.characteristics.dcv.modifier", value: 0.5, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE }
        ]
    };

    static bleedingEffect = {
        label: "EFFECT.StatusBleeding",
        id: "bleeding",
        icon: 'icons/svg/blood.svg',
    };

    static unconsciousEffect = {
        label: "EFFECT.StatusUnconscious",
        id: "unconscious",
        icon: 'icons/svg/unconscious.svg',
        changes: [
            { key: "data.characteristics.ocv.modifier", value: 0, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE },
            { key: "data.characteristics.dcv.modifier", value: 0, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE }
        ]
    };

    static deadEffect = {
        label: "EFFECT.StatusDead",
        id: "dead",
        icon: 'icons/svg/skull.svg',
        changes: [
            { key: "data.characteristics.ocv.modifier", value: 0, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE },
            { key: "data.characteristics.dcv.modifier", value: 0, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE }
        ]
    };
}