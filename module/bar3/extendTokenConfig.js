// export class HeroSystem6eDefaultTokenConfig extends DefaultTokenConfig {
//     async getData(options = {}) {
//         console.log("HeroSystem6eDefaultTokenConfig")
//         const context = await super.getData(options);
//         return context
//     }
// }
export class HeroSystem6eTokenConfig extends TokenConfig {
    constructor (object, options)
    {
        alert("HeroSystem6eTokenConfig")
        return super(object, options)
    }

    async _onBarChange(event)
    {
        alert("_onBarChange")
        return super._onBarChange(event)
    }
}

export const extendTokenConfig = async function (tokenConfig, html, data) {

    const resourceTab = html.find("div[data-tab='resources']");
    console.log(resourceTab)

    // Add form group for bar 3
    let bar3 = tokenConfig.token.getBarAttribute("bar3")
    let barAttributes = data.barAttributes["Attribute Bars"]
    let bar3FormGroup = await renderTemplate("systems/hero6efoundryvttv2/module/bar3/resource-form-group.hbs", { bar3, barAttributes });





    resourceTab.append(bar3FormGroup)

    // Add events
    //let el = html.find(`select[name="bar3.attribute"]`)
    //el.change(tokenConfig._onBarChange)

    if (resourceTab.hasClass("active")) adjustConfigHeight(tokenConfig.element);

    console.log(resourceTab)

    return html;
}

function adjustConfigHeight(html) {
    if (html[0].tagName === "FORM") html = html.parent().parent(); // Fix parent when force render is false.
    const height = parseInt(html.css("height"), 10);
    html.css("height", Math.max(height, 350) + "px");
}

