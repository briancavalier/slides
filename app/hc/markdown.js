/*
 @license Copyright (c) 2011 Brian Cavalier
 LICENSE: see the LICENSE.txt file. If file is missing, this file is subject
 to the MIT License at: http://www.opensource.org/licenses/mit-license.php.
 */
define(['marked'], function(marked) {
	return {
		load: function (absId, require, loaded, config) {
			require(['text!' + absId], function(text) {
				marked.setOptions(config);
				loaded(marked(text));
			});
		}
	}
});