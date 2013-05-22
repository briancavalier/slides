/* @license Copyright (c) 2011-2013 Brian Cavalier */
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