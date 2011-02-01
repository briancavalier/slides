/*
 	@license Copyright (c) 2011 Brian Cavalier
	LICENSE: see the LICENSE.txt file. If file is missing, this file is subject
	to the MIT License at: http://www.opensource.org/licenses/mit-license.php.
 */
/*
	Class: PresentationModel
*/
define(['require'], function(require) {
	
	var defaultPreload = 5,
		preloadThreshold = 2;

	/*
		Function: promise
		
		Returns:
		a new promise
	*/
	function promise() {
		var value,
			complete = 0,
			callbacks = [];
			
		function then(resolver, rejecter) {
			if(complete > 0) {
				if(resolver) resolver(value);
			} else if (complete < 0) {
				if(rejecter) rejecter(value);
			} else {
				callbacks.push({ resolve: resolver, reject: rejecter });
			}
			return this;
		}
			
		return {
			resolve: function resolve(result) {
				complete = 1;
				value = result;
				for (var i=0; i < callbacks.length; i++) {
					var cb = callbacks[i].resolve;
					if(cb) cb(value);
				};
			},
			
			reject: function reject(err) {
				complete = -1;
				value = err;
				for (var i=0; i < callbacks.length; i++) {
					var cb = callbacks[i].reject;
					if(cb) cb(value);
				};
			},

			then: then,
			
			safe: {
				then: then
			}
		};
	}

	/*
		Function: PresentationModel
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

		function preloadSlides(start, n) {
			var i = start,
				end = start + n;
						
			function preloadNext() {
				if(i < end) {
					getSlide(i++).then(preloadNext);
				}
			}

			preloadNext();
		}
		
		function getSlide(slide, preloadCount) {
			var p = promise(),
				slideModule = 'text!' + slidePath + '/' + slide + '.html';

			if(0 <= slide) {
				if(cachedSlides[slide]) {
					p.resolve({ slide: slide, content: cachedSlides[slide] });
				} else {
					require([slideModule], function(slideContent) {
						if(/404/.test(slideContent)) {
							p.reject(slide);
						} else {
							cachedSlides[slide] = slideContent;
							p.resolve({ slide: slide, content: slideContent });
						}
					});
				}
				
				if(preloadCount && (cachedSlides.length - slide) <= preloadThreshold) {
					preloadSlides(slide + 1, preloadCount);
				}
				
			} else {
				p.reject(slide);
			}
			
			return p.safe;
		}

		return {
			get: function(slide) {
				return getSlide(slide, preloadCount);
			}
		};
		
	};
});