/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HeroSystem6eActorSheet extends ActorSheet {

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["herosystem6e", "sheet", "actor"],
			template: "systems/herosystem6e/templates/actor/actor-sheet.html",
			width: 800,
			height: 600,
			tabs: [
				{ navSelector: ".sheet-item-tabs", contentSelector: ".sheet-body", initial: "description" },
				{ navSelector: ".sheet-edit-tabs", contentSelector: ".sheet-mode", initial: "play" },
			]
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		const data = super.getData();
		data.dtypes = ["String", "Number", "Boolean"];

		const actorData = this.actor.data.toObject(false);
		data.actor = actorData;
		data.data = actorData.data;
		data.rollData = this.actor.getRollData.bind(this.actor);

		data.items = actorData.items;
		data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

		// Prepare items.
		if (this.actor.data.type == 'character') {

			console.log(data);

			this._prepareCharacterItems(data);
		}

		return data;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareCharacterItems(sheetData) {
		const actorData = sheetData.actor;

		const characteristicSet = []

		this._prepareResource(actorData.data.body);
		this._prepareResource(actorData.data.stun);
		this._prepareResource(actorData.data.end);

		for (let [key, characteristic] of Object.entries(actorData.data.characteristics)) {
			characteristic.key = key;
			characteristic.name = CONFIG.HERO.characteristics[key];

			this._prepareCharacteristic(characteristic);

			let type = "other";

			if (characteristic.type != undefined) {
				type = characteristic.type;
			}

			if (characteristicSet[type] === undefined) {
				characteristicSet[type] = [];
			}

			characteristicSet[type].push(characteristic);
        }

		// Initialize containers.
		const skills = [];
		const attacks = [];
		const defenses = [];

		// Iterate through items, allocating to containers
		// let totalWeight = 0;
		for (let i of sheetData.items) {
			let item = i.data;
			i.img = i.img || DEFAULT_TOKEN;
			// Append to skills.
			if (i.type === 'skill') {
				i.characteristic = CONFIG.HERO.skillCharacteristics[item.characteristic];
				i.roll = item.roll;
				skills.push(i);
			}
			else if (i.type === 'defense') {
				HeroSystem6eActorSheet._prepareDefenseItem(i, item);
				defenses.push(i);
			}
			else if (i.type === 'attack') {
				i.data = item;
				i.defense = CONFIG.HERO.defenseTypes[item.defense];
				i.piercing = item.piercing;
				i.penetrating = item.penetrating;
				i.advantages = item.advantages;
				i.uses = CONFIG.HERO.attacksWith[item.uses];
				i.targets = CONFIG.HERO.defendsWith[item.targets];
				i.end = item.end;

				i.damage = item.dice;

				switch (item.extraDice) {
					case 'zero':
						i.damage += "D6";
						break;
					case 'pip':
						i.damage += "D6+1";
						break;
					case 'half':
						i.damage += ".5D6"
						break;
				}

				if (item.killing) {
					i.damage += "K";
				} else {
					i.damage += "N";
                }

				attacks.push(i);
			}
		}

		// Assign and return
		sheetData.skills = skills;
		sheetData.defenses = defenses;
		sheetData.attacks = attacks;
		sheetData.characteristicSet = characteristicSet;
	}

	_prepareCharacteristic(characteristic) {
		characteristic.current = characteristic.value;

		if (characteristic.modifier) {
			characteristic.current *= characteristic.modifier;
		}

		characteristic.current = Math.round(characteristic.current);
	}

	_prepareResource(characteristic) {
		characteristic.max = characteristic.value;
	}

	static _prepareDefenseItem(i, item) {
		i.defenseType = CONFIG.HERO.defenseTypes[item.defenseType];
		i.active = item.active;
		i.resistant = CONFIG.HERO.bool[item.resistant];
		i.hardened = item.hardened;
		i.impenetrable = item.impenetrable;
		i.value = item.value;
    }


	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Add Inventory Item
		html.find('.item-create').click(this._onItemCreate.bind(this));

		// Update Inventory Item
		html.find('.item-edit').click(ev => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find('.item-delete').click(ev => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

		// Rollable abilities.
		html.find('.rollable-characteristic').click(this._onRollCharacteristic.bind(this));
		html.find('.rollable-skill').click(this._onRollSkill.bind(this));
		html.find('.item-attack').click(this._onItemAttack.bind(this));
		html.find('.item-toggle').click(this._onItemToggle.bind(this));

		// Drag events for macros.
		if (this.actor.isOwner) {
			let handler = ev => this._onDragStart(ev);
			html.find('li.item').each((i, li) => {
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data["type"];

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
	}

	async _onItemAttack(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest(".item").dataset.itemId;
		const item = this.actor.items.get(itemId);
		let rollMode = "core";
		let createChatMessage = true;
		return item.displayCard({ rollMode, createChatMessage });
	}

	async _onItemToggle(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest(".item").dataset.itemId;
		const item = this.actor.items.get(itemId);
		const attr = "data.active";
		return item.update({ [attr]: !getProperty(item.data, attr) });
    }

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRollCharacteristic(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll) {
			let roll = new Roll(dataset.roll, this.actor.getRollData());
			let result = roll.roll();
			let margin = this.actor.data.data.characteristics[dataset.label].roll - roll.total;
			result.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: dataset.label.toUpperCase() + " roll " + (margin >= 0 ? "succeeded" : "failed") + " by " + Math.abs(margin),
				borderColor: margin >= 0  ? 0x00FF00 : 0xFF0000
			});
		}
	}

	_onRollSkill(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll) {
			let roll = new Roll(dataset.roll, this.actor.getRollData());
			let result = roll.roll();
			let margin = this.actor.items[dataset.label].roll - roll.total;
			result.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: dataset.label.toUpperCase() + " roll " + (margin >= 0 ? "succeeded" : "failed") + " by " + Math.abs(margin),
				borderColor: margin >= 0 ? 0x00FF00 : 0xFF0000
			});
		}
	}
}
