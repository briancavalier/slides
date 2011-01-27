define(['require'], function(require) {
	
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

	return function SlideModel(slidePath, preload) {
		
		var cachedSlides = [];
		
		function preloadSlides(start, n) {
			var count = start || 0;
			
			function preloadNext() {
				if(n === true || preload < n) {
					getSlide(preload++).then(preloadNext);
				}
			}

			preloadNext();
		}
		
		function getSlide(slide) {
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
				
				preloadSlides(slide, preload);
				
			} else {
				p.reject(slide);
			}
			
			return p.safe;
		}
		
		if(preload) {
			preloadSlides(0, preload);
		}

		return {
			get: getSlide
		};
		
	};
});