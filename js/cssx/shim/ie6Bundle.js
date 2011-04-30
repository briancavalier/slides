define(
	[
		'./inlineBlock',
		'./boxOffsets',
		'./ieOpacity',
		'./minmax',
		'./hover',
		'./childSelector',
		'./comboSelector'/*,
		'./attrSelector'*/
	],
	function (inlineBlock, boxOffsets, ieOpacity, minmax, hover, childSelector, comboSelector/*, attrSelector*/) {

		return {
			inlineBlock: inlineBlock,
			boxOffsets: boxOffsets,
			ieOpacity: ieOpacity,
			minmax: minmax,
			hoverPseudo: hoverPseudo,
//			attrSelector: attrSelector,
			childSelector: childSelector,
			comboSelector: comboSelector
		};

	}
);
