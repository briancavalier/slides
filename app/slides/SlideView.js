/* @license Copyright (c) 2011-2013 Brian Cavalier */
/*
	Class: SlideView
*/
define([], function() {
	
	// OOCSS States for slides and slide container
	var slideBeforeState = 'slide slide-before',
		slideAfterState = 'slide slide-after',
		slideCurrentState = 'slide slide-current',
		slideContainerIdentity = 'slide-view-module',
		slideContainerLoadingState = slideContainerIdentity + ' slide-view-loading',
		slideContainerTransitioningState = slideContainerIdentity + ' slide-transitioning',
		undef;
	
	/*
		Constructor: SlideView
		Creates a new SlideView
		
		Parameters:
			slideContainer - DomNode into which slides will be added
			slideModel - model that supplies slides via a get(slideNumber) function, such as <PresentationModel>
			
		Returns:
		a new SlideView
	*/
	return function SlideView(slideContainer, slideModel) {
		
		var current = -1,
			slides = [],
			container;
		
		/*
			Function: next
			Goes to the next slide, if one exists.
			
			Returns:
			a promise that will be resolved when the new slide has been displayed
		*/
		function next() {
			return go(current+1);
		}
		
		/*
			Function: prev
			Goes to the previous slide, if one exists.
			
			Returns:
			a promise that will be resolved when the new slide has been displayed
		*/
		function prev() {
			return go(current-1);
		}
		
		/*
			Function: reset
			Goes to the first slide
			
			Returns:
			a promise that will be resolved when the new slide has been displayed
		*/
		function reset() {
			return go(0);
		}
		
		/*
			Function: go
			Goes to the supplied slide number (zero-based index)
			
			Parameters:
				slide - number of the slide to go to

			Returns:
			a promise that will be resolved when the new slide has been displayed
		*/
		function go(slide) {
			var p = slideModel.get(slide);
			if(slide == current) {
				return p;
			} else if(slide < 0) {
				
			}
			
			function reject(num) {
				console.log("No such slide", num);
				console.error(num);
			}
			
			if(!slides[slide]) {
				// container.className = slideContainerTransitioningState;
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
			
			// TODO: Need to listen for transitionend here for browsers that support it.
			container.className = slideContainerIdentity;
		}

		// Create a controlled container to hold slides
		container = document.createElement('div');
		container.className = slideContainerLoadingState;
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