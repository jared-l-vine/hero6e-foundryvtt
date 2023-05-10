/** Large portions have been inspired by https://gitlab.com/woodentavern/foundryvtt-bar-brawl */

/**
 * Modifies the given HTML to render additional resource input fields.
 * @param {TokenHUD} tokenHud The HUD object.
 * @param {jQuery} html The jQuery element of the token HUD.
 * @param {Object} data The data of the token HUD.
 */
export const HeroSystem6eTokenHud = async function (tokenHud, html, data) {

    // TokenHud includes most of the clickable controls/inputs
    // it does not include the bar's themselves.

    // there is a "col left", "col middle", and "col right"

    // remove the default attributes from the middle column
    const middleColumn = html.find(".col.middle");
    middleColumn.find("div.attribute").remove();
    //html.find(".col.middle .bar1").remove()

    // Do not now how data is created, but it has bar1Data and bar2Data.
    // We will create bar3Data here for now.
    const token = tokenHud.object
    const actor = token?.actor
    if (actor) {
        data.bar3Data = {
            attribute: 'characteristics.end',
            value: actor.system.characteristics.end.value,
            max: actor.system.characteristics.end.value,
            type: "heroBar",
            name: "heroBar3",
            editable: true
        }
        //await token.document.update({bar3: data.bar3Data.attribute})
    } else {
        return /* forget about all the custom stuff */
    }


    // Add top bar3
    let bars = []
    bars.push(data.bar3Data)
    bars[0].name = "bar3"
    bars[0].maxcolor = "blue"
    for (let i = 0; i < bars.length; i++) {
        bars[i].title = (bars[i].attribute || "").replace("characteristics.", "")
    }
    middleColumn.append(await renderBarInput(bars))

    // Add bottom bar1 & bar2
    bars = []
    bars.push(data.bar1Data)
    bars[0].name = "bar1"
    bars[0].maxcolor = "#CC5500"
    bars.push(data.bar2Data)
    bars[1].name = "bar2"
    bars[1].maxcolor = "green"
    for (let i = 0; i < bars.length; i++) {
        bars[i].title = (bars[i].attribute || "").replace("characteristics.", "")
    }
    middleColumn.append(await renderBarInput(bars))

    // Add input events
    html.find(".attribute.hero-attribute input")
        .click(tokenHud._onAttributeClick)
        .keydown(tokenHud._onAttributeKeydown.bind(tokenHud))
        .focusout(tokenHud._onAttributeUpdate.bind(tokenHud));

}

/**
 * Renders the input template for the given bars.
 * @param {Object[]} bars The bars to render inputs for.
 * @param {string} css The CSS classes of the input container.
 * @returns {Promise.<string>} A promise representing the rendered inputs as HTML string.
 */
function renderBarInput(bars) {
    const css = bars.length > 1 ? "compact" : ""
    return renderTemplate("systems/hero6efoundryvttv2/templates//resource-hud.hbs", { bars, css });
}


/**
 * Prepares the update of a token (or a prototype token) by removing invalid
 *  resources and synchronizing with FoundryVTT's resource format.
 * @param {TokenDocument} tokenDoc The data to merge the new data into.
 * @param {Object} newData The data to be merged into the token data.
 */

export async function HeroSystem6ePreUpdateToken(tokenDoc, newData) {
    console.log(HeroSystem6ePreUpdateToken)
}