define(
	[
		'./inlineBlock',
		'./boxOffsets',
		'./ieOpacity'
	],
	function (inlineBlock, boxOffsets, ieOpacity) {

		return {
			inlineBlock: inlineBlock,
			boxOffsets: boxOffsets,
			ieOpacity: ieOpacity
		};

	}
);
