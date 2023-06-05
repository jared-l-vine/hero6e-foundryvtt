import { HeroSystem6eActorActiveEffects } from "../actor/actor-active-effects.js";
import { HeroSystem6eCard } from "./card.js";
import { modifyRollEquation, getTokenChar } from "../utility/util.js"
//import { HeroSystem6eDamageCard2 } from "./damage-card2.js";
import { HEROSYS } from "../herosystem6e.js";
import { getItem } from "../item/item.js";

export class HeroSystem6eToHitCard2 extends HeroSystem6eCard {
    static async chatListeners(html) {
        // NOTE: Make sure we are listed in card-helpers.js
        // Click roll damage button click
        //html.on('click', '.roll-damage', this._onChatCardAction.bind(this));

        html.on('click', '.area-effect-tag', this._spawnAreaOfEffect.bind(this))
    }

    static onMessageRendered(html) {

    }

    static async setCardStateAsync(button) {
        const card = button.closest(".chat-card");

        let actor = await this._getChatCardActor(card);

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
        //event.preventDefault();
        

        // Extract card data
        const button = event.currentTarget;

        //const action = button.dataset.action;
        //button.disabled = true;

        

        let itemId = event.currentTarget.attributes["data-itemid"].value;

        const card = button.closest(".chat-card");
        const cardObject = new HeroSystem6eToHitCard2();
        await cardObject.init(card);

        //cardObject.message.data.flags["state"] = {};
        cardObject.message.flags.state = {};

        // let toHitData = {
        //     aim: event.currentTarget.attributes["data-aim"].value,
        //     knockbackMod: event.currentTarget.attributes["data-knockbackmod"].value,
        //     damageMod: event.currentTarget.attributes["data-damagemod"].value,
        //     hitRollData: event.currentTarget.attributes["data-hitrolldata"].value,
        //     effectiveStr: event.currentTarget.attributes["data-effectiveStr"].value
        // };
        const toHitData = {...button.dataset}

        // Validate permission to proceed with the roll
        //const isValid = action === "apply-defenses";
        //if (!(isValid || game.user.isGM || cardObject.message.isAuthor)) return;

        // const targets = HeroSystem6eCard._getChatCardTargets();

        // if (targets.length === 0) return;

        // for (let token of targets) {
        //     await HeroSystem6eDamageCard2.createFromToHitCard(cardObject, token, toHitData, itemId);
        // }

        //await HeroSystem6eDamageCard2.createFromToHitCard(cardObject, null, toHitData, itemId);

        // Re-enable the button
        //button.disabled = false;
    }

    static async _renderInternal(item, actor, stateData) {
        /* I think this functionality got moved to item-attack.js */

        const token = actor.token;

        const templateData = {
            ...stateData,
            actor: actor,
            tokenId: token?.uuid || null,
            item: item
        }

        var path = "systems/hero6efoundryvttv2/templates/chat/item-toHit-card.hbs";

        return await renderTemplate(path, templateData);
    }

    async render() {
        return await HeroSystem6eToHitCard2._renderInternal(this.item, this.actor, this.message.flags.state);
    }

    async init(card) {
        super.init(card);
        this.target = await HeroSystem6eToHitCard2._getChatCardTarget(card);
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

    static async createFromAttackCard(item, data, actor, targets) {

        let itemId = item._id
        let itemData = item.system;
        let hitCharacteristic = actor.system.characteristics[itemData.uses].value;
        let toHitChar = CONFIG.HERO.defendsWith[itemData.targets];

        let automation = game.settings.get("hero6efoundryvttv2", "automation");

        // -------------------------------------------------
        // attack roll
        // -------------------------------------------------
        let rollEquation = "11 + " + hitCharacteristic;
        rollEquation = modifyRollEquation(rollEquation, item.system.toHitMod);
        rollEquation = modifyRollEquation(rollEquation, data.toHitModTemp);
        let noHitLocationsPower = false;
        if (game.settings.get("hero6efoundryvttv2", "hit locations") && data.aim !== "none" && !noHitLocationsPower) {
            rollEquation = modifyRollEquation(rollEquation, CONFIG.HERO.hitLocations[data.aim][3]);
        }
        rollEquation = rollEquation + " - 3D6";

        let attackRoll = new Roll(rollEquation, actor.getRollData());
        let result = await attackRoll.evaluate({async: true});
        let renderedResult = await result.render();

        // Dice do not roll with Dice so Nice #52
        // REF: https://github.com/dmdorman/hero6e-foundryvtt/issues/52
        // You can change the above to result.toMessage() to get DiceSoNice to work, but
        // it creates an extra private roll chatcard.  Looks like renderedResult part of
        // a return result to card.js.
        // Not prepared to chase all that down at the moment.
        // A temporary kluge is to call Dice So Dice directly.
        if (game.dice3d?.showForRoll)
        {
            game.dice3d.showForRoll(attackRoll)
        }
        


        let hitRollData = result.total;
        let hitRollText = "Hits a " + toHitChar + " of " + hitRollData;
        // -------------------------------------------------

        let useEnd = false;
        let enduranceText = "";
        if (game.settings.get("hero6efoundryvttv2", "use endurance")) {
            useEnd = true;
            let valueEnd = actor.system.characteristics.end.value
            let itemEnd = item.system.end;
            let newEnd = valueEnd - itemEnd;
            let spentEnd = itemEnd;

            if(itemData.usesStrength) {
                let strEnd =  Math.round(actor.system.characteristics.str.value / 10);
                if (data.effectiveStr <= actor.system.characteristics.str.value) {
                    strEnd =  Math.round(data.effectiveStr / 10);
                }

                newEnd = parseInt(newEnd) - parseInt(strEnd);
                spentEnd = parseInt(spentEnd) + parseInt(strEnd);
            }
            
            if (newEnd < 0) {
                enduranceText = 'Spent ' + valueEnd + ' END and ' + Math.abs(newEnd) + ' STUN';
            } else {
                enduranceText = 'Spent ' + spentEnd + ' END';
            }

            if ((automation === "all") || (automation === "npcOnly" && !actor.hasPlayerOwner) || (automation === "pcEndOnly")) {
                let changes = {};
                if (newEnd < 0) {
                    changes = {
                        "data.characteristics.end.value": 0,
                        "data.characteristics.stun.value": parseInt(actor.system.characteristics.stun.value) + parseInt(newEnd),
                    }
                } else {
                    changes = {
                        "data.characteristics.end.value": newEnd,
                    }
                }
                await actor.update(changes);
            }
        }

        let targetIds = []
        for (let target of Array.from(targets))
        {
            targetIds.push(target.id)
        }

        let stateData = {
            // dice rolls
            //rolls: [attackRoll],
            renderedHitRoll: renderedResult,
            hitRollText: hitRollText,
            hitRollValue: result.total,

            // data for damage card
            itemId: itemId, 
            aim: data.aim,
            knockbackMod: data.knockbackMod,
            damageMod: data.damageMod,
            hitRollData: hitRollData,
            effectiveStr: data.effectiveStr,
            targets: Array.from(targets),
            targetIds: targetIds,

            // endurance
            useEnd: useEnd,
            enduranceText: enduranceText,
        };

        // render card
        let cardHtml = await HeroSystem6eToHitCard2._renderInternal(item, actor, stateData);
        
        let token = actor.token;

        let speaker = ChatMessage.getSpeaker({ actor: actor, token })
        speaker["alias"] = actor.name;

        const chatData = {
            user:  game.user._id,
            content: cardHtml,
            speaker: speaker
        }
        return ChatMessage.create(chatData);
        
    }

    static async _spawnAreaOfEffect(event) {
        HEROSYS.log(false, 'spawn area of effect!')

        const clickedElement = $(event.currentTarget);

        const aoeType = clickedElement.data().aoeType;
        const aoeValue = clickedElement.data().aoeValue;

        const keyConversions = {
            radius: "circle",
            cone: "cone",
            line: "ray",
            surface: "rect",
            any: "rect"
        }

        const templateType = keyConversions[aoeType]

        const templateData = {
            t: templateType,
            user: game.user.id,
            distance: aoeValue,
            // direction: 0,
            fillColor: game.user.color
        };

        switch(templateType) {
            case ("radius"): {
                break;
            }
            case ("cone"): {
                break;
            }
            case ("ray"): {
                templateData.width = 1;
                break;
            }
            case ("rect"): {
                const warningMessage = game.i18n.localize("Warning.AreaOfEffectUnsupported")

                ui.notifications.warn(warningMessage)

                return

                break;
            }
            default: {
                break;
            }
        }

        const token = canvas.tokens.controlled[0];
        if (token) {
            templateData.x = token.data.x;
            templateData.y = token.data.y;


            canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [ templateData ]);

            canvas.templates.activate()
            canvas.templates.selectObjects({
                x: templateData.x,
                y: templateData.y,
                releaseOthers: true,
                control: true,
                toggle: false
            })
        } else {
            const errorMessage = game.i18n.localize("Errors.TokenSelect")

            ui.notifications.error(errorMessage)
        }
    }
}
