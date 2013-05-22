/* @license Copyright (c) 2011-2013 Brian Cavalier */
define(['marked'], function(marked) {
	return function(options) {
		return function(markdownText) {
			marked.setOptions(options);
			return marked(markdownText);
		};
	};
})