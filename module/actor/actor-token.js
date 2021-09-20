export class HeroSystem6eTokenDocument extends TokenDocument {

}

export class HeroSystem6eToken extends Token {
    _drawBar(number, bar, data) {
        let drawnBar = super._drawBar(number, bar, data);

        let h = Math.max((canvas.dimensions.size / 12), 8);
        if (this.data.height >= 2) h *= 1.6;  // Enlarge the bar for large tokens
        let posY = this.h - h * (number + 1);
        bar.position.set(0, posY);

        return drawnBar;
    }
}