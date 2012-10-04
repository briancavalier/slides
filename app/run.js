(function(curl) {

	// Configure curl and load components, theme css,
	// and wait for DOM Ready.  Then create model, view,
	// and controller, and start the presentation.
	var config = {
		baseUrl: '',
		paths: {
			'themes': 'css/themes'
		},
		packages: [
			{ name: 'when', location: 'lib/when', main: 'when' }
		]
	};

	curl(config, ['app/main']);

})(window.curl);