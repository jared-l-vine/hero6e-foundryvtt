import { HeroSystem6eActorActiveEffects } from "../actor/actor-active-effects.js";
import { HeroSystem6eActorSheet } from "../actor/actor-sheet.js";
import { HeroSystem6eItem } from "../item/item.js";
import { HeroSystem6eCard } from "./card.js";
import { determineDefense } from "../utility/defense.js";
import { modifyRollEquation, getTokenChar } from "../utility/util.js"
import { HEROSYS } from "../herosystem6e.js";

export class _HeroSystem6eDamageCard2 extends HeroSystem6eCard {

    static chatListeners(html) {
        // NOTE: Make sure we are listed in card-helpers.js
        html.on('click', '.apply-damage', this._onChatCardAction.bind(this));
    }

    static onMessageRendered(html) {
        html.find('.damage-card .card-buttons button').each((i, button) => {
            HeroSystem6eDamageCard.setCardStateAsync(button);
            button.style.display = "block";
        });
    }

    static async setCardStateAsync(button) {
        const card = button.closest(".chat-card");

        let actor = await this._getChatCardActor(card);

        if (button.getAttribute('data-action') == 'damage-apply') {
            actor = await this._getChatCardTarget(card);
        }

        if (!actor) return;

        if (!actor.isOwner) {
            button.setAttribute("disabled", true);
        }
    }

    /**
   * Handle execution of a chat card action via a click event on one of the card buttons
   * @param {Event} event       The originating click event
   * @returns {Promise}         A promise which resolves once the handler workflow is complete
   * @private
   */
    static async _onChatCardAction(event) {
        console.log("_onChatCardAction")
        event.preventDefault();

        // Extract card data
        const button = event.currentTarget;

        const action = button.dataset.action;
        button.disabled = true;
        const card = button.closest(".chat-card");
        const cardObject = new HeroSystem6eDamageCard2();
        await cardObject.init(card);

        // Validate permission to proceed with the roll
        //if (!(game.user.isGM || cardObject.message.isAuthor)) return;


        await cardObject.applyDamage()

        // Re-enable the button
        button.disabled = false;
    }

    static async _renderInternal(actor, item, target, stateData) {
        // Render the chat card template
        const token = actor.token;
        //const targetToken = target.token;

        const templateData = {
            ...stateData,
            actor: actor.system,
            item: item,
            tokenId: token?.uuid || null,
            //target: target.system,
            //targetTokenId: targetToken?.uuid || null,
        };

        var path = "systems/hero6efoundryvttv2/templates/chat/item-damage-card2.hbs";

        return await renderTemplate(path, templateData);
    }

    async render() {
        return await HeroSystem6eDamageCard2._renderInternal(this.actor, this.item, this.target, this.message.data.flags["state"]);
    }

    async init(card) {
        super.init(card);
        this.target = await HeroSystem6eDamageCard2._getChatCardTarget(card);
    }

    static async _getChatCardTarget(card) {
        // Case 1 - a synthetic actor from a Token
        if (card.dataset.targetTokenId) {
            const token = await fromUuid(card.dataset.targetTokenId);
            if (!token) return null;
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const targetId = card.dataset.targetId;
        return game.actors.get(targetId) || null;
    }

    static async createFromToHitCard(cardObject, token, toHitData, itemId) {
        console.log("createFromToHitCard")
        //let targetActor = token.document._actor
        //let targetActorChars = targetActor.system.characteristics;

        const actor = cardObject.actor

        let item;
        if (itemId.includes("-")) {
            // power or equipment type item
            let powerId = itemId.split("-")[0];
            let subId = itemId.split("-")[1];

            let attackItemData = actor.items.get(powerId).system.items["attack"][`${subId}`]

            const itemData = {
              name: attackItemData.name,
              type: attackItemData.type,
              data: attackItemData,
            }
        
            item = new HeroSystem6eItem(itemData)
        } else {
            item = cardObject.item
        }

        const itemData = item.system;

        let damageRoll = itemData.dice;

        let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];

        let automation = game.settings.get("hero6efoundryvttv2", "automation");

        // -------------------------------------------------
        // determine active defenses
        // -------------------------------------------------
        // let defense = "";
        // let [defenseValue, resistantValue, damageReductionValue, damageNegationValue, knockbackResistance] = determineDefense(targetActor, item.system.class)

        // if (damageNegationValue > 0) {
        //     defense += "Damage Negation " + damageNegationValue + "DC(s); "
        // }

        // defense = defense + defenseValue + " normal; " + resistantValue + " resistant";

        // -------------------------------------------------
        // damage roll
        // -------------------------------------------------

        // let noHitLocationsPower = false;
        // for (let i of targetActor.items) {
        //     if (i.system.rules === "NOHITLOCATIONS") {
        //         noHitLocationsPower = true;
        //     }
        // }

        // // get hit location
        // let hitLocationModifiers = [1, 1, 1, 0];
        // let hitLocation = "None";
        // let useHitLoc = false;
        // if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
        //     useHitLoc = true;

        //     hitLocation = toHitData.aim;
        //     if (toHitData.aim === 'none') {
        //         let locationRoll = new Roll("3D6")
        //         let locationResult = await locationRoll.roll({async: true});
        //         hitLocation = CONFIG.HERO.hitLocationsToHit[locationResult.total];
        //     }

        //     hitLocationModifiers = CONFIG.HERO.hitLocations[hitLocation];

        //     if (game.settings.get("hero6efoundryvttv2", "hitLocTracking") === "all") {
        //         let sidedLocations = ["Hand", "Shoulder", "Arm", "Thigh", "Leg", "Foot"]
        //         if (sidedLocations.includes(hitLocation)) {
        //             let sideRoll = new Roll("1D2", actor.getRollData());
        //             let sideResult = await sideRoll.roll();

        //             if (sideResult.result === 1) {
        //                 hitLocation = "Left " + hitLocation;
        //             } else {
        //                 hitLocation = "Right " + hitLocation;
        //             }
        //         }   
        //     }
        // }

        if(itemData.usesStrength) {
            let strDamage = Math.floor((actor.system.characteristics.str.value - 10)/5)
            if (toHitData.effectiveStr <= actor.system.characteristics.str.value) {
                strDamage = Math.floor((toHitData.effectiveStr)/5);
            }

            if (strDamage > 0) {
                damageRoll = parseInt(damageRoll) + parseInt(strDamage)
            }
        }

        let pip = 0;

        // handle damage negation defense
        // if (damageNegationValue > 0) {
        //     if (itemData.killing) {
        //         pip = (parseInt(damageRoll) * 3) - parseInt(damageNegationValue);

        //         damageRoll = Math.floor(pip / 3);

        //         pip = pip % 3
        //     } else {
        //         damageRoll = damageRoll - damageNegationValue;
        //     }
        // }

        damageRoll = damageRoll < 0 ? 0 : damageRoll;

        // needed to split this into two parts for damage negation
        switch (itemData.extraDice) {
            case 'zero':
                pip += 0;
                break;
            case 'pip':
                pip += 1;
                break;
            case 'half':
                pip += 2;
                break;
        }

        if (pip < 0) {
            damageRoll = "0D6";
        } else {
            switch (pip) {
                case 0:
                    damageRoll += "D6";
                    break;
                case 1:
                    damageRoll += "D6+1";
                    break;
                case 2:
                    damageRoll += "D6+1D3"
                    break;
            }
        }

        damageRoll = modifyRollEquation(damageRoll, toHitData.damagemod);

        let roll = new Roll(damageRoll, actor.getRollData());
        let damageResult = await roll.roll({async: true});
        let damageRenderedResult = await damageResult.render();
        let body = 0;
        let stun = 0;
        let countedBody = 0;

        let hasStunMultiplierRoll = false;
        let renderedStunMultiplierRoll = null;
        let stunMultiplier = 1;

        // Dice do not roll with Dice so Nice #52
        // REF: https://github.com/dmdorman/hero6e-foundryvtt/issues/52
        // You can change the above to result.toMessage() to get DiceSoNice to work, but
        // it creates an extra private roll chatcard.  Looks like renderedResult part of
        // a return result to card.js.
        // Not prepared to chase all that down at the moment.
        // A temporary kluge is to call Dice So Dice directly.
        if (game.dice3d?.showForRoll)
        {
            game.dice3d.showForRoll(damageResult)
        }


        if (itemData.killing) {
            hasStunMultiplierRoll = true;
            body = damageResult.total;

            let stunRoll = new Roll("1D3", actor.getRollData());
            let stunResult = await stunRoll.roll();
            let renderedStunResult = await stunResult.render();
            renderedStunMultiplierRoll = renderedStunResult;

            if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
                stunMultiplier =  hitLocationModifiers[0];
            } else {
                stunMultiplier = stunResult.total;
            }

            stun = body * stunMultiplier;
        }
        else {
            // counts body damage for non-killing attack
            for (let die of damageResult.terms[0].results) {
                switch (die.result) {
                    case 1:
                        countedBody += 0;
                        break;
                    case 6:
                        countedBody += 2;
                        break;
                    default:
                        countedBody += 1;
                        break;
                }
            }

            stun = damageResult.total;
            body = countedBody;
        }

        let bodyDamage = body;
        let stunDamage = stun;

        let effects = "";
        if (item.system.effects !== "") {
            effects = item.system.effects + ";"
        }

        // -------------------------------------------------
        // determine effective damage
        // -------------------------------------------------

        // if(itemData.killing) {
        //     stun = stun - defenseValue - resistantValue;
        //     body = body - resistantValue;
        // } else {
        //     stun = stun - defenseValue - resistantValue;
        //     body = body - defenseValue - resistantValue;
        // }

        // stun = stun < 0 ? 0 : stun;
        // body = body < 0 ? 0 : body;

        let hitLocText = "";
        if (game.settings.get("hero6efoundryvttv2", "hit locations") && !noHitLocationsPower) {
            if(itemData.killing) {
                // killing attacks apply hit location multiplier after resistant damage protection has been subtracted
                body = body * hitLocationModifiers[2];

                hitLocText = "Hit " + hitLocation + " (x" + hitLocationModifiers[0] + " STUN x" + hitLocationModifiers[2] + " BODY)";
            } else {
                // stun attacks apply N STUN hit location multiplier after defenses
                stun = stun * hitLocationModifiers[1];
                body = body * hitLocationModifiers[2];

                hitLocText = "Hit " + hitLocation + " (x" + hitLocationModifiers[1] + " STUN x" + hitLocationModifiers[2] + " BODY)";
            }

            hasStunMultiplierRoll = false;
        }

        

        // minimum damage rule
        if (stun < body) {
            stun = body;
            effects += "minimum damage invoked; "
        }

        stun = Math.round(stun)
        body = Math.round(body)

        // check if target is stunned
        // if (game.settings.get("hero6efoundryvttv2", "stunned")) {
        //     // determine if target was Stunned
        //     if (stun > targetActorChars.con.value) {
        //         effects = effects + "inflicts Stunned; "
        //     }
        // }


        // -------------------------------------------------
        let stateData = {
            // dice rolls
            renderedDamageRoll: damageRenderedResult,
            renderedStunMultiplierRoll: renderedStunMultiplierRoll,

            // hit locations
            // useHitLoc: useHitLoc,
            // hitLocText: hitLocText,

            // body
            bodyDamage: bodyDamage,
            bodyDamageEffective: body,
            countedBody: countedBody,

            // stun
            stunDamage: stunDamage,
            stunDamageEffective: stun,
            hasRenderedDamageRoll: true,
            stunMultiplier: stunMultiplier,
            hasStunMultiplierRoll: hasStunMultiplierRoll,

            // misc
            targets: toHitData.targetids,
        };

        // render card
        let cardHtml = await HeroSystem6eDamageCard2._renderInternal(actor, item, null, stateData);
        
        let speaker = ChatMessage.getSpeaker()
        //speaker["alias"] = actor.name;

        const chatData = {
            user:  game.user._id,
            content: cardHtml,
            speaker: speaker,
        }

        return ChatMessage.create(chatData);
    }
}