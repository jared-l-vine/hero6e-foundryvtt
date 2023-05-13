// Possible reference: https://github.com/foundryvtt/foundryvtt/issues/9026
// Possible reference: https://gitlab.com/woodentavern/foundryvtt-bar-brawl

export class HeroSystem6eTokenDocument extends TokenDocument {
    constructor(data, context) {
        super(data, context)
    }

    getBarAttribute(barName, alternative) {
        //console.log("getBarAttribute")
        let data = super.getBarAttribute(barName, alternative)

        if (barName == "bar3") {
            const attr = alternative || this[barName]?.attribute;
            if (!attr || !this.actor) return null;
            let data = foundry.utils.getProperty(this.actor.system, attr);
            if ((data === null) || (data === undefined)) return null;
            const model = game.model.Actor[this.actor.type];

            // Single values
            if (Number.isNumeric(data)) {
                return {
                    type: "value",
                    attribute: attr,
                    value: Number(data),
                    editable: foundry.utils.hasProperty(model, attr),
                };
            }

            // Attribute objects
            else if (("value" in data) && ("max" in data)) {
                return {
                    type: "bar",
                    attribute: attr,
                    value: parseInt(data.value || 0),
                    max: parseInt(data.max || 0),
                    editable: foundry.utils.hasProperty(model, `${attr}.value`),
                    label: attr.split('.').pop()
                };
            }

            // Otherwise null
            return null;
        }

        // Add label
        const attr = alternative || this[barName]?.attribute;
        if (attr) return { ...data, label: attr.split('.').pop()};
        return data;
    }

    static defineSchema() {
        //console.log("defineSchema")
        let schema = super.defineSchema()
        schema.bar3 = new foundry.data.fields.SchemaField({
            attribute: new foundry.data.fields.StringField({
                required: true, nullable: true, blank: false,
                initial: () => "characteristics.end"
            })
        });
        return schema;
    }
}

export class HeroSystem6eToken extends Token {


    constructor(document) {
        super(document)
        //this.bar3 = this.bar.addChild(new PIXI.Graphics());
    }

    getData(options) {
        let data = super.getData();
        data.bar3 = this.token.getBarAttribute?.("bar3")
        return data
    }

    _drawAttributeBars() {
        console.log("_drawAttributeBars")
        let bars = super._drawAttributeBars()
        bars.bar3 = bars.addChild(new PIXI.Graphics());
        return bars;
    }

    _drawBar(number, bar, data) {
        const val = Number(data.value);
        const pct = Math.clamped(val, 0, data.max) / data.max;

        // Determine sizing
        let h = Math.max((canvas.dimensions.size / 12), 8);
        const w = this.w;
        const bs = Math.clamped(h / 8, 1, 2);
        if (this.document.height >= 2) h *= 1.6;  // Enlarge the bar for large tokens

        // Determine the color to use
        const blk = 0x000000;
        let color;
        if (number === 0) color = PIXI.utils.rgb2hex([(1 - (pct / 2)), pct, 0]);
        else color = PIXI.utils.rgb2hex([(0.5 * pct), (0.7 * pct), 0.5 + (pct / 2)]);

        // Override for Hero
        if (number === 0) color = PIXI.utils.rgb2hex([1,0,0]); // Body
        if (number === 1) color = PIXI.utils.rgb2hex([0,1,0]); // Stun
        if (number === 2) color = PIXI.utils.rgb2hex([0.5,0.5,1]); // Endurance

        // Draw the bar
        bar.clear();
        bar.beginFill(blk, 0.5).lineStyle(bs, blk, 1.0).drawRoundedRect(0, 0, this.w, h, 3);
        bar.beginFill(color, 1.0).lineStyle(bs, blk, 1.0).drawRoundedRect(0, 0, pct * w, h, 2);

        // Enlarge the bar for large tokens
        if (this.document.height >= 2) {
            h *= 1.6;
        }

        // Set position (stack bars from bottom to top)
        let posY = this.h - h * (number + 1);
        bar.position.set(0, posY);

        // Opacity
        bar.alpha = 0.8

        // Label
        this.drawBarLabel(bar, data, data.value, data.max);
        

    }

    drawBarLabel(bar, data, value, max) {
        // remove any existing children (may want save the previous one, not sure yet)
        while(bar.children[0]) { 
            bar.removeChild(bar.children[0]);
        }

        bar.resolution = 2

        let textStyle = "fraction"; //data.style;
        //if (!textStyle || textStyle === "user") textStyle = game.settings.get("barbrawl", "textStyle") || "fraction";
        switch (textStyle) {
            case "none":
                if (data.label) this.createBarLabel(bar, data, data.label);
                break;
            case "fraction":
                this.createBarLabel(bar, data, `${data.label ? data.label + "  " : ""}${value} / ${max}`);
                break;
            case "percent":
                // Label does not match bar percentage because of possible inversion.
                const percentage = Math.round((Math.clamped(value, 0, max) / max) * 100);
                this.createBarLabel(bar, data, `${data.label ? data.label + "  " : ""}${percentage}%`);
                break;
            default:
                console.error(`Unknown label style`);
        }
    }

    createBarLabel(bar, data, text) {
        let font = CONFIG.canvasTextStyle.clone();
        font.fontSize = bar.height;
        //font.fontSize = data.fgImage || data.bgImage ? getBarHeight(token, bar.contentWidth) : bar.contentHeight;
    
        const barText = new PIXI.Text(text, font);
        barText.name = bar.name + "-text";
        barText.x = bar.width / 2;
        barText.y = bar.height * 0.44;  // For some reason 50% is slighly low
        barText.anchor.set(0.5);
        barText.resolution = 2;
        barText.height =bar.height
        //barText.width = bar.width
        if (data.invertDirection) barText.scale.x *= -1;
        bar.addChild(barText);
    }
    
    


    drawBars() {
        //console.log("drawBars")
        if (!this.actor || (this.document.displayBars === CONST.TOKEN_DISPLAY_MODES.NONE)) {
            return this.bars.visible = false;
        }
        ["bar1", "bar2", "bar3"].forEach((b, i) => {
            const bar = this.bars[b];
            if (!bar) return
            const attr = this.document.getBarAttribute(b);
            if (!attr || (attr.type !== "bar")) return bar.visible = false;
            this._drawBar(i, bar, attr);
            bar.visible = true;
        });
        this.bars.visible = this._canViewMode(this.document.displayBars);

    }


    // prepareBaseData() {
    //     super.prepareBaseData();
    //     console.log("prepareBaseData")
    // }


    // _onCreate(data)
    // {

    //     console.log("_onCreate", data)
    //     alert("_onCreate")
    // }
}