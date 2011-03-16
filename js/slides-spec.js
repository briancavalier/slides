wire({
	theme: { module: 'cssx/css!css/themes/gray/theme.css' }, // Slide theme
	transition: { module: 'cssx/css!css/themes/fade.css' },    // Slide transition
	plugins: [
		{ module: 'wire/debug' },
		{ module: 'wire/dom' }
	],
	model: {
		create: {
			module: 'hc/slides/SingleFilePresentationModel',
			args: { $ref: 'slidesPath' }
		}
	},
	view: {
		create: {
			module: 'hc/slides/SlideView',
			args: [{ $ref: 'dom!slide-container' }, { $ref: 'model' }]
		}
	},
	controller: {
		create: {
			module: 'hc/slides/PresentationController',
			args: { $ref: 'view' }
		}
	}
}).then(
function(context) {
	console.log(context);
	var body = document.body;
	body.className = body.className.replace(/\s*presentation-loading\s*/g, " ");
},
function(err) {
	console.log(err);
});