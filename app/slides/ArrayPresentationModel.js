/* @license Copyright (c) 2011-2013 Brian Cavalier */
define(['when'], function(when) {

	/**
	 * Create a presentation model that accepts an array
	 * or promise for an array of slide content
	 * @param {Array|Promise} slides
	 * @constructor
	 */
	function ArrayPresentationModel(slides) {
		this.slides = slides;
	}

	ArrayPresentationModel.prototype = {
		/**
		 * Returns a promise for the content of a particular slide
		 * by number
		 * @param {number} slide slide number (zero-based) to get
		 * @returns {Promise} promise for the slide content
		 */
		get: function(slide) {
			return when.all(this.slides).then(function(slides) {
				return (0 <= slide && slide < slides.length)
					? { slide: slide, content: slides[slide] }
					: when.reject(slide);
			});
		}
	};

	return ArrayPresentationModel;
});