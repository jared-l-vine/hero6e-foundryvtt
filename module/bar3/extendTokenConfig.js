
export class HeroSystem6eTokenConfig extends TokenConfig {
    constructor(object, options) {
        alert("HeroSystem6eTokenConfig")
        return super(object, options)
    }

    async _onBarChange(event) {
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

    // Add event for bar3
    let el = resourceTab.find(`select[name="bar3.attribute"]`)
    el.change(_onBarChange.bind(tokenConfig))
    // el.change((event) => {
    //     // Copied from foundry.TokenConfig as couldn't figure out how to extend it
    //     console.log("_onBarChange")
    //     const form = event.target.form;
    //     const attr = this.token.getBarAttribute("", { alternative: event.target.value });
    //     const bar = event.target.name.split(".").shift();
    //     form.querySelector(`input.${bar}-value`).value = attr !== null ? attr.value : "";
    //     form.querySelector(`input.${bar}-max`).value = ((attr !== null) && (attr.type === "bar")) ? attr.max : "";
    // })


    // Copied from foundry.TokenConfig as couldn't figure out how to extend it
    function _onBarChange(event) {
        console.log("_onBarChange")
        const form = event.target.form;
        const attr = this.token.getBarAttribute("", { alternative: event.target.value });
        const bar = event.target.name.split(".").shift();
        form.querySelector(`input.${bar}-value`).value = attr !== null ? attr.value : "";
        form.querySelector(`input.${bar}-max`).value = ((attr !== null) && (attr.type === "bar")) ? attr.max : "";
    }


    // Resize resource tab
    if (resourceTab.hasClass("active")) adjustConfigHeight(tokenConfig.element);


    return html;
}

function adjustConfigHeight(html) {
    if (html[0].tagName === "FORM") html = html.parent().parent(); // Fix parent when force render is false.
    const height = parseInt(html.css("height"), 10);
    html.css("height", Math.max(height, 350) + "px");
}


