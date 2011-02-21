/*
    cssx/shim/auto
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    This cssx plugin scans all css properties for referenced plugins and
    ensures they are loaded. Plugins are found by checking for the following
    pattern: -cssx-<plugin_name>

    The following are examples
    border-left-width: -cssx-scrollbar-width; <-- loads the scrollbar plugin
    -cssx-transition: top 1s ease; <-- loads the transition plugin

TODO: remove this file

*/
define(
	function () {

		function cssxFinder (str) {
			var m = /\s*-cssx-(\w*)/.match(str);
			return m && m[1];
		}

		return {

			// isActive can check for processor state (buildtime, domparsing, textparsing, etc)
			isActive: function (processor) { return true; },

			/* event handlers */

			onProperty: function (processor, parseArgs) {
				// processor: the cssx processor in context
				// parseArgs:
				// 		propName: String
				// 		value: String
				// 		selectors: String|Array
				// 		sheet: String
				var cssxName = cssxFinder(parseArgs.propName) || cssxFinder(parseArgs.propValue);
				if (!processor.hasPlugin(cssxName)) {
					// getPlugins initializes the plugins, if necessary
					processor.getPlugins([cssxName], function (plugins) {
						// if plugin is active
						if (plugins[0].isActive()) {
							// plugin will resolve or reject
							plugins[0].onProperty(processor, parseArgs);
						}
					});
				}
			}

		};

	}
);
