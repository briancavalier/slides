(function(curl) {

	// Configure curl and load components, theme css,
	// and wait for DOM Ready.  Then create model, view,
	// and controller, and start the presentation.
	curl({
		baseUrl: '',
		paths: {
			'themes': 'css/themes'
		}
	},
	[
		'app/hc/slides/SingleFilePresentationModel',
		'app/hc/slides/SlideView',
		'app/hc/slides/PresentationController',
		'css!themes/gray/theme.css',
		'css!themes/fade.css',
		'domReady!'
	],
	function(Model, View, Controller) {
		var model, view, controller;

		model = new Model('slides/slides.html');
		view = new View(document.getElementById('slide-container'), model);
		controller = new Controller(view);

		controller.start().then(function() {
			document.body.className = '';
		});
	});

})(window.curl);