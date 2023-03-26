async function _renderForm(actor, stateData) {
    const token = actor.token;

    const templateData = {
        actor: actor.system,
        tokenId: token?.uuid || null,
        state: stateData,
    };

    var path = "systems/hero6efoundryvttv2/templates/pop-out/presence-attack-card.hbs";

    return await renderTemplate(path, templateData);
}

async function presenceAttackRoll(actor, html) {
    let form = html[0].querySelector("form");

    let rollEquation = eval(parseInt(Math.floor(actor.system.characteristics.pre.value / 5)) + parseInt(form.mod.value)).toString() + "D6"

    let roll = new Roll(rollEquation, actor.getRollData());

    roll.evaluate({async: true}).then(function(result) {          
        result.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: "Presence Attack",
            borderColor: 0x00FF00,	
        });
    });
}

async function presenceAttackPopOut(actor) {
    const content = await _renderForm(actor, {});

    // Attack Card as a Pop Out
    let options = {
        'width' : 300,
    }

    return new Promise(resolve => {
        const data = {
            title: "Roll to Hit",
            content: content,
            buttons: {
                rollToHit: {
                label: "Roll to Hit",
                    callback: html => resolve(presenceAttackRoll(actor, html))
                },
            },
            default: "rollToHit",
            close: () => resolve({})
        }

        new Dialog(data, options).render(true);;
    });
}

export { presenceAttackPopOut }