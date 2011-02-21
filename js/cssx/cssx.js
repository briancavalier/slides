/**
 * Copyright (c) 2010 unscriptable.com
 */

/*jslint browser:true, on:true, sub:true */

/**
 * cssx instructions can be located in any of three places:
 * 1. as directives at the top of css files
 * 2. as loader suffixes
 * 3. as global configuration options
 *
 * global configuration options
 *
 * TODO: revisit these config options ad suffixes
 * cssxIgnore: Array of Strings or String
 * Set cssxIgnore to a list of cssx plugin names to ignore. Optionally,
 * set it to "all" to ignore all plugin names found in css files.
 * Use the !inspect loader suffix or directive to override cssxIgnore.
 *
 * TODO: remove preloads
 * cssxPreload: Array
 * Set cssxPreload to a list of names of plugins that should be loaded
 * before processing any css files. Unless overridden by an !ignore
 * loader suffix or directive in a css file, all css files
 * will be scanned by these plugins.
 *
 * TODO: remove cssxAuto
 * cssxAuto: Boolean, default = true
 * Set cssxAuto to false to prevent cssx from attempting to
 * automatically download and apply plugins that are discovered
 * in css rules.  For instance, if a -cssx-scrollbar-width property is
 * found in a rule, cssx will normally load the "scrollbar" plugin
 * and create a rule to supply the correct value. If cssxAuto is
 * false, cssx will ignore -cssx-scrollbar-width unless the plugin was
 * preloaded or specified in a directive.
 *
 * cssxDirectiveLimit: Number, default = 200
 * Set cssxDirectiveLimit to the number of characters into a css file
 * to look for cssx directives before giving up.  Set this to zero
 * if you don't want cssx to scan for directives at all.  Set it to
 * a very high number if you're concatenating css files together!
 * Override this via the !limit loader suffix.
 *
 * Suffixes can be applied to resources when listed as a dependency.
 * e.g. define(['cssx/cssx!myModule!ignore=ieLayout'], callback);
 *
 * Available suffixes:
 * !ignore: a comma-separated list of cssx plugins to ignore
 * TODO: remove: !inspect: a comma-separated list of cssx plugins to run
 * !scanlimit: the number of characters into the css file to search
 * 		for cssx directives
 *
 */

define(
	[
		'require',
		'./css',
		'./common',
		'./CssTextParser',
		'./sniff',
		'./shim/_bundles',
		'./shim/_tests'
	],
	function (require, css, common, CssTextParser, sniff, bundles, tests) {
		"use strict";

		// TODO: rewrite css.js using promises and inherit Promise from there
		function Promise () {
			this._thens = [];
		}

		Promise.prototype = {

			then: function (resolve, reject) {
				// capture calls to then()
				this._thens.push({ resolve: resolve, reject: reject });
				return this;
			},

			resolve: function (val) { this._complete('resolve', val); },

			reject: function (ex) { this._complete('reject', ex); },

			_complete: function (which, arg) {
				// switch over to sync then()
				this.then = which === 'resolve' ?
					function (resolve, reject) { resolve && resolve(arg); return this; } :
					function (resolve, reject) { reject && reject(arg); return this; };
				// disallow multiple calls to resolve or reject
				this.resolve = this.reject =
					function () { throw new Error('Promise already completed.'); };
				// complete all async then()s
				var aThen, i = 0;
				while (aThen = this._thens[i++]) { aThen[which] && aThen[which](arg); }
				delete this._thens;
			}

		};

		var
//			preloading,
			undef,
			shims;

//		function checkCssxDirectives (text) {
//			// check for any cssx markers in the file
//			// limit this search to the first XXX lines or first XXX chars
//			var top = text.substr(0, 500),
//				optMatches = text.match(/\s?\/*\s?cssx:(.*?)(?:$|;|\*\/)/m),
//				opts = {},
//				opText, pair;
//			while (opText = optMatches.unshift()) {
//				var pairs = optMatches[i].split(/\s?,\s?/), opt;
//				while (opt = pairs.unshift()) {
//					pair = opt.split(/\s?\.\s?/);
//					opts[pair[0]] = pair[1];
//				}
//			}
//			return opts;
//		}

		function listHasItem (list, item) {
			return list ? (',' + list + ',').indexOf(',' + item + ',') >= 0 : false;
		}

//		function chain (func, after) {
//			return function (processor, args) {
//				func(processor, args);
//				after(processor, args);
//			};
//		}

		function applyCssx (processor, cssText, plugins) {
			// attach plugin callbacks
			var callbacks = {
					onSheet: undef,
					onRule: undef,
					onEndRule: undef,
					onAtRule: undef,
					onImport: undef,
					onSelector: undef,
					onProperty: undef
				},
				count = 0;
			try {
				for (var p in callbacks) (function (cb, p) {
					for (var i = 0; i < plugins.length; i++) {
						if (plugins[i][p]) {
							cb = function (processor, args) {
								cb && cb(processor, args);
								plugins[i][p](processor, args);
							};
	//						cb = chain(cb, plugins[i][p]);
							count++;
						}
					}
					if (cb !== undef) {
						callbacks[p] = function () { cb(processor, arguments); }
					}
				}(callbacks[p], p));
				if (count > 0) {
					// TODO: parse file, applying cssx fixes as found
					new CssTextParser(callbacks).parse(cssText);
				}
				processor.resolve(processor.cssText);
			}
			catch (ex) {
				processor.reject(ex);
			}
		}

		function getShims (require, callback) {
			// get the list of bundles
//			require(['./shim/_bundles'], function (bundles) {
				var bundleName;
				// find the one that first matches our user agent
				for (var n in bundles) {
					if (n !== 'default') {
						var ctx = {}, env = { isBuild: false }; // TODO: build-time
						if (bundles[n].test === true || bundles[n].test(env, sniff, ctx)) {
							bundleName = bundles[n].name;
							break;
						}
					}
				}
				// fetch it and return the bundle of shims
				require([bundleName || bundles['default'].name], function (bundle) {
					callback(bundle);
				});
//			});
		}

		function runFeatureTests (require, shims, callback) {
			// get all of the feature tests
//			require(['./shim/_tests'], function (tests) {
				// collect any that fail
				var failed = [];
				for (var n in tests) {
					var ctx = {}, env = { isBuild: false }; // TODO: build-time
					// only test for the shims that we don't already have
					if (!(n in shims) && !tests[n].test(env, sniff, ctx)) {
						failed.push(tests[n].name);
					}
				}
				// get the shims for those
				require(failed, function () {
					for (var i = 0; i < failed.length; i++) {
						shims[failed[i]] = arguments[i];
					}
					callback(shims);
				});
//			});
		}

		function getAllShims (require, callback) {
			getShims(require, function (bundle) {
				runFeatureTests(require, bundle, callback);
			});
		}

		getAllShims(require, function (allShims) {
			shims = allShims;
		});

		return common.beget(css, {

			version: '0.1',

			load: function (name, require, callback, config) {

				// create a promise
				var processor = new Promise();

				// add some useful stuff to it
				processor.cssText = '';
				processor.appendRule = function (objOrArray) {
					var rules = [].concat(objOrArray),
						rule, i = 0;
					while (rule = rules[i++]) {
						this.cssText += rule;
					}
				};

				// tell promise to write out style element when it's resolved
				processor.then(function (cssText) {
					// TODO: finish this
					if (cssText) createStyleNode(cssText, cssDef.link);
				});

				// tell promise to call back to the loader
				processor.then(
					callback.resolve ? callback.resolve : callback,
					callback.reject ? callback.reject : undef
				);

//				// check for preloads
//				if (preloading === undef) {
//					preloading = true;
//					var preloads = [];
//					for (var p in activations) {
//						if (activations.hasOwnProperty(p)) {
//							// TODO: supply the environment parameter
//							if (activations.load({ isBuild: false }, sniff)) {
//								preloads.push('./plugin/' + p);
//							}
//						}
//					}
//					require(preloads, function () { preloading = false; process(); });
//				}
//				else {
//					preloading = false;
//				}

				// check for special instructions (via suffixes) on the name 
				var opts = css.parseSuffixes(name),
					dontExecCssx = config.cssxDirectiveLimit <= 0 && listHasItem(opts.ignore, 'all'),
					cssDef = {};

				function process () {
//					if (!preloading) {
						if (cssDef.link) {
							if (dontExecCssx) {
								callback(cssDef);
							}
							else if (cssDef.cssText != undef /* truthy if null or undefined, but not "" */) {
								// TODO: get directives in file to see what rules to skip/exclude
								//var directives = checkCssxDirectives(cssDef.cssText);
								// TODO: get list of excludes from suffixes


//								var directives = [];
//								require(directives, function () {
									applyCssx(processor, cssDef, cssText, Array.prototype.slice.call(arguments, 0));
//								});
							}
						}
//					}
				}

				function gotLink (link) {
					cssDef.link = link;
					process();
				}

				function gotText (text) {
					cssDef.cssText = text;
					process();
				}

				// get css file (link) via the css plugin
				css.load(name, require, gotLink, config);
				if (!dontExecCssx) {
					// get the text of the file, too
					require(['text!' + name], gotText);
				}

			}

		});

	}
);
