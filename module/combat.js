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

        this.current = this.current || {
            round: null,
            segment: null,
            turn: null,
            tokenId: null,
            combatantId: null
        };

        this.previous = this.previous || {
            round: null,
            segment: null,
            turn: null,
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
     * Get the Combatant who has the current turn.
     * @type {Combatant}
     */
    get combatant() {
        return this.segment ? this.currentSegment[this.data.turn] : undefined;
    }

    /* -------------------------------------------- */

    /**
     * The numeric round of the Combat encounter
     * @type {number}
     */
    get round() {
        return Math.max(this.data.round, 0);
    }

    get segment() {
        return Math.max(this.data.segment, 1);
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
    get scene() {
        return game.scenes.get(this.data.scene) || game.scenes.current || undefined;
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
        return (this.segments.length > 0) && (this.round > 0);
    }

    /* -------------------------------------------- */

    /**
     * The numeric turn of the combat round in the Combat encounter
     * @type {number}
     */
    get turn() {
        return Math.max(this.data.turn, 0);
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    get visible() {
        return true;
    }

    /* -------------------------------------------- */

    /**
     * Advance the combat to the next round
     * @return {Promise<Combat>}
     */
    async nextRound() {
        let segment = 1;
        let turn = 0;
        let found = false;
        if (this.settings.skipDefeated) {
            for (let i = 1; i <= 12 && !found; i++) {
                for (let j = 0; j < this.segments[i].length && !found; j++) {
                    let t = this.segments[i][j];
                    if (!(t.data.defeated || t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId))) {
                        segment = i;
                        turn = j;
                        found = true;
                    }
                }
            }
            if (turn === -1) {
                ui.notifications.warn("COMBAT.NoneRemaining", { localize: true });
                turn = 0;
            }
        } else {
            for (let i = 1; i <= 12; i++) {
                if (this.segments[i].length > 0) {
                    segment = i;
                    break;
                }
            }
        }

        //let advanceTime = Math.max(this.turns.length - this.data.turn, 1) * CONFIG.time.turnTime;
        let advanceTime = Math.max(this.segments.length - this.data.segment, 1) * CONFIG.time.segmentTime
        advanceTime += CONFIG.time.roundTime;
        return await this.update({ round: this.round + 1, segment: segment, turn: turn }, { advanceTime });
    }

    async nextSegment() {
        let segment = this.segment;
        let skip = this.settings.skipDefeated;

        // Determine the next turn number
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
                if (i <= this.segment) continue;
                nextTurn = (s.findIndex(t => {
                    return true;
                }));
                if (nextTurn === -1) continue;
                next = i;
                break;
            }
        }

        // Maybe advance to the next round
        let round = this.round;
        if ((this.round === 0) || (next === null) || (next >= this.segments.length)) {
            return this.nextRound();
        }

        // Update the encounter
        const advanceTime = CONFIG.time.segmentTime;
        return this.update({ round: round, segment: next, turn: nextTurn }, { advanceTime });
    }

    /* -------------------------------------------- */

    /**
     * Advance the combat to the next turn
     * @return {Promise<Combat>}
     */
    async nextTurn() {
        let turn = this.turn;
        let skip = this.settings.skipDefeated;

        // Determine the next turn number
        let next = null;
        if (skip) {
            for (let [i, t] of this.segments[this.segment].entries()) {
                if (i <= turn) continue;
                if (t.data.defeated) continue;
                if (t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId)) continue;
                next = i;
                break;
            }
        }
        else next = turn + 1;

        // Maybe advance to the next round
        let round = this.round;
        if ((this.round === 0) || (next === null) || (next >= this.segments[this.segment].length)) {
            return this.nextSegment();
        }

        // Update the encounter
        const advanceTime = CONFIG.time.turnTime;
        return this.update({ round: round, turn: next }, { advanceTime });
    }

    /* -------------------------------------------- */

    /** @override */
    prepareDerivedData() {
        if (this.combatants.size && !this.segments?.length) this.setupTurns();
    }

    /* -------------------------------------------- */

    /**
     * Rewind the combat to the previous round
     * @return {Promise<Combat>}
     */
    async previousRound() {
        let segment = (this.round === 0) ? 0 : Math.max(this.segments.length - 1, 0);
        if (this.round === 1) segment = 12;
        let turn = (this.round === 0) ? 0 : Math.max(this.segments[segment].length - 1, 0);
        const round = Math.max(this.round - 1, 0);
        let advanceTime = -1 * this.data.turn * CONFIG.time.turnTime;
        if (round > 0) advanceTime -= CONFIG.time.roundTime;
        return this.update({ round, segment, turn }, { advanceTime });
    }

    async previousSegment() {
        if (this.turn === 0 && this.round === 0) return this;

        let previousSegment = -1;

        for (let i = this.segment - 1; i >= 1; i--) {
            if (this.segments[i].length > 0) {
                previousSegment = i;
                break;
            }
        }

        if (previousSegment < 1 || this.round === 1) return this.previousRound();

        const advanceTime = -1 * CONFIG.time.segmentTime;
        return this.update({ segment: previousSegment, turn: this.segments[previousSegment].length - 1 }, { advanceTime });
    }

    /* -------------------------------------------- */

    /**
     * Rewind the combat to the previous turn
     * @return {Promise<Combat>}
     */
    async previousTurn() {
        if (this.turn === 0 && this.round === 0) return this;
        else if (this.turn <= 0) return this.previousSegment();
        const advanceTime = -1 * CONFIG.time.turnTime;
        return this.update({ turn: this.turn - 1 }, { advanceTime });
    }

    /* -------------------------------------------- */

    /**
     * Reset all combatant initiative scores, setting the turn back to zero
     * @return {Promise<Combat>}
     */
    async resetAll() {
        for (let c of this.combatants) {
            c.data.update({ initiative: null });
        }
        return this.update({ turn: 0, combatants: this.combatants.toJSON() }, { diff: false });
    }

    /* -------------------------------------------- */

    /**
     * Roll initiative for one or multiple Combatants within the Combat entity
     * @param {string|string[]} ids     A Combatant id or Array of ids for which to roll
     * @param {object} [options={}]     Additional options which modify how initiative rolls are created or presented.
     * @param {string|null} [options.formula]         A non-default initiative formula to roll. Otherwise the system default is used.
     * @param {boolean} [options.updateTurn=true]     Update the Combat turn after adding new initiative scores to keep the turn on the same Combatant.
     * @param {object} [options.messageOptions={}]    Additional options with which to customize created Chat Messages
     * @return {Promise<Combat>}        A promise which resolves to the updated Combat entity once updates are complete.
     */
    async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant.id;
        const rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");

        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        for (let [i, id] of ids.entries()) {

            // Get Combatant data (non-strictly)
            const combatant = this.combatants.get(id);
            if (!combatant?.isOwner) return results;

            // Produce an initiative roll for the Combatant
            const roll = combatant.getInitiativeRoll(formula);
            updates.push({ _id: id, initiative: roll.total });

            // Construct chat message data
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

            // Play 1 sound for the whole rolled set
            if (i > 0) chatData.sound = null;
            messages.push(chatData);
        }
        if (!updates.length) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Ensure the turn order remains with the same combatant
        if (updateTurn) {
            await this.update({ turn: this.segments[this.segment].findIndex(t => t.id === currentId) });
        }

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
     * Update the Combat turn order to maintain the same combatant as the current turn.
     * @param {string} id         The combatant ID for which to set initiative
     * @param {number} value      A specific initiative value to set
     */
    async setInitiative(id, value) {
        const currentId = this.combatant.id;
        const combatant = this.combatants.get(id, { strict: true });
        await combatant.update({ initiative: value });
        await this.update({ turn: this.segments[this.segment].findIndex(c => c.id === currentId) });
    }

    /* -------------------------------------------- */

    /**
     * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
     * @return {Combatant[]}
     */
    setupTurns() {
        // Determine the turn order and the current turn
        const turnSet = this.combatants.contents.sort(this._sortCombatants);

        let segments = [];
        for (let i = 1; i <= 12; i++) {
            segments[i] = [];

            for (let j = 0; j < turnSet.length; j++) {
                if (HeroSystem6eCombat.hasPhase(turnSet[j].actor.data.data.characteristics.spd.value, i)) {
                    segments[i].push(turnSet[j]);
                }
            }
        }

        this.data.segment = Math.clamped(this.data.segment, 1, 12) || 12;
        this.data.turn = Math.clamped(this.data.turn, 0, segments[this.data.segment].length - 1);

        // Update state tracking
        let c = segments[this.data.segment][this.data.turn];
        this.current = {
            round: this.data.round,
            segment: this.data.segment,
            turn: this.data.turn,
            combatantId: c ? c.id : null,
            tokenId: c ? c.data.tokenId : null
        };

        let success = this.segments = segments;

        if (success) {
            this.rollAll();
        }

        return success;
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
     * Begin the combat encounter, advancing to round 1 and turn 1
     * @return {Promise<Combat>}
     */
    async startCombat() {
        return this.update({ round: 1, segment: 12, turn: 0 });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);

        if (data.hasOwnProperty("segment")) {
            this.data.segment = data.segment;
        }

        // Set up turn data
        if (["combatants", "round", "segment", "turn"].some(k => data.hasOwnProperty(k))) {
            if (data.combatants) this.setupTurns();
            else {
                const c = this.combatant;
                this.previous = this.current;
                this.current = {
                    round: this.data.round,
                    segment: this.data.segment,
                    turn: this.data.turn,
                    combatantId: c ? c.id : null,
                    tokenId: c ? c.data.tokenId : null
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

        // Update the turn order and adjust the combat to keep the combatant the same
        const current = this.combatant;
        this.setupTurns();

        // Keep the current Combatant the same after adding new Combatants to the Combat
        if (current) {
            let turn = Math.max(this.segments[this.segment].findIndex(t => t.id === current.id), 0);
            if (game.user.id === userId) this.update({ turn });
            else this.data.update({ turn });
        }

        // Render the collection
        if (this.data.active) this.collection.render();
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onUpdateEmbeddedDocuments(...args) {
        super._onUpdateEmbeddedDocuments(...args);
        this.setupTurns();
        if (this.data.active) this.collection.render();
    }

    _onActorDataUpdate() {
        this.setupTurns();
        if (this.data.active) this.collection.render();
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        this.render(false, { renderContext: `delete${embeddedName}` });

        // Update the turn order and adjust the combat to keep the combatant the same (unless they were deleted)
        const current = this.combatant;
        const nextSurvivor = this.segments[this.segment].find((i, t) => {
            return !result.includes(t.id) && (i >= this.turn) && !t.data.defeated;
        });
        this.setupTurns();

        // If the current combatant was removed, update the turn order to the next survivor
        let turn = this.data.turn;
        if (result.includes(current.id)) {
            if (nextSurvivor) turn = this.segments[this.segment].findIndex(t => t.id === nextSurvivor.id);
        }

        // Otherwise keep the combatant the same
        else turn = this.segments[this.segment].findIndex(t => t.id === current.id);

        // Update database or perform a local override
        turn = Math.max(turn, 0);
        if (game.user.id === userId) this.update({ turn });
        else this.data.update({ turn });

        // Render the collection
        if (this.data.active) this.collection.render();
    }
}

export class HeroSystem6eCombatTracker extends CombatTracker {
    static get defaultOptions() {
        var path = "systems/hero6e-foundryvtt-experimental/templates/combat/combat-tracker.html";
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: path,
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.segment-active').click(ev => this._onSegmentToggleContent(ev));
    }

    _onSegmentToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const segment = header.closest(".segment-container");
        const content = segment.querySelector(".segment-content");
        content.style.display = content.style.display === "none" ? "block" : "none";
    }

    async getData(options) {
        // Get the combat encounters possible for the viewed Scene
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
            let turns = [];
            if (combat.round != 1 || i == 12) {
                for (let [j, combatant] of combat.segments[i].entries()) {
                    if (!combatant.isVisible) continue;

                    // Prepare turn data
                    const resource = combatant.permission >= CONST.ENTITY_PERMISSIONS.OBSERVER ? combatant.resource : null
                    const turn = {
                        id: combatant.id,
                        name: combatant.name,
                        img: combatant.img,
                        active: combat.segment === i && combat.turn === j,
                        owner: combatant.isOwner,
                        defeated: combatant.data.defeated,
                        hidden: combatant.hidden,
                        initiative: combatant.initiative,
                        hasResource: resource !== null,
                        resource: resource
                    };
                    if (Number.isFinite(turn.initiative) && !Number.isInteger(turn.initiative)) hasDecimals = true;
                    turn.css = [
                        turn.active ? "active" : "",
                        turn.hidden ? "hidden" : "",
                        turn.defeated ? "defeated" : ""
                    ].join(" ").trim();

                    // Cached thumbnail image for video tokens
                    if (VideoHelper.hasVideoExtension(turn.img)) {
                        if (combatant._thumb) turn.img = combatant._thumb;
                        else turn.img = combatant._thumb = await game.video.createThumbnail(combatant.img, { width: 100, height: 100 });
                    }

                    // Actor and Token status effects
                    turn.effects = new Set();
                    if (combatant.token) {
                        combatant.token.data.effects.forEach(e => turn.effects.add(e));
                        if (combatant.token.data.overlayEffect) turn.effects.add(combatant.token.data.overlayEffect);
                    }
                    if (combatant.actor) combatant.actor.temporaryEffects.forEach(e => {
                        if (e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId) turn.defeated = true;
                        else if (e.data.icon) turn.effects.add(e.data.icon);
                    });
                    turns.push(turn);
                }
            }
            segments[i] = turns;
        }

        // Format initiative numeric precision
        const precision = CONFIG.Combat.initiative.decimals;
        segments.forEach(s => s.forEach(t => {
            if (t.initiative !== null) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
        }));

        let activeSegments = [];

        for (let i = 1; i <= 12; i++) {
            activeSegments[i] = combat.segment === i;
        }

        // Merge update data for rendering
        return foundry.utils.mergeObject(data, {
            round: combat.data.round,
            turn: combat.data.turn,
            segments: segments,
            activeSegments: activeSegments,
            control: combat.combatant?.players?.includes(game.user)
        });
    }
}