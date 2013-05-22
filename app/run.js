(function(curl) {

	// Configure curl and load components, theme css,
	// and wait for DOM Ready.  Then create model, view,
	// and controller, and start the presentation.
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