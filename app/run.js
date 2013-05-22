/* @license Copyright (c) 2011-2013 Brian Cavalier */
(function(curl) {

	curl({
		main: 'app/main',
		paths: {
			'themes': 'css/themes',
			'markdown': 'app/hc/markdown'
		},
		packages: {
			curl: { location: 'components/curl/src/curl' },
			when: { location: 'components/when', main: 'when' },
			marked: { location: 'components/marked', main: 'lib/marked' }
		}
	});

})(window.curl);