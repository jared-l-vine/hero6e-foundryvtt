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
                    editable: foundry.utils.hasProperty(model, attr)
                };
            }

            // Attribute objects
            else if (("value" in data) && ("max" in data)) {
                return {
                    type: "bar",
                    attribute: attr,
                    value: parseInt(data.value || 0),
                    max: parseInt(data.max || 0),
                    editable: foundry.utils.hasProperty(model, `${attr}.value`)
                };
            }

            // Otherwise null
            return null;
        }
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
        let drawnBar = super._drawBar(number, bar, data);

        let h = Math.max((canvas.dimensions.size / 12), 8);
        if (this.document.height >= 2) h *= 1.6;  // Enlarge the bar for large tokens
        let posY = this.h - h * (number + 1);
        bar.position.set(0, posY);
        return drawnBar;
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


    prepareBaseData() {
        super.prepareBaseData();
        console.log("prepareBaseData")
    }


    // _onCreate(data)
    // {

    //     console.log("_onCreate", data)
    //     alert("_onCreate")
    // }
}