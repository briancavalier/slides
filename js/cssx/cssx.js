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
 * Suffixes can be applied to resources when listed as a dependency.
 * e.g. define(['cssx/cssx!myModule!ignore=ieLayout'], callback);
 *
 * Available suffixes:
 * !ignore: a comma-separated list of cssx plugins to ignore
 *
 * 	TODO: loading of the imported sheet must be chained!
 *
 */

define(
	[
		'./shims',
		'./CssTextParser'
	],
	function (shims, CssTextParser) {

		var
			undef,
			debugMode,
			head = document.head || document.getElementsByTagName('head')[0],
			// this actually tests for absolute urls and root-relative urls
			// they're both non-relative
			nonRelUrlRe = /^\/|^[^:]*:\/\//,
			// Note: this will fail if there are parentheses in the url
			findUrlRx = /(?:url\()[^\)]*(?:\))/g,
			stripUrlRx = /url\(\s*["']?|["']?\s*\)/g,
			activeShims = {};

		function nameWithExt (name, defaultExt) {
			return name.lastIndexOf('.') <= name.lastIndexOf('/') ?
				name + '.' + defaultExt : name;
		}

		function parseSuffixes (name) {
			// creates a dual-structure: both an array and a hashmap
			// suffixes[0] is the actual name
			var parts = name.split('!'),
				suf, i = 1, pair;
			while ((suf = parts[i++])) { // double-parens to avoid jslint griping
				pair = suf.split('=', 2);
				parts[pair[0]] = pair.length == 2 ? pair[1] : true;
			}
			return parts;
		}

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
					function (resolved, rejected) { resolved && resolved(arg); return this; } :
					function (resolved, rejected) { rejected && rejected(arg); return this; };
				// complete all async then()s
				var aThen;
				while (aThen = this._thens.shift()) { aThen[which] && aThen[which](arg); }
				delete this._thens;
				// disallow multiple calls to resolve or reject
				this.resolve = this.reject =
					function () { throw new Error('Promise already completed.'); };
			}

		};

		function CssProcessor (processors) {
			Promise.call(this);
			this.input = '';
			// since this code is mostly for IE, we're using IE-friendly string concatenation:
			this.output = [];
			this.processors = processors;
		}
		CssProcessor.prototype = new Promise();

		CssProcessor.prototype.getOutput = function () {
			return this.output.join('');
		};

		CssProcessor.prototype.onRule = function (selectors) {
			// onRule processors should output anything that needs to be output
			// before processing the current rule. They should not output
			// anything for the current rule.
			var self = this, result, output, first = true, modified;

			each(this.processors.onRule, function (processor) {
				result = processor(selectors);
				if (result) {
					modified = true;
					self.output.push(result);
				}
			});

			// onSelector processors should process the current selector only.
			for (var i = 0, len = selectors.length; i < len; i++) {
				output = selectors[i];
				each(this.processors.onSelector, function (processor) {
					result = processor(output);
					if (typeof result == 'string') {
						modified = true;
						output = result;
					}
				});
				if (output) {
					this.output.push(first ? output : ',' + output);
					first = false;
				}
			}

			if (debugMode && modified) {
				this.output.push('\n/* ', selectors.join(','), ' */\n');
			}

			this.output.push('{\n');
		};

		CssProcessor.prototype.onProperty = function (name, value, selectors) {
			// process any callbacks for custom property names or catch-all value callbacks
			var result, orig = value, output = [], modified;

			// fix any urls.
			var basePath = this.basePath;
			value = (value || '').replace(findUrlRx, function (url) {
				modified = true;
				return translateUrl(url, basePath);
			});

			// process the value through any onValue processors
			each(this.processors.onValue, function (processor) {
				result = processor(name, value, selectors);
				if (typeof result == 'string' && result != value) {
					modified = true;
					value = result;
				}
			});

			each(this.processors.onProperty, function (processor) {
				result = processor(name, value, selectors);
				if (typeof result == 'string') {
					modified = true;
					output.push(result);
				}
			});

			each(this.processors[name], function (processor) {
				result = processor(name, value, selectors);
				if (typeof result == 'string') {
					modified = true;
					output.push(result);
				}
			});

			if (debugMode && modified) {
				this.output.push('\t/* ', name, ':', orig, '; */\n');
			}

			// create default output if we didn't get any from the shims
			if (output.length) {
				this.output.concat(output);
			}
			else {
				this.output.push('\t', name, ':', value, ';\n');
			}

		};

		CssProcessor.prototype.onEndRule = function (selectors) {
			// onEndRule processors should output anything that needs to be output
			// after processing the current rule. They should not output
			// anything for the current rule.
			var self = this, result;
			// onEndRule processors should not output a closing brace!
			this.output.push('}\n');
			each(this.processors.onEndRule, function (processor) {
				result = processor(selectors);
				if (result) {
					self.output.push(result, '\n');
				}
			});
		};

		CssProcessor.prototype.onAtRule = function (keyword, data, hasBlock) {
			// just reproduce it
			this.output.push('@', keyword, (data ? ' ' + data : ''), (hasBlock ? '{' : ';'), '\n');
		};

		CssProcessor.prototype.onImport = function (url, media) {
			// @import processing
			var newUrl;
			if (!media || /\b(screen|all|handheld)\b/i.test(media)) {
				newUrl = url;// translateUrl(url, this.basePath, true);
				// TODO: loading of the imported sheet must be chained!
				this.loadImport(newUrl);
			}
		};

		function each (array, callback) {
			for (var i = 0, len = array && array.length; i < len; i++) {
				callback(array[i], i, array);
			}

		}

		function listHasItem (list, item) {
			return list ? (',' + list + ',').indexOf(',' + item + ',') >= 0 : false;
		}

		function applyCssx (processor) {
			try {
				new CssTextParser(processor, processor).parse(processor.input);
				processor.resolve(processor.getOutput());
			}
			catch (ex) {
				processor.reject(ex);
			}
		}

		// go get shims
		var shimCallback = new Promise();
		shims(function (allShims) {

			// collect shim handlers
			for (var i in allShims) {
				for (var p in allShims[i]) {
					if (!(p in {})) {
						if (!activeShims[p]) {
							activeShims[p] = [];
						}
						activeShims[p].push(allShims[i][p]);
					}
				}
			}

			shimCallback.resolve();

		});

		function has (feature) {
			return hasFeatures[feature];
		}

		function translateUrl (url, parentPath, bare) {
			var path = url.replace(stripUrlRx, '');
			// if this is a relative url
			if (!nonRelUrlRe.test(path)) {
				// append path onto it
				path = parentPath + path;
			}
			return bare ? path : 'url("' + path + '")';
		}

		var currentSheet, currentSheetId = 0;
		function getStylesheet (name, parentSheet) {
			if (has('dom-create-stylesheet')) {
				// this is a lame attempt to avoid 4000-rule limit of IE
				if (!currentSheet || currentSheet.rules.length > 3000) {
					currentSheet = document.createStyleSheet();
					// since we're combining files, name is not imprecise,
					// so we generate an id
					currentSheet.id = currentSheetId++;
				}
				return currentSheet;
			}
			else {
				// we can use standard <style> element creation
				var node = document.createElement("style");
				node.setAttribute("type", "text/css");
				if (parentSheet) {
					head.insertBefore(node, parentSheet);
				}
				else {
					head.appendChild(node);
				}
				node.setAttribute('id', name);
				return node;
			}
		}

		var cssxSheets = [];
		function insertCss (sheet, css) {
			if (has('stylesheet-cssText')) {
				// IE mangles cssText if you try to read it out, so we have
				// to save a copy of the originals in cssxSheets;
				var id = sheet.id;
				var sheets = cssxSheets[id] = cssxSheets[id] || [];
				sheets.push(css);
				sheet.cssText = sheets.join('\n\n/************/\n\n');
			}
			else {
				sheet.appendChild(document.createTextNode(css));
			}
		}

		var hasFeatures = {
			'dom-create-stylesheet': !!document.createStyleSheet,
			'stylesheet-cssText': document.createStyleSheet &&
				(currentSheet = document.createStyleSheet()) &&
				('cssText' in currentSheet)
		};



		/***** xhr *****/

		var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];

		function xhr () {
			if (typeof XMLHttpRequest !== "undefined") {
				// rewrite the getXhr method to always return the native implementation
				xhr = function () { return new XMLHttpRequest(); };
			}
			else {
				// keep trying progIds until we find the correct one, then rewrite the getXhr method
				// to always return that one.
				var noXhr = xhr = function () {
						throw new Error("XMLHttpRequest not available");
					};
				while (progIds.length > 0 && xhr == noXhr) (function (id) {
					try {
						new ActiveXObject(id);
						xhr = function () { return new ActiveXObject(id); };
					}
					catch (ex) {}
				}(progIds.shift()));
			}
			return xhr();
		}

		function fetchText (url, callback, errback) {
			var x = xhr();
			x.open('GET', url, true);
			if (x.overrideMimeType) {
				x.overrideMimeType('text/plain');
			}
			x.onreadystatechange = function (e) {
				if (x.readyState === 4) {
					if (x.status < 400) {
						callback(x.responseText);
					}
					else {
						errback(new Error('fetchText() failed. status: ' + x.statusText));
					}
				}
			};
			x.send(null);
		}

		function isXDomain (url, doc) {
			// using rules at https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript
			// Note: file:/// urls are not handled by this function!
			// See also: http://en.wikipedia.org/wiki/Same_origin_policy
			if (!/:\/\/|^\/\//.test(url)) {
				// relative urls are always same domain, duh
				return false;
			}
			else {
				// same domain means same protocol, same host, same port
				// exception: document.domain can override host (see link above)
				var loc = doc.location,
					parts = url.match(/([^:]+:)\/\/([^:\/]+)(?::([^\/]+)\/)?/);
				return (
					loc.protocol !== parts[1] ||
					(doc.domain !== parts[2] && loc.host !== parts[2]) ||
					loc.port !== (parts[3] || '')
				);
			}
		}


		function load (name, require, callback, config, parentSheet) {

			function fail (ex) {
				if (callback.reject) callback.reject(ex); else throw ex;
			}

			function resolve (val) {
				callback.resolve ? callback.resolve() : callback();
			}

			debugMode = config['cssxDebug'];

			shimCallback.then(
				function () {

					// create a promise
					var processor = new CssProcessor(activeShims),
						stylesheet = getStylesheet(name, parentSheet),
						relPath = name.substr(0, name.lastIndexOf('/') + 1);

					// add some useful stuff to it
					processor.input = '';
					processor.basePath = require['toUrl'](relPath);
					processor.loadImport = function (imported) {
						// TODO: move imported stylesheet before parent
						// TODO: somehow move @imported rules before current rules in IE
						var promise = new Promise(),
							url = relPath + imported;
						load(url, require, promise, config, stylesheet);
					};

					// TODO:
					// 1. create a load method for @imports to use



					// tell promise to write out style element when it's resolved
					processor.then(function (cssText) {
						if (cssText) insertCss(stylesheet, cssText);
					});

					// tell promise to call back to the loader
					processor.then(resolve, fail);

					// check for special instructions (via suffixes) on the name
					var opts = parseSuffixes(name),
						dontExecCssx = config.cssxDirectiveLimit <= 0 && listHasItem(opts.ignore, 'all');

					function process () {
						if (dontExecCssx) {
							processor.resolve(processor.input);
						}
						else if (processor.input != undef /* truthy if null or undefined, but not "" */) {
							// TODO: get directives in file to see what rules to skip/exclude
							//var directives = checkCssxDirectives(processor.input);
							// TODO: get list of excludes from suffixes
							applyCssx(processor);
						}
					}

					function gotLink (link) {
						processor.link = link;
						processor.resolve();
					}

					function gotText (text) {
						processor.input = text;
						process();
					}

					var url = require['toUrl'](nameWithExt(name, 'css'));

					if (isXDomain(url, document)) {
						// we can't do x-domain!
						fail(new Error('Can\'t process x-domain stylesheet: ' + url));
					}
					else {
						// get the text of the file
						// TODO: pass a promise, not just a callback
						fetchText(url, gotText, fail);
					}

					// TODO: return something useful to the user like a stylesheet abstraction
					// not the processor
					return processor;

				},
				fail
			);

		}

		/***** the plugin *****/
		
		return {

			version: '0.2',

			load: function (name, require, callback, config) {
				return load(name, require, callback, config);
			}

		};

	}
);

