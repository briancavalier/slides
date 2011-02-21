/*
    cssx/shim/opacity
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    This cssx plugin fixes lack of box offset positioning in IE6.

*/
define(
	['cssx/sniff'],
	function (sniff) {

		return {

			onProperty: function (processor, parseArgs, ctx) { //(/* String */ propName, /* String */ value, /* String|Array */ selectors, /* String */ ss) {
				if (parseArgs.propName == 'opacity') {
					var rule = { selectors: parseArgs.selectors };
					rule[ctx.propName] = parseArgs.propValue;
					processor.addRule(rule);
				}
			}
		};

	}
);

