/* @license Copyright (c) 2011-2013 Brian Cavalier */
define([
	'require',
	'app/slides/ArrayPresentationModel',
	'app/slides/SlideView',
	'app/slides/PresentationController',
	'app/slides/tx/compose',
	'app/slides/tx/fetch',
	'app/slides/tx/markdown',
	'app/slides/tx/highlight',
	'app/slides/tx/split',
	'css!highlightjs/styles/ir_black.css',
	'css!themes/black/theme.css',
	'css!themes/fade.css',
	'domReady!'
],
	function (require, Model, View, Controller, compose, fetch, markdown, highlight, split) {
		var source, model, view, controller, splitSlides;

		splitSlides = /\s*\<hr\s*\/?\>\s*/i;
		source = compose(fetch(require), split(splitSlides));

		model = new Model(source('slides/slides.html'));
		view = new View(document.getElementById('slide-container'), model);
		controller = new Controller(view);

		controller.start().then(function () {
			document.body.className = '';
		});
	}
);
