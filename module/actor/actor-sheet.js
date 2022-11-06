import { HeroSystem6eItem } from "../item/item.js"
import { HeroSystem6eAttackCard } from "../card/attack-card.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HeroSystem6eActorSheet extends ActorSheet {

	/** @override */
	static get defaultOptions() {
		var path = "systems/hero6e-foundryvtt-experimental/templates/actor/actor-sheet.html";

		return mergeObject(super.defaultOptions, {
			classes: ["herosystem6e", "sheet", "actor"],
			template: path,
			width: 800,
			height: 700,
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

		const characteristicSet = [];

		for (let [key, characteristic] of Object.entries(actorData.data.characteristics)) {
			characteristic.key = key;
			characteristic.name = CONFIG.HERO.characteristics[key];

			let type = "other";

			if (characteristic.type != undefined) {
				type = characteristic.type;
			}

			if (characteristicSet[type] === undefined) {
				characteristicSet[type] = [];
			}

			if (type === 'rollable') {
				if (characteristic.value === 0) {
					characteristic.roll = 8;
				} else if (characteristic.value <= 2) {
					characteristic.roll = 9;
				} else if (characteristic.value <= 7) {
					characteristic.roll = 10;
				} else if (characteristic.value <= 12) {
					characteristic.roll = 11;
				} else if (characteristic.value <= 17) {
					characteristic.roll = 12;
				} else if (characteristic.value <= 22) {
					characteristic.roll = 13;
				} else if (characteristic.value <= 27) {
					characteristic.roll = 14;
				} else if (characteristic.value <= 32) {
					characteristic.roll = 15;
				} else if (characteristic.value <= 37) {
					characteristic.roll = 16;
				} else if (characteristic.value <= 42) {
					characteristic.roll = 17;
				} else if (characteristic.value <= 47) {
					characteristic.roll = 18;
				} else if (characteristic.value <= 52) {
					characteristic.roll = 19;
				} else {
					characteristic.roll = 20;
				}
			}

			characteristicSet[type].push(characteristic);
		}

		// Initialize containers.
		const skills = [];
		const attacks = [];
		const defenses = [];
		const powers = [];

		let orphanedSkills = [];
		let skillIndex = [];

		// Iterate through items, allocating to containers
		// let totalWeight = 0;
		for (let i of sheetData.items) {
			let item = i.data;
			i.img = i.img || DEFAULT_TOKEN;
			// Append to skills.
			if (i.type === 'skill') { 
				i.characteristic = CONFIG.HERO.skillCharacteristics[item.characteristic];
				i.roll = item.roll;
				i.rollable = item.rollable;

				if (!item.parentid) {
					skills.push(i);
					skillIndex[item.hdcid] = i;

					if (orphanedSkills[item.hdcid]) {
						i.children = orphanedSkills[item.hdcid];
                    }
				} else {
					if (skillIndex[item.parentid]) {
						if (!skillIndex[item.parentid].children) {
							skillIndex[item.parentid].children = [];
						}

						skillIndex[item.parentid].children.push(i);
					} else {
						if (!orphanedSkills[item.parentid]) {
							orphanedSkills[item.parentid] = [];
						}

						orphanedSkills[item.parentid].push(i);
                    }
                }
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
			else if (i.type === 'power') {
				powers.push(i);
			}
		}

		// Assign and return
		sheetData.skills = skills;
		sheetData.defenses = defenses;
		sheetData.attacks = attacks;
		sheetData.powers = powers;
		sheetData.characteristicSet = characteristicSet;
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
		html.find('.recovery-button').click(this._onRecovery.bind(this));
		html.find('.upload-button').change(this._uploadCharacterSheet.bind(this));

		// Drag events for macros.
		if (this.actor.isOwner) {
			let handler = ev => this._onDragStart(ev);
			html.find('li.item').each((i, li) => {
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}

		html.find('input').each((id, inp) => {
			this.changeValue = function(e) {
				if (e.code === "Enter") {
					if (isNaN(parseInt(e.target.value))) {
						return
					}

					let changes = []
					changes[`data.characteristics.${e.target.name}`] = e.target.value
					this.actor.data.update(changes);
				}
			}

			inp.addEventListener("keydown", this.changeValue.bind(this));
		})
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
		return await HeroSystem6eItem.create(itemData, { parent: this.actor });
	}

	async _onItemAttack(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest(".item").dataset.itemId;
		const item = this.actor.items.get(itemId);

		let rollMode = "core";
		let createMessage = true;
		let createChatMessage = true;

		/*
		const attackCard = await HeroSystem6eAttackCard.createChatDataFromItem(item);
		ChatMessage.applyRollMode(attackCard, rollMode || game.settings.get("core", "rollMode"));
		return createMessage ? ChatMessage.create(attackCard) : attackCard;
		*/

		//let heroItem = new HeroSystem6eItem();
		//heroItem.name = item.name;

		//return heroItem.displayCard({ rollMode, createChatMessage });

		item.displayCard = displayCard;

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

		let charRoll = parseInt(element.innerText.slice(0, -1));

		if (dataset.roll) {
			var actor = this.actor;			

			let roll = new Roll(dataset.roll, this.actor.getRollData());
			roll.evaluate().then(function(result) {
				console.log(actor.data.data.characteristics[dataset.label])
				//let margin = actor.data.data.characteristics[dataset.label].roll - result.total;
				let margin = charRoll - result.total;
				
				result.toMessage({
					speaker: ChatMessage.getSpeaker({ actor: actor }),
					flavor: dataset.label.toUpperCase() + " roll " + (margin >= 0 ? "succeeded" : "failed") + " by " + Math.abs(margin),
					borderColor: margin >= 0  ? 0x00FF00 : 0xFF0000		
				});
			});
		}
	}

	_onRollSkill(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll) {
			let roll = new Roll("3D6", this.actor.getRollData());
			let result = roll.roll();
			let item = this.actor.items.get(dataset.label);
			let margin = dataset.roll - roll.total;
			result.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: item.name.toUpperCase() + " roll " + (margin >= 0 ? "succeeded" : "failed") + " by " + Math.abs(margin),
				borderColor: margin >= 0 ? 0x00FF00 : 0xFF0000,
			});
		}
	}

	async _onRecovery(event) {
		console.log("recovery")

		let newStun = this.actor.data.data.stun.value + this.actor.data.data.characteristics['rec'].value;
		let newEnd = this.actor.data.data.end.value + this.actor.data.data.characteristics['rec'].value;

		if (newStun > this.actor.data.data.stun.max) {
			newStun = this.actor.data.data.stun.max
        }

		if (newEnd > this.actor.data.data.end.max) {
			newEnd = this.actor.data.data.end.max
		}

		await this.actor.update({
			"data.stun.value": newStun,
			"data.end.value": newEnd,
		});
	}

	async _uploadCharacterSheet(event) {
		var file = event.target.files[0];
		if (!file) {
			return;
		}
		var reader = new FileReader();
		reader.onload = function (event) {
			var contents = event.target.result;

			let parser = new DOMParser();
			let xmlDoc = parser.parseFromString(contents, "text/xml");
			this._applyCharacterSheet(xmlDoc);
		}.bind(this);
		reader.readAsText(file);
	}

	_applyCharacterSheet(sheet) {
		this._applyCharacterSheetAsync(sheet);
    }

	async _applyCharacterSheetAsync(sheet) {

		let characterInfo = sheet.getElementsByTagName("CHARACTER_INFO")[0];
		let characteristics = sheet.getElementsByTagName("CHARACTERISTICS")[0];
		let skills = sheet.getElementsByTagName("SKILLS")[0];

		//let elementsToLoad = ["POWERS", "PERKS", "TALENTS", "MARTIALARTS", "DISADVANTAGES"]

		let changes = [];

		if (characterInfo.hasAttribute("CHARACTER_NAME")) {
			changes["name"] = characterInfo.getAttribute("CHARACTER_NAME");
        }

		//changes['data.characteristics.flying.value'] = 0;

		var value; 
		for (let characteristic of characteristics.children) {
			let key = CONFIG.HERO.characteristicsXMLKey[characteristic.getAttribute("XMLID")];
			value = CONFIG.HERO.characteristicDefaults[key] + parseInt(characteristic.getAttribute("LEVELS"));

			changes[`data.characteristics.${key}.value`] = value;
			changes[`data.characteristics.${key}.current`] = value;
			changes[`data.characteristics.${key}.max`] = value;
		}

		await this.actor.update(changes);

		for (let item of this.actor.items) {
			if (item.type !== 'attack') {		
				await item.delete()
			}
		}

		for (let skill of skills.children) {
			const xmlid = skill.getAttribute("XMLID");

			let description = skill.getAttribute("ALIAS");

			if (xmlid == "KNOWLEDGE_SKILL" || xmlid == "PROFESSIONAL_SKILL" || xmlid == "SCIENCE_SKILL") {
				if (skill.hasAttribute("INPUT")) {
					description += ": " + skill.getAttribute("INPUT");
                }
			}

			let name = "";
 
			if (skill.hasAttribute("NAME") && skill.getAttribute("NAME") != "") {
				name = skill.getAttribute("NAME");
			} else {
				name = description;
			}

			const type = "skill";
			const data = {
				"levels": CONFIG.HERO.characteristicsXMLKey[skill.getAttribute("LEVELS")],
				"state": "trained"
			};

			data["description"] = description;

			if (skill.attributes.getNamedItem("CHARACTERISTIC")) {
				data["characteristic"] = CONFIG.HERO.characteristicsXMLKey[skill.getAttribute("CHARACTERISTIC")];
			} else {
				data["characteristic"] = "";
            }

			if (skill.attributes.getNamedItem("FAMILIARITY")) {
				if (skill.getAttribute("FAMILIARITY") == "Yes") {
					data["state"] = "familiar";

					if (skill.getAttribute("EVERYMAN") == "Yes") {
						data["state"] = "everyman";
					}
				}

				if (skill.getAttribute("PROFICIENCY") == "Yes") {
					data["state"] = "proficient";
				}
			} else {
				data["state"] = "noroll";
            }

			if (xmlid == "PROFESSIONAL_SKILL") data["ps"] = true;

			if (skill.hasAttribute("PARENTID")) {
				data["parentid"] = skill.getAttribute("PARENTID");
			}

			if (skill.hasAttribute("ID")) {
				data["hdcid"] = skill.getAttribute("ID");
			}

			const itemData = {
				name: name,
				type: type,
				data: data,
			};

			await HeroSystem6eItem.create(itemData, { parent: this.actor });
		}

		function loadPower(actor, itemData, xmlid, sheet) {
			let newValue = undefined;

			switch(xmlid) {
				case "SWIMMING":
					newValue = parseFloat(actor.data.data.characteristics.swimming.value) + parseFloat(itemData.levels)
					actor.setCharacteristic('swimming.value', newValue)
					break;
				case "LEAPING":
					newValue = parseFloat(actor.data.data.characteristics.leaping.value) + parseFloat(itemData.levels)
					actor.setCharacteristic('leaping.value', newValue)
					break;
				case "FLIGHT":
					newValue = parseFloat(itemData.levels)
					actor.setCharacteristic('flying.value', newValue)
					break;
				case "RUNNING":
					newValue = parseFloat(actor.data.data.characteristics.running.value) + parseFloat(itemData.levels)
					actor.setCharacteristic('running.value', newValue)
					break;
				default:
					console.log(xmlid);
					break;
			}
		}

		let powers = sheet.getElementsByTagName("POWERS")[0];
		
		const relevantFields = ["BASECOST", "LEVELS", "ALIAS", "MULTIPLIER", "NAME", "OPTION_ALIAS"]
		for (let power of powers.children) {
			let xmlid = power.getAttribute("XMLID");
			let name = power.getAttribute("NAME");
			let alias = power.getAttribute("ALIAS");
			let levels = power.getAttribute("LEVELS");

			let itemName = name;
			if (name === undefined || name === "") {
				itemName = alias
			}

			let data = []

			for (let attribute of power.attributes) {
				const attName = attribute.name

				if (relevantFields.includes(attName)) {
					const attValue = attribute.value

					data[attName] = attValue
				}
			}

			let modifiers = [];
			for (let modifier of power.children) {
				let xmlidModifier = modifier.getAttribute("XMLID");

				if (xmlidModifier !== null) {
					modifiers.push(xmlidModifier);
				}
			}
			data.modifiers = modifiers;

			data.description = alias;

			if (CONFIG["POWERS"][xmlid.toUpperCase()] !== undefined) {
				data.rules = "/powers " + xmlid.toLowerCase();
			}
			else {
				data.rules = "undefined";
			}

			const itemData = {
				name: itemName,
				type: "power",
				data: data,
				levels: levels
			};

			await HeroSystem6eItem.create(itemData, { parent: this.actor });

			loadPower(this.actor, itemData, xmlid, sheet);
		}
    }
}

async function displayCard({ rollMode, createMessage = true } = {}) {
	switch (this.data.type) {
		case "attack":
			const attackCard = await HeroSystem6eAttackCard.createChatDataFromItem(this);
			ChatMessage.applyRollMode(attackCard, rollMode || game.settings.get("core", "rollMode"));
			return createMessage ? ChatMessage.create(attackCard) : attackCard;
	}
}