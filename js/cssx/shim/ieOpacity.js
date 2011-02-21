/*
    cssx/shim/opacity
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    This cssx plugin fixes lack of box offset positioning in IE6.

*/
define(
	function () {

		return {

			onProperty: function (processor, parseArgs, ctx) { //(/* String */ propName, /* String */ value, /* String|Array */ selectors, /* String */ ss) {
				if (parseArgs.propName === 'opacity') {
					var decl = 'progid:DXImageTransform.Microsoft.Alpha(Opacity=' + (value * 100) + ')',
						rule = {
							selectors: parseArgs.selectors,
							propValue: decl
						};
					rule.propName = ctx.filterName;
					processor.appendRule(rule);
				}
			}
		};

	}
);

