export class HeroSystem6eRuler extends Ruler {
    _getSegmentLabel(segmentDistance, totalDistance, isTotal) {
		let label = super._getSegmentLabel(segmentDistance, totalDistance, isTotal);

        let rangeMod = Math.ceil(Math.log2(totalDistance / 8)) * 2;
        rangeMod = rangeMod < 0 ? 0: rangeMod;

        label += "\n-" + rangeMod + " Range Modifier";

		return label;
    }
}