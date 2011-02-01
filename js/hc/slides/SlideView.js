/**
 * @license Copyright (c) 2010 Brian Cavalier
 * LICENSE: see the LICENSE.txt file. If file is missing, this file is subject
 * to the MIT License at: http://www.opensource.org/licenses/mit-license.php.
 */
define([], function() {
	
	var slideBeforeState = 'slide slide-before',
		slideAfterState = 'slide slide-after',
		slideCurrentState = 'slide slide-current',
		slideContainerIdentity = 'slide-view-module',
		slideContainerTransitioningState = slideContainerIdentity + ' slide-transitioning',
		undef;
	
	return function SlideView(slideContainer, slideModel) {
		
		var current = -1,
			slides = [],
			container;
		
		function next() {
			return go(current+1);
		}
		
		function prev() {
			return go(current-1);
		}
		
		function reset() {
			return go(0);
		}
		
		function go(slide) {
			var p = slideModel.get(slide);
			if(slide == current) {
				return p;
			}
			
			function reject(num) {
				console.log("No such slide", num);
			}
			
			if(!slides[slide]) {
				container.className = slideContainerTransitioningState;
				p.then(
					function(result) {
						addSlide(slide, result.content);
					},
					reject
				);
			} else {
				p.then(
					function() {
						transitionToSlide(slide);
					},
					reject
				);
			}
			
			return p;
		}
		
		function addSlide(slide, slideContent) {
			var holder = document.createElement('div');
			holder.className = (slide < current) ? slideBeforeState : slideAfterState;
			holder.id = slide;
			holder.innerHTML = slideContent;

			var children = container.childNodes;
			if(slide < current) {
				slides[slide] = container.insertBefore(holder, slides[current]);
			} else {
				slides[slide] = container.appendChild(holder);
			}
			
			// Defer so DOM has a chance to add the new slide before we transition it
			setTimeout(function() {
				transitionToSlide(slide);
			}, 0);
		}
		
		function transitionToSlide(slide) {
			var dx = slide - current,
				prev = current;
				
			current = slide;
			slides[current].className = slideCurrentState;

			if(dx === -1 && dx === 1) {
				if(slides[prev]) {
					slides[prev].className = prev < current ? slideBeforeState : slideAfterState;
				}

			} else {
				for(var i=0; i<slides.length; i++) {
					var s = slides[i];
					if(s) {
						if(i < current) {
							s.className = slideBeforeState;
						} else if(i > current) {
							s.className = slideAfterState;
						}
					}
				}
				
			}
			
		}

		// Create a controlled container to hold slides
		container = document.createElement('div');
		container.className = 'slide-view-module';
		slideContainer.innerHTML = '';
		slideContainer.appendChild(container);
		
		return {
			next: next,
			prev: prev,
			go: go,
			reset: reset
		};
	};

});