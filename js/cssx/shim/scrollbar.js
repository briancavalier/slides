/*
    cssx/shim/scrollbar
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.
*/
define(
	[
		'cssx/sniff'
	],
	function (sniff) {

		function getSbSize () {
			var sbSize = sniff.getScrollbarSize();
			sbSize = { w: sbSize.w + 'px', h: sbSize.h + 'px' };
			getSbSize = function () { return sbSize; };
			return sbSize;
		}

		return {

			onProperty: function (processor, parseArgs) {
				// processor: the cssx processor in context
				// parseArgs:
				// 		propName: String
				// 		value: String
				// 		selectors: String|Array
				// 		sheet: String
				if (/-cssx-scrollbar/.test(parseArgs.propValue)) {
					processor.appendRule({
						selectors: parseArgs.selectors,
						propName: parseArgs.propName,
						propValue: parseArgs.propValue === '-cssx-scrollbar-width' ? getSbSize().w : getSbSize().h
					});
				}
			}

		};

	}
);
