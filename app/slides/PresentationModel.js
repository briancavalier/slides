/* @license Copyright (c) 2011-2013 Brian Cavalier */
/*
	Class: PresentationModel
*/
define(['require', '../.'], function(require, when) {

	var 
		// Default number of slides to preload
		defaultPreload = 5,
		// Slides will only be preloaded when there are this
		// many already-loaded slides beyond the current slide
		preloadThreshold = 2;

	/*
		Constructor: PresentationModel
		Creates a new PresentationModel for accessing slides from separate HTML files
		named 0.html, 1.html, 2.html, etc.
		
		Parameters:
			slidePath - relative path to directory containing slide files
			preload - (optional) number of slides to preload initially, and as slides are viewed
		
		Returns:
		a new multi-file slide PresnetationModel
	*/
	return function PresentationModel(slidePath, preload) {
		
		var cachedSlides = [],
			preloadCount = preload || defaultPreload;

		/*
			Function: preloadSlides
			Preloads n slides starting at the supplied slide number
			
			Parameters:
				start - first slide to preload, but not show
				n - number of slides to preload
		*/
		function preloadSlides(start, n) {
			var end = start + n;
				
			for (var i = start; i < end; i++) {
				getSlide(i);
			}
		}
		
		/*
			Function: getSlide
			Ensures that the supplied slide number is loaded, and returns a promise that
			will be resolved when the slide is ready.
			
			Parameters:
				slide - number of the slide to get
				preloadCount - number of slides beyond slide to ensure are also loaded
				
			Returns:
			a promise that will be resolved when the supplied slide number is loaded and ready.
			The promise value will have 2 fields:
				* slide - the slide number
				* content - the slide content
		*/
		function getSlide(slide, preloadCount) {
			var d = when.defer(),
				slideModule = 'text!' + slidePath + '/' + slide + '.html';

			if(0 <= slide) {
				if(cachedSlides[slide]) {
					d.resolve({ slide: slide, content: cachedSlides[slide] });
				} else {
					require([slideModule], function(slideContent) {
						if(/404/.test(slideContent)) {
							d.reject(slide);
						} else {
							cachedSlides[slide] = slideContent;
							d.resolve({ slide: slide, content: slideContent });
						}
					});
				}
				
				if(preloadCount && (cachedSlides.length - slide) <= preloadThreshold) {
					preloadSlides(slide + 1, preloadCount);
				}
				
			} else {
				d.reject(slide);
			}
			
			return d.promise;
		}

		return {
			/*
				Function: get
				Ensures that the supplied slide number is loaded, and returns a promise that
				will be resolved when the slide is ready.

				Parameters:
					slide - number of the slide to get
	
				Returns:
				a promise that will be resolved when the supplied slide number is loaded and ready.
				The promise value will have 2 fields:
					* slide - the slide number
					* content - the slide content
			*/
			get: function(slide) {
				return getSlide(slide, preloadCount);
			}
		};
		
	};
});