import { HERO } from "./config.js";
import { HEROSYS } from "./herosystem6e.js";

export class HeroSystem6eCombat extends Combat {
    constructor(data, context) {
        super(data, context);

        this.segments = this.segments || {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: [],
            10: [],
            11: [],
            12: []
        };

        this.segment = 12;

        this.setSegment(12)

        this.current = this.current || {
            heroRound: null,
            segment: null,
            heroTurn: null,
            tokenId: null,
            combatantId: null
        };

        this.previous = this.previous || {
            heroRound: null,
            segment: null,
            heroTurn: null,
            tokenId: null,
            combatantId: null
        };

        if (!this.current.segment) this.current.segment = null;
        if (!this.previous.segment) this.previous.segment = null;
    }

    /**
     * The configuration setting used to record Combat preferences
     * @type {string}
     */
    static CONFIG_SETTING = "combatTrackerConfig";

    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */

    /**
     * Get the Combatant who has the current heroTurn.
     * @type {Combatant}
     */
    get combatant() {
        return this.segment ? this.currentSegment[this.turn] : undefined;
    }

    /* -------------------------------------------- */

    /**
     * The numeric heroRound of the Combat encounter
     * @type {number}
     */
    get heroRound() {
        return Math.max(this._heroRound, 0);
    }

    get segment() {
        return Math.max(this.flags.world.segment, 1);
    }

    setSegment(value) {
        this.setFlag('world', 'segment', value)
    }

    set segment(segment) {
        this._segment = segment
    }

    get currentSegment() {
        return this.segments[this.segment];
    }

    /* -------------------------------------------- */

    /**
     * A reference to the Scene document within which this Combat encounter occurs.
     * If a specific Scene is not set in the Combat Data, the currently viewed scene is assumed instead.
     * @type {Scene}
     */
    /* disabling for v10 compatibility
    get scene() {
        return game.scenes.get(this.scene) || game.scenes.current || undefined;
    }

    /* -------------------------------------------- */

    /**
     * Return the object of settings which modify the Combat Tracker behavior
     * @return {object}
     */
    get settings() {
        return CombatEncounters.settings;
    }

    /* -------------------------------------------- */

    /**
     * Has this combat encounter been started?
     * @type {boolean}
     */
    get started() {
        return (this.segments.length > 0) && (this.heroRound > 0);
    }

    /* -------------------------------------------- */

    /**
     * The numeric heroTurn of the combat heroRound in the Combat encounter
     * @type {number}
     */
    get heroTurn() {
        return Math.max(this._heroTurn, 0);
    }

    set heroTurn(heroTurn) {
        this._heroTurn = heroTurn
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    get visible() {
        return true;
    }

    /* -------------------------------------------- */

    /**
     * Advance the combat to the next heroRound
     * @return {Promise<Combat>}
     */
    async nextheroRound() {
        let segment = 1;
        let heroTurn = 0;
        let found = false;
        if (this.settings.skipDefeated) {
            for (let i = 1; i <= 12 && !found; i++) {
                for (let j = 0; j < this.segments[i].length && !found; j++) {
                    let t = this.segments[i][j];
                    if (!(t.data.defeated || t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId))) {
                        segment = i;
                        heroTurn = j;
                        found = true;
                    }
                }
            }
            if (heroTurn === -1) {
                ui.notifications.warn("COMBAT.NoneRemaining", { localize: true });
                heroTurn = 0;
            }
        } else {
            for (let i = 1; i <= 12; i++) {
                if (this.segments[i].length > 0) {
                    segment = i;
                    break;
                }
            }
        }

        //let advanceTime = Math.max(this.turns.length - this.heroTurn, 1) * CONFIG.time.turnTime;
        let advanceTime = Math.max(this.segments.length - this.segment, 1) * CONFIG.time.segmentTime
        advanceTime += CONFIG.time.heroRoundTime;

        return await this.update({ round: this.round + 1, segment: segment, heroTurn: heroTurn }, { advanceTime });
    }

    async nextSegment() {
        let segment = this.segment;

        let skip = this.settings.skipDefeated;

        // Determine the next heroTurn number
        let next = null;
        let nextTurn = null;

        if (skip) {
            for (let [i, s] of this.segments.entries()) {
                if (i <= this.segment) continue;
                nextTurn = (s.findIndex(t => {
                    return !(t.data.defeated ||
                        t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId));
                }));
                if (nextTurn === -1) continue;
                next = i;
                break;
            }
        }
        else {
            for (let [i, s] of this.segments.entries()) {
                if (i < this.segment) continue;
                nextTurn = (s.findIndex(t => {
                    return true;
                }));
                if (nextTurn === -1) continue;
                next = i;
                break;
            }
        }

        nextTurn += 1
        next = nextTurn

        // Maybe advance to the next heroRound
        let round = this.round;
        if ((this.round === 0) || (next === null) || (next >= this.segments.length)) {
            return this.nextheroRound();
        }

        // Update the encounter
        const advanceTime = CONFIG.time.segmentTime;

        let segement = this.segment

        let nextSegment;

        const segementIndexes = this.segments.reduce((accumulator, currentValue, currentIndex) => {
            if (currentValue.length > 0) {
            accumulator.push(currentIndex);
            }
            return accumulator;
        }, []);

        
        if (Number(segement) === 12) {
            nextSegment = segementIndexes[0]
        }

        let nextIndex = segementIndexes.indexOf(segement) + 1

        if (nextIndex > (segementIndexes.length - 1)) {
            round += 1
            nextIndex = 0
        }

        this.update({ round: round, turn: 0 });

        this.setSegment(segementIndexes[nextIndex])

        return
    }

    /* -------------------------------------------- */

    /**
     * Advance the combat to the next heroTurn
     * @return {Promise<Combat>}
     */
    async nextTurn() {
        let heroTurn = this.turn;
        let skip = this.settings.skipDefeated;

        // Determine the next heroTurn number
        let next = null;
        if (skip) {
            for (let [i, t] of this.segments[this.segment].entries()) {
                if (i <= heroTurn) continue;
                if (t.data.defeated) continue;
                if (t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId)) continue;
                next = i;
                break;
            }
        }
        else next = heroTurn + 1;

        // Maybe advance to the next heroRound
        let heroRound = this.heroRound;
        if ((this.heroRound === 0) || (next === null) || (next >= this.segments[this.segment].length)) {
            return this.nextSegment();
        }

        // Update the encounter
        const advanceTime = CONFIG.time.turnTime;

        // return this.update({ heroRound: heroRound, turn: next }, { advanceTime });

        return this.update({ heroRound: heroRound, turn: next });
    }

    /* -------------------------------------------- */

    /** @override */
    prepareDerivedData() {
        if (this.combatants.size && !this.segments?.length) this.setupTurns();
    }

    /* -------------------------------------------- */

    /**
     * Rewind the combat to the previous heroRound
     * @return {Promise<Combat>}
     */
    async previousheroRound() {
        let segment = (this.heroRound === 0) ? 0 : Math.max(this.segments.length - 1, 0);
        if (this.heroRound === 1) segment = 12;
        let heroTurn = (this.heroRound === 0) ? 0 : Math.max(this.segments[segment].length - 1, 0);
        const heroRound = Math.max(this.heroRound - 1, 0);
        let advanceTime = -1 * this.heroTurn * CONFIG.time.turnTime;
        if (heroRound > 0) advanceTime -= CONFIG.time.heroRoundTime;
        return this.update({ heroRound, segment, heroTurn }, { advanceTime });
    }

    async previousSegment() {
        if (this.turn === 0 && this.heroRound === 0) return this;

        let previousSegment = -1;

        for (let i = this.segment - 1; i >= 1; i--) {
            if (this.segments[i].length > 0) {
                previousSegment = i;
                break;
            }
        }

        if (previousSegment < 1 || this.heroRound === 1) return this.previousheroRound();

        const advanceTime = -1 * CONFIG.time.segmentTime;

        await this.setSegment(previousSegment)

        return this.update({ turn: this.segments[previousSegment].length - 1 }, { advanceTime });
    }

    /* -------------------------------------------- */

    /**
     * Rewind the combat to the previous heroTurn
     * @return {Promise<Combat>}
     */
    async previousTurn() {
        if (this.turn === 0 && this.heroRound === 0) return this;
        else if (this.turn <= 0) return this.previousSegment();
        const advanceTime = -1 * CONFIG.time.turnTime;
        return this.update({ turn: this.turn - 1 }, { advanceTime });
    }

    /* -------------------------------------------- */

    /**
     * Reset all combatant initiative scores, setting the heroTurn back to zero
     * @return {Promise<Combat>}
     */
    async resetAll() {
        for (let c of this.combatants) {
            c.data.update({ initiative: null });
        }
        return this.update({ heroTurn: 0, combatants: this.combatants.toJSON() }, { diff: false });
    }

    /* -------------------------------------------- */

    /**
     * Roll initiative for one or multiple Combatants within the Combat entity
     * @param {string|string[]} ids     A Combatant id or Array of ids for which to roll
     * @param {object} [options={}]     Additional options which modify how initiative rolls are created or presented.
     * @param {string|null} [options.formula]         A non-default initiative formula to roll. Otherwise the system default is used.
     * @param {boolean} [options.updateTurn=true]     Update the Combat heroTurn after adding new initiative scores to keep the heroTurn on the same Combatant.
     * @param {object} [options.messageOptions={}]    Additional options with which to customize created Chat Messages
     * @return {Promise<Combat>}        A promise which resolves to the updated Combat entity once updates are complete.
     */

    async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;

        /*
        if (this.combatant === undefined) return;

        const currentId = this.combatant.id;
        const rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");
        */

        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        for (let [id, value] of this.combatants.entries()) {
            // Get Combatant data (non-strictly)
            const combatant = this.combatants.get(id);
            if (!combatant?.isOwner) return results;

            // Produce an initiative roll for the Combatant
            let dexValue = combatant.actor.system.characteristics.dex.value
            let intValue = combatant.actor.system.characteristics.int.value
            let initativeValue = dexValue + (intValue / 100)

            //formula = initativeValue.toString()

            //const roll = combatant.getInitiativeRoll(formula);

            const name = combatant.actor.name

            // const allInitiatives = [[name, initativeValue]]
            const allInitiatives = []
            for (const item of combatant.actor.items) {
                if (! item.system.hasOwnProperty('id')) { continue; }

                switch(item.system.id) {
                    case ('LIGHTNING_REFLEXES_ALL'): {
                        const lightning_reflex_initiative = (parseInt(dexValue) + parseInt(item.system.other.levels)) + (parseInt(initativeValue) / 100)
                        const lightning_reflex_alias = '(' + item.system.other.option_alias + ')'
                        
                        allInitiatives.push([name, lightning_reflex_alias, lightning_reflex_initiative])
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }

            allInitiatives.sort((a, b) => b[2] - a[2])

            updates.push({ 
                _id: id, initiative: initativeValue, 
                name: name,
                'flags.initiatives': allInitiatives
            });

            //updates.push({ _id: id, initiative: roll.total });

            // Construct chat message data
            /*
            let messageData = foundry.utils.mergeObject({
                speaker: {
                    scene: this.scene.id,
                    actor: combatant.actor?.id,
                    token: combatant.token?.id,
                    alias: combatant.name
                },
                flavor: game.i18n.format("COMBAT.RollsInitiative", { name: combatant.name }),
                flags: { "core.initiativeRoll": true }
            }, messageOptions);
            const chatData = await roll.toMessage(messageData, {
                create: false,
                rollMode: combatant.hidden && (rollMode === "roll") ? "gmroll" : rollMode
            });
            */

            // Play 1 sound for the whole rolled set
            //if (i > 0) chatData.sound = null;
            //messages.push(chatData);
        }
        if (!updates.length) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Ensure the heroTurn order remains with the same combatant
        /*
        if (updateTurn) {
            await this.update({ heroTurn: this.segments[this.segment].findIndex(t => t.id === currentId) });
        }
        */

        // Create multiple chat messages
        //await ChatMessage.implementation.create(messages);
        return this;
    }

    async rollAll(options) {
        const ids = this.combatants.reduce((ids, c) => {
            if (c.isOwner && !c.initiative) ids.push(c.id);
            return ids;
        }, []);
        return this.rollInitiative(ids, options);
    }

    /* -------------------------------------------- */

    /**
     * Assign initiative for a single Combatant within the Combat encounter.
     * Update the Combat heroTurn order to maintain the same combatant as the current heroTurn.
     * @param {string} id         The combatant ID for which to set initiative
     * @param {number} value      A specific initiative value to set
     */

    async setInitiative(id, value) {
        const currentId = this.combatant.id;
        const combatant = this.combatants.get(id, { strict: true });
        await combatant.update({ initiative: value });
        await this.update({ heroTurn: this.segments[this.segment].findIndex(c => c.id === currentId) });
    }

    /* -------------------------------------------- */

    /**
     * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
     * @return {Combatant[]}
     */

    setupTurns() {
        // Determine the heroTurn order and the current heroTurn
        const heroTurnSet = this.combatants.contents.sort(this._sortCombatants);

        let segments = [];
        for (let i = 1; i <= 12; i++) {
            segments[i] = [];

            for (let j = 0; j < heroTurnSet.length; j++) {
                if (HeroSystem6eCombat.hasPhase(heroTurnSet[j].actor.system.characteristics.spd.value, i)) {
                    let allInitiatives = heroTurnSet[j].flags.initiatives

                    if (typeof allInitiatives === 'undefined' || allInitiatives === null) { continue; }

                    for (let k = 0; k < allInitiatives.length; k++) {
                        const fakeCombatantData = {
                            'name': allInitiatives[k][0],
                            'alias': allInitiatives[k][1],
                            'initiative': allInitiatives[k][2],
                            'img': heroTurnSet[j].img,
                            'actorId': heroTurnSet[j].actorId,
                            'tokenId': heroTurnSet[j].tokenId,
                            'hidden': heroTurnSet[j].hidden,
                            'defeated': heroTurnSet[j].defeated,
                            'visible': heroTurnSet[j].visible,
                            'token': heroTurnSet[j].token,
                            'owner': heroTurnSet[j].owner,
                            'resource': heroTurnSet[j].resource,
                            'id': heroTurnSet[j].id
                        }

                        segments[i].push(fakeCombatantData)
                    }

                    segments[i].push(heroTurnSet[j]);
                }
            }

            segments[i].sort(function(a, b) {
                return  b.initiative - a.initiative
            });
        }

        this.segment = Math.clamped(this.segment, 1, 12) || 12;
        this.heroTurn = Math.clamped(this.heroTurn, 0, segments[this.segment].length - 1);

        // Update state tracking
        let c = segments[this.segment][this.heroTurn];
        this.current = {
            heroRound: this.heroRound,
            segment: this.segment,
            heroTurn: this.heroTurn,
            combatantId: c ? c.id : null,
            tokenId: c ? c.data.tokenId : null
        };

        let success = this.segments = segments;

        if (success) {
            this.rollAll();
        }

        return success;
    }

    _sortCombatants(a, b) {
        const initA = Number.isNumeric(a.initiative) ? a.initiative : -9999;
        const initB = Number.isNumeric(b.initiative) ? b.initiative : -9999;

        let initDifference = initB - initA;
        if (initDifference != 0) {
            return initDifference;
        }

        const typeA = a.actor.hasPlayerOwner;
        const typeB = b.actor.hasPlayerOwner;

        if (typeA != typeB) {
            if (typeA) {
                return -1;
            }
            if (typeB) {
                return 1;
            }
        }
    }

    static hasPhase(spd, segment) {
        switch (spd) {
            case 1:
                return [7].includes(segment);
            case 2:
                return [6, 12].includes(segment);
            case 3:
                return [4, 8, 12].includes(segment);
            case 4:
                return [3, 6, 9, 12].includes(segment);
            case 5:
                return [3, 5, 8, 10, 12].includes(segment);
            case 6:
                return [2, 4, 6, 8, 10, 12].includes(segment);
            case 7:
                return [2, 4, 6, 7, 9, 11, 12].includes(segment);
            case 8:
                return [2, 3, 5, 6, 8, 9, 11, 12].includes(segment);
            case 9:
                return [2, 3, 4, 6, 7, 8, 10, 11, 12].includes(segment);
            case 10:
                return [2, 3, 4, 5, 6, 8, 9, 10, 11, 12].includes(segment);
            case 11:
                return [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(segment);
            case 12:
                return true;
            default:
                return false;
        }
    }

    /* -------------------------------------------- */

    /**
     * Begin the combat encounter, advancing to heroRound 1 and heroTurn 1
     * @return {Promise<Combat>}
     */
    async startCombat() {
        this.setSegment(12)
        return await this.update({ round: 1, turn: 0 });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);

        if (data.hasOwnProperty("segment")) {
            this.segment = data.segment;
        }

        // Set up heroTurn data
        if (["combatants", "heroRound", "segment", "turn"].some(k => data.hasOwnProperty(k))) {
            if (data.combatants) this.setupTurns();
            else {
                const c = this.combatant;
                this.previous = this.current;
                this.current = {
                    heroRound: this.heroRound,
                    segment: this.segment,
                    heroTurn: this.heroTurn,
                    combatantId: c ? c.id : null,
                    tokenId: c ? c.tokenId : null
                };
            }

            // Render the sidebar
            if (data.active === true) ui.combat.initialize({ combat: this });
            return ui.combat.scrollToTurn();
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onCreateEmbeddedDocuments(type, documents, result, options, userId) {
        super._onCreateEmbeddedDocuments(type, documents, result, options, userId);

        // Update the heroTurn order and adjust the combat to keep the combatant the same
        const current = this.combatant;
        this.setupTurns();

        // Keep the current Combatant the same after adding new Combatants to the Combat
        if (current) {
            let heroTurn = Math.max(this.segments[this.segment].findIndex(t => t.id === current.id), 0);
            if (game.user.id === userId) this.update({ heroTurn });
            else this.update({ heroTurn });
        }

        // Render the collection
        if (this.active) this.collection.render();
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onUpdateEmbeddedDocuments(...args) {
        super._onUpdateEmbeddedDocuments(...args);
        this.setupTurns();
        if (this.active) this.collection.render();
    }

    _onActorDataUpdate() {
        this.setupTurns();
        if (this.active) this.collection.render();
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        this.render(false, { renderContext: `delete${embeddedName}` });

        // Update the heroTurn order and adjust the combat to keep the combatant the same (unless they were deleted)
        const currId = result

        if (currId === undefined) return;

        const nextSurvivor = this.segments[this.segment].find((i, t) => {
            return !result.includes(t.id) && (i >= this.heroTurn) && !t.data.defeated;
        });
        this.setupTurns();

        // If the current combatant was removed, update the heroTurn order to the next survivor
        let heroTurn = this.heroTurn;
        if (result.includes(currId)) {
            if (nextSurvivor) heroTurn = this.segments[this.segment].findIndex(t => t.id === nextSurvivor.id);
        }

        // Otherwise keep the combatant the same
        else heroTurn = this.segments[this.segment].findIndex(t => t.id === currId);

        // Update database or perform a local override
        heroTurn = Math.max(heroTurn, 0);
        if (game.user.id === userId) this.update({ heroTurn });
        else this.update({ heroTurn });

        // Render the collection
        if (this.active) this.collection.render();
    }
}

export class HeroSystem6eCombatTracker extends CombatTracker {
    static get defaultOptions() {
        var path = "systems/hero6efoundryvttv2/templates/combat/combat-tracker.hbs";
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: path,
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.segment-active').click(ev => this._onSegmentToggleContent(ev));

        html.on('click', "[data-control]", this._handleButtonClick.bind(this));
    }

    async _handleButtonClick(event) {
        const clickedElement = $(event.currentTarget);
        const control = clickedElement.data().control;

        const relevantCombat = game.combats.combats.find(e => e.active === true);

        switch(control) {
            case 'startCombat': {
                relevantCombat.startCombat()
                this.render();
                break;
            }

            case 'endCombat': {
                break;
            }

            case 'nextTurn': {
                relevantCombat.nextTurn()
                this.render()
                break;
            }

            case 'nextRound': {
                break;
            }

            case 'previousTurn': {
                relevantCombat.previousTurn()
                this.render()
                break;
            }

            case 'previousRound': {
                break;
            }

            default:
                console.log('Invalid action detected ' + control)
                break;
        }
    }

    _onSegmentToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const segment = header.closest(".segment-container");
        const content = segment.querySelector(".segment-content");
        content.style.display = content.style.display === "none" ? "block" : "none";
    }

    async getData(options) {
        // Get the combat encounters possible for the viewed 
        const combat = this.viewed;

        const hasCombat = combat !== null;
        const combats = this.combats;
        const currentIdx = combats.findIndex(c => c === combat);
        const previousId = currentIdx > 0 ? combats[currentIdx - 1].id : null;
        const nextId = currentIdx < combats.length - 1 ? combats[currentIdx + 1].id : null;
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);

        // Prepare rendering data
        const data = {
            user: game.user,
            combats: combats,
            currentIndex: currentIdx + 1,
            combatCount: combats.length,
            hasCombat: hasCombat,
            combat,
            segments: [],
            previousId,
            nextId,
            started: this.started,
            control: false,
            settings
        };
        if (!hasCombat) return data;

        // Format information about each combatant in the encounter
        let hasDecimals = false;
        const segments = [];

        for (let i = 1; i <= 12; i++) {
            let heroTurns = [];
            if (combat.round != 1 || i == 12) {
                for (let [j, combatant] of combat.segments[i].entries()) {
                    //if (!combatant.isVisible) continue;

                    if (!combatant.visible) continue;

                    // Prepare heroTurn data
                    //const resource = combatant.permission >= CONST.ENTITY_PERMISSIONS.OBSERVER ? combatant.resource : null
                    //const resource = combatant.permission >= CONST.USER_PERMISSIONS.OBSERVER ? combatant.resource : null
                    const observer_permissions = 3
                    //const resource = combatant.permission >= observer_permissions ? combatant.resource : null
                    const resource = combatant.permission

                    const heroTurn = {
                        id: combatant.id,
                        name: combatant.name,
                        alias: combatant.alias ? combatant.alias : "",
                        img: combatant.img,
                        active: combat.segment === i && combat.turn === j,
                        owner: combatant.isOwner,
                        defeated: combatant.defeated,
                        hidden: combatant.hidden,
                        initiative: combatant.initiative,
                        hasResource: resource !== null,
                        resource: resource
                    };

                    if (Number.isFinite(heroTurn.initiative) && !Number.isInteger(heroTurn.initiative)) hasDecimals = true;
                    heroTurn.css = [
                        heroTurn.active ? "active" : "",
                        heroTurn.hidden ? "hidden" : "",
                        heroTurn.defeated ? "defeated" : ""
                    ].join(" ").trim();

                    // Cached thumbnail image for video tokens
                    if (VideoHelper.hasVideoExtension(heroTurn.img)) {
                        if (combatant._thumb) heroTurn.img = combatant._thumb;
                        else heroTurn.img = combatant._thumb = await game.video.createThumbnail(combatant.img, { width: 100, height: 100 });
                    }

                    // Actor and Token status effects
                    heroTurn.effects = new Set();
                    if (combatant.token) {
                        combatant.token.effects.forEach(e => heroTurn.effects.add(e));
                        if (combatant.token.overlayEffect) heroTurn.effects.add(combatant.token.overlayEffect);
                    }
                    if (combatant.actor) combatant.actor.temporaryEffects.forEach(e => {
                        if (e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId) heroTurn.defeated = true;
                        else if (e.data.icon) heroTurn.effects.add(e.data.icon);
                    });
                    heroTurns.push(heroTurn);
                }
            }
            segments[i] = heroTurns;
        }

        // Format initiative numeric precision
        // const precision = CONFIG.Combat.initiative.decimals;
        // segments.forEach(s => s.forEach(t => {
        //     if (t.initiative !== null) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
        // }));

        let activeSegments = [];

        for (let i = 1; i <= 12; i++) {
            activeSegments[i] = combat.segment === i;
        }

        // Merge update data for rendering
        return foundry.utils.mergeObject(data, {
            round: combat.round,
            heroTurn: combat.turn,
            segments: segments,
            // segments:game.combats.combats.find(e => e.active === true).segments,
            activeSegments: activeSegments,
            control: combat.combatant?.players?.includes(game.user)
        });
    }
}