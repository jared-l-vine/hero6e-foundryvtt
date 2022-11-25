import { HeroSystem6eItem } from "../item/item.js";
import { HeroSystem6eAttackCard } from "../card/attack-card.js";
import { createSkillPopOutFromItem } from "../skill/skill.js";
import { editSubItem, deleteSubItem } from "../powers/powers.js";

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
		const maneuvers= [];

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
				i.toHitMod = item.toHitMod;
				i.knockback = item.knockback;
				i.usesStrength = item.usesStrength;

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
			else if (i.type === 'maneuver') {
				maneuvers.push(i);
			}
		}

		// Assign and return
		sheetData.skills = skills;
		sheetData.defenses = defenses;
		sheetData.attacks = attacks;
		sheetData.powers = powers;
		sheetData.maneuvers = maneuvers;
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

		// Update Power Inventory Item
		html.find('.power-item-edit').click(this._onEditPowerItem.bind(this));
	
		// Delete Power Inventory Item
		html.find('.power-item-delete').click(this._onDeletePowerItem.bind(this));

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
				if (e.code === "Enter" || e.code === "Tab") {
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
		let item = this.actor.items.get(itemId);

		let rollMode = "core";
		let createChatMessage = true;

		if (item === undefined) {
			// item is power or equipment
			item = this.actor.items.get(event.currentTarget.id.split(" ")[0])

			item.displayCard = displayCard;
			return item.displayCard({ rollMode, createChatMessage }, event.currentTarget.id.split(" ")[1])			
		}

		item.displayCard = displayCard;

		return item.displayCard({ rollMode, createChatMessage });
	}

	async _onItemToggle(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest(".item").dataset.itemId;
		const item = this.actor.items.get(itemId);
		const attr = "data.active";
		let newValue = !getProperty(item.data, "data.active")

		// only have one combat maneuver selected at a time except for Set or Brace
		if(newValue && item.type === "maneuver") {
			if (newValue) {
				let exceptions = ["Set", "Brace"]

				for (let i of this.actor.items) {
					if (i.type === "maneuver" && i.id !== itemId) {
						if (!exceptions.includes(i.name) || item.name.includes("Move")) {
							await i.update({ [attr]: false });
						}
					}
				}
			}
		}

		await item.update({ [attr]: newValue });

		if (item.type === "maneuver") {
			await updateCombatAutoMod(this.actor, item);
		}

		return;
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

	async _onRollSkill(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		let item = this.actor.items.get(dataset.label);


		createSkillPopOutFromItem(item)
	}

	async _onRecovery(event) {
		let chars = this.actor.data.data.characteristics

		let newStun = parseInt(chars.stun.value) + parseInt(chars.rec.value);
		let newEnd = parseInt(chars.end.value) + parseInt(chars.rec.value);

		if (newStun > chars.stun.max) {
			newStun = chars.stun.max
        }

		if (newEnd > chars.end.max) {
			newEnd = chars.end.max
		}

		await this.actor.update({
			"data.characteristics.stun.value": newStun,
			"data.characteristics.end.value": newEnd,
		});

		const chatData = {
            user: game.user.data._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: this.actor.name + " recovers!",
            speaker: this.actor.token,
        };

        return ChatMessage.create(chatData);
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

		changes['data.characteristics.flying.value'] = 0;

		var value; 
		for (let characteristic of characteristics.children) {
			let key = CONFIG.HERO.characteristicsXMLKey[characteristic.getAttribute("XMLID")];
			value = CONFIG.HERO.characteristicDefaults[key] + parseInt(characteristic.getAttribute("LEVELS"));

			changes[`data.characteristics.${key}.value`] = value;
			changes[`data.characteristics.${key}.max`] = value;
			changes[`data.characteristics.${key}.base`] = value;
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
				"levels": skill.getAttribute("LEVELS"),
				"state": "trained"
			};

			data["description"] = description;

			if (skill.attributes.getNamedItem("CHARACTERISTIC")) {
				data["characteristic"] = skill.getAttribute("CHARACTERISTIC");
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

			// determine Skill Roll
			if (data.state === "everyman") {
				data["roll"] = "8-";
			} else if (data.state === "familiar") {
				data["roll"] = "8-";			
			} else if (data.state === "proficient") {
				data["roll"] = "10-";			
			} else if (data.state === "trained") {
				let charValue = this.actor.data.data.characteristics[`${data.characteristic.toLowerCase()}`].value;
				let rollVal = 9 + Math.round(charValue / 5) + parseInt(data.levels);
				data["roll"] = rollVal.toString() + "-";
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

			let changes = {};

			switch(xmlid) {
				case "SWIMMING":
					newValue = parseFloat(actor.data.data.characteristics.swimming.value) + parseFloat(itemData.levels)
					changes['data.characteristics.swimming.value'] = newValue;
					break;
				case "LEAPING":
					newValue = parseFloat(actor.data.data.characteristics.leaping.value) + parseFloat(itemData.levels)
					changes['data.characteristics.leaping.value'] = newValue;
					break;
				case "FLIGHT":
					newValue = parseFloat(itemData.levels)
					changes['data.characteristics.flying.value'] = newValue;
					break;
				case "RUNNING":
					newValue = parseFloat(actor.data.data.characteristics.running.value) + parseFloat(itemData.levels)
					changes['data.characteristics.running.value'] = newValue;
					break;
				default:
					console.log(xmlid);
					break;
			}

			actor.update(changes);
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

		// combat maneuvers
		async function loadCombatManeuvers(dict, actor) {
			for (const entry of Object.entries(dict)) {
				let v = entry[1];
				const itemData = {
					name: entry[0],
					type: "maneuver",
					data: {
						phase: v[0],
						ocv: v[1],
						dcv: v[2],
						effects: v[3],
						active: false,
					},
				};
				
				await HeroSystem6eItem.create(itemData, { parent: actor });
			}
		}

		await loadCombatManeuvers(CONFIG.HERO.combatManeuvers, this.actor)

		if (game.settings.get("hero6e-foundryvtt-experimental", "optionalManeuvers")) {
			await loadCombatManeuvers(CONFIG.HERO.combatManeuversOptional, this.actor)
		}

		let velocity = [];
		// Determine max velocities
		velocity['data.characteristics.running.velocity.value'] = 0;
		velocity['data.characteristics.running.velocity.base'] = Math.round((changes['data.characteristics.spd.value'] * changes['data.characteristics.running.value']) / 12);

		velocity['data.characteristics.swimming.velocity.value'] = 0;
		velocity['data.characteristics.swimming.velocity.base'] = Math.round((changes['data.characteristics.spd.value'] * changes['data.characteristics.swimming.value']) / 12);

		velocity['data.characteristics.leaping.velocity.value'] = 0;
		velocity['data.characteristics.leaping.velocity.base'] = Math.round((changes['data.characteristics.spd.value'] * changes['data.characteristics.leaping.value']) / 12);

		velocity['data.characteristics.flying.velocity.value'] = 0;
		velocity['data.characteristics.flying.velocity.base'] = Math.round((changes['data.characteristics.spd.value'] * changes['data.characteristics.flying.value']) / 12);

		await this.actor.update(velocity);
    }

	async _onEditPowerItem(event) {
		let id = event.currentTarget.id.split(" ")[0];
		let item = this.object.data.items.get(id);

		console.log(id)

		await editSubItem(event, item);
	}
  
	async _onDeletePowerItem(event) {
		let id = event.currentTarget.key;
		let item = this.object.data.items.get(id);

		await deleteSubItem(event, item);
	}
}

async function displayCard({ rollMode, createMessage = true } = {}, subKey = "") {
	switch (this.data.type) {
		case "attack":
			const attackCard = await HeroSystem6eAttackCard.createAttackPopOutFromItem(this, this.actor);

			break;;
		case "power":
			let data = this.data.data.items.attack[subKey];

			const itemData = {
				name: data.name,
				type: data.type,
				data: data,
			};
		
			let newItem = new HeroSystem6eItem(itemData)

			await HeroSystem6eAttackCard.createAttackPopOutFromItem(newItem, this.actor);

			break;
	}
}

async function updateCombatAutoMod(actor, item) {
	let changes = [];
	let enabled = [];

	let ocvEq = 0;
	let dcvEq = "+0";
	
	for (let i of actor.items) {
		if (i.data.data.active && i.type === "maneuver") {
			enabled.push(i.data.name)

			ocvEq = ocvEq + parseInt(i.data.data.ocv);

			if (dcvEq.includes("/") && !i.data.data.dcv.includes("/")) {
				dcvEq = dcvEq;
			} else if (!dcvEq.includes("/") && i.data.data.dcv.includes("/")) {
				dcvEq = i.data.data.dcv;
			} else if (parseFloat(dcvEq) <= parseFloat(i.data.data.dcv)) {
				dcvEq = i.data.data.dcv;
			}
		}
	}

	if (isNaN(ocvEq)) {
		ocvEq = item.data.data.ocv;
	} else if (ocvEq >=0) {
		ocvEq = "+" + ocvEq.toString();
	} else {
		ocvEq = ocvEq.toString();
	}

	changes['data.characteristics.ocv.autoMod'] = ocvEq;
	//changes['data.characteristics.omcv.autoMod'] = ocvEq;
	changes['data.characteristics.dcv.autoMod'] = dcvEq;
	//changes['data.characteristics.dmcv.autoMod'] = dcvEq;

	changes['data.characteristics.ocv.value'] = actor.data.data.characteristics.ocv.base + parseInt(ocvEq);
	//changes['data.characteristics.omcv.value'] = actor.data.data.characteristics.omcv.base + parseInt(ocvEq);

	if (dcvEq.includes("/")) {
		changes['data.characteristics.dcv.value'] = Math.round(actor.data.data.characteristics.dcv.base * (parseFloat(dcvEq.split("/")[0]) / parseFloat(dcvEq.split("/")[1])));
		//changes['data.characteristics.dmcv.value'] = Math.round(actor.data.data.characteristics.dmcv.base * (parseFloat(dcvEq.split("/")[0]) / parseFloat(dcvEq.split("/")[1])));
	} else {
		changes['data.characteristics.dcv.value'] = actor.data.data.characteristics.dcv.base + parseInt(dcvEq);
		//changes['data.characteristics.dmcv.value'] = actor.data.data.characteristics.dmcv.base + parseInt(dcvEq);
	}

	await actor.update(changes);
}
