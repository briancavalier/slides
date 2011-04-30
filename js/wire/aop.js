/**
 * @license Copyright (c) 2011 Brian Cavalier
 * LICENSE: see the LICENSE.txt file. If file is missing, this file is subject
 * to the MIT License at: http://www.opensource.org/licenses/mit-license.php.
 */

/*
	File: aop.js
*/
define(['require'], function(require) {

	function decorateAspect(decorators, promise, aspect, wire) {
		var target, options, promises;

		target = aspect.target;
		options = aspect.options;
		promises = [];

		for(var d in options) {
			var args, p;

			args = options[d];
			p = wire.deferred();
			promises.push(p);

			(function(p, decorator, args) {

				require([decorator], function(Decorator) {

					if(args) {
						wire(args).then(function(resolvedArgs) {
							applyDecorator(target, Decorator, resolvedArgs);
							p.resolve();
						});

					} else {
						applyDecorator(target, Decorator);
						p.resolve();

					}
				});				

			})(p, decorators[d]||d, options[d]);
		}

		wire.whenAll(promises).then(function() {
			promise.resolve();
		});

	}

	function applyDecorator(target, Decorator, args) {
		args = args ? [target].concat(args) : [target];

		Decorator.apply(null, args);
	}

	function adviceAspect(promise, aspect, wire) {
		promise.resolve();
	}

	return {
		/*
			Function: wire$plugin
			Invoked when wiring starts and provides two promises: one for wiring the context,
			and one for destroying the context.  Plugins should register resolve, reject, and
			promise handlers as necessary to do their work.
			
			Parameters:
				ready - promise that will be resolved when the context has been wired, rejected
					if there is an error during the wiring process, and will receive progress
					events for object creation, property setting, and initialization.
				destroy - promise that will be resolved when the context has been destroyed,
					rejected if there is an error while destroying the context, and will
					receive progress events for objects being destroyed.
		*/
		wire$plugin: function(ready, destroyed, options) {
			var decorators = options.decorators||{};

			return {
				aspects: {
					advice: {
						configured: adviceAspect
					},
					decorate: {
						configured: function(promise, aspect, wire) {
							decorateAspect(decorators, promise, aspect, wire);
						}
					}
				}
			};
		}
	};
});