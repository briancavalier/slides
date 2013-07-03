/* @license Copyright (c) 2011-2013 Brian Cavalier */
(function(curl) {

	curl({
		main: 'app/main',
		paths: {
			'themes': 'css/themes',
			'markdown': 'app/hc/markdown'
		},
		packages: {
			curl: { location: 'bower_components/curl/src/curl' },
			when: { location: 'bower_components/when', main: 'when' },
			marked: { location: 'bower_components/marked', main: 'lib/marked' },
			highlightjs: { location: 'bower_components/highlightjs', main: 'highlight.pack.js' }
		}
	});

})(window.curl);