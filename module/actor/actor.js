/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class HeroSystem6eActor extends Actor {

    /**
     * Augment the basic actor data with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'character') this._prepareCharacterData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        const data = actorData.data;

        // Make modifications to data here. For example:

        // Loop through characteristics, and add their rolls to our sheet output.
        for (let [key, characteristic] of Object.entries(data.characteristics)) {
            characteristic.roll = Math.round(9 + (characteristic.value / 5));
        }

        this._prepareResource(data.body, data.characteristics['body']);
        this._prepareResource(data.stun, data.characteristics['stun']);
        this._prepareResource(data.end, data.characteristics['end']);

        for (let [key, characteristic] of Object.entries(data.characteristics)) {
            this._prepareCharacteristic(characteristic);
        }
    }

    _prepareCharacteristic(characteristic) {
        if (characteristic.modifier) {
            characteristic.value *= characteristic.modifier;
        }

        characteristic.value = Math.round(characteristic.value);
    }

    _prepareResource(resource, characteristic) {
        resource.max = characteristic.value;
    }

    /** @override */
    applyActiveEffects() {
        // The Active Effects do not have access to their parent at preparation time so we wait until this stage to
        // determine whether they are suppressed or not.
        return super.applyActiveEffects();
    }

    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);
    }
}