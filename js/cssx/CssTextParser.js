/*
    cssx/CssTextParser
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.
*/

define(function () {

	var toString = {}.toString,
		slice = [].slice;

	function isArray (o) {
		return toString.call(o) == '[object Array]';
	}

	function partial (func) {
		// pre-applies arguments to a function
		var args = slice.call(arguments, 1);
		return function () {
			return func.apply(this, args.concat(slice.call(arguments)));
		}
	}

	function every (a, cb) {
		var e = true, i, len = a.length;
		for (i = 0; i < len && e; i++) {
			e = cb(a[i], i, a);
		}
		return e;
	}

	function F () {}
	function beget (base, props) {
		F.prototype = base;
		var o = new F();
		if (props) {
			for (var p in props) {
				o[p] = props[p];
			}
		}
		delete F.prototype;
		return o;
	}

	return function (/* Object */ cb, /* Object? */ ctx) {
		//  summary: A fast, flexible event-based CSS TEXT parser in under 3kB! (minified)
		//      See also the cssx.cssDomParser!
		//  cb: Object
		//      The cb parameter is a configuration object supplying callbacks that are called whenever
		//      a new object is encountered in the CSS object hierarchy. Return an explicit false (not
		//      a falsy value) from the callback to terminate processing that branch in the hierarchy.
		//      For instance, to abort the parsing of the current rule, return false from the onRule
		//      callback. To abort parsing of the current sheet, return false from the onSheet callback.
		//      Call the stop() method to stop parsing altogether. The signatures of the callbacks
		//      are as follows:
		//          onSheet: function (/* String */ ss) {}
		//          onRule: function (/* String|Array */ selectors, /* String */ ss) {}
		//          onEndRule: function (/* String|Array */ selectors, /* String */ ss) {}
		//          onAtRule: function (/* String */ keyword, /* String */ data, /* Boolean */ hasBlock, /* String */ ss) {}
		//          onImport: function (/* String */ url, /* String */ media, /* String */ ss) {}
		//          onSelector: function (/* String */ selector, /* String */ ss) {}
		//          onProperty: function (/* String */ propName, /* String */ value, /* String|Array */ selectors, /* String */ ss) {}
		//      This css parser will only dig into the stylesheet as deeply as you require. If
		//      you don't supply an onSelector or onProperty callback, it will not process that deeply.
		//      Other properties of cb:
		//          mediaTypes: Array of String. Default = ['screen', 'all']. The list of media
		//              types that should be considered valid for this style sheet.  Typically,
		//              you'd only have to change this for mobile devices that don't support 'screen'.
		//          dontSplit: Boolean. Prevents the parser from splitting compound selectors into
		//              multiple single selectors.  See Notes below.
		//          context: Object. If supplied, runs the callbacks in the context of this object.
		//              If missing, runs the callbacks in the context of the CssParser instance.
		//
		//  Notes:
		//      1.  The selectors are split at the comma in compound selectors, e.g. the selector,
		//          ".dijitFoo, .dijitBar", results in two onSelector callbacks: one for ".dijitFoo"
		//          and one for ".dijitBar". If you don't want the selector split, supply a truthy
		//          dontSplit property on the cb parameter.
		//      2.  Only one of onImport or onAtRule are executed.  If the parser encounters an @import
		//          at-rule and the onImport callback exists, it is executed instead of onAtRule.
		//      3.  Stray commas and semicolons between rules or selectors cause the next rule to be
		//          ignored  in the browser(syntax error). This behavior is emulated.
		//          Therefore, the following rule is not processed:
		//              .class1, , class2 { height: auto; }
		//          However, gecko collapses the rules in any applicable @media blocks (screen, all)
		//          into the top-level rules. This causes gecko to drop a rule following a @media block
		//          if the @media block has a stray semicolon or comma at the very end.  This behavior
		//          is NOT emulated.
		//      4.  Stray commas between declarations or within property names cause the next
		//          declaration to be ignored in the browser (syntax error). However, this parser will
		//          include the comma in the property name instead. This is acceptable in most
		//          circumstances since the calling code will likely be matching for an exact
		//          property name.  The following property is (improperly) processed:
		//              .class1 { height,width: auto; }
		//          The property name is detected as "height,width"!
		//
		//  Example 1:
		//        var myCallbacks = {
		//                dontSplit: true,
		//                onSelector: function (st, ss) { console.log(st, ss); }
		//            };
		//        (new CssParser(myCallbacks)).parse();
		//  Example 2:
		//        function checkRuleForOpacity (rule, style, sheet) {
		//            /* stop all processing if we hit a style property for opacity */
		//            if (style.match(/opacity|rgba/))
		//                this.stop();
		//        }
		//        var canceled = !(new CssParser({onRule: checkRuleForOpacity})).parse();
		//
		//  TODO: if there are no onSelector or onProperty callbacks, skip the selector and declaration
		//      sections? We could do this with some new states: skipSel and skipDecl
		//  TODO: figure out where to apply error handling
		//  TODO: test continuation logic (c)
		//  TODO: figure out if dontSplit can be more efficient (don't split and then join)

		var
			// context in which to execute callbacks
			// flag to detect if user has stopped (c is short for "continue")
			c = true,
			// map of the top-level state machine transition functions.
			trans = {
				',': comma,
				';': semi,
				'@': atRule,
				'{': block,
				'}': unblock,
				'/*': partial(skip, /\*\//g, false),
				'<!--': cd,
				'-->': cd,
				'"': partial(skip, /[^\\]"/g, true),
				"'": partial(skip, /[^\\]'/g, true),
				'""': passthru,
				"''": passthru
			},
			// regex to detect state transitions
			rxSs = /\s*(.*?)\s*?(,|;|@|{|}|\/\*|""?|''?|<!--|-->)/g,
			// regex to extract import url (and media type)
			rxUrl = /(?:url\s*\((["'])?(.*?)\1?\)|(["'])(.*?)\3)\s*(.*|$)/,
			// media types regex
			rxMTypes,
			// preventative measure
			undefined;

		this.parse = function (/* String|Array */ w) {

			//  summary: Call parse to start parsing the css.
			//  w: String|Array - The raw text of the sheet to parse or a list of several sheets.
			//  return Boolean. true == parse was not stopped; false == it was stopped.
			c = true;
			ctx = ctx || cb.context || this;
			// If mediaTypes were supplied...
			if (cb.mediaTypes)
				// ...recreate the media types regex.
				rxMTypes = new RegExp('\b(?:' + cb.mediaTypes.join('|') + ')\b', 'i');
			else
				rxMTypes = /\b(?:screen|all|handheld)\b/i;
			if (!isArray(w)) w = [w];
			every(w, function (ss) {
				if (!cb.onSheet || cb.onSheet.call(ctx, ss) !== false && c) {
					rxSs.lastIndex = 0; // reset
					var data = {state: 'top', pre: [], sel: []};
					iter(ss, data);
				}
				return c;
			});
			return c;
		};

		this.stop = function () {
			//  summary: Call stop() from within a callback to stop parsing.
			c = false;
		};

		function iter (ss, sd) {
	//console.warn('begin', sd.state);
			// This is the main loop. Transition functions may call this function recursively to
			// process a block.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			var match;
			// while we're not stopped and we found more text
			while (c && !sd.stop && (match = rxSs.exec(ss))) { // intentional assignment
				// record the text we found so far
				sd.pre.push(match[1]);
				// execute the transition function
				trans[match[2]](ss, sd);
			}
	//console.warn('end', sd.state);
		}

		function comma (ss, sd) {
			// A comma was encountered.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			switch (sd.state) {
				case 'top': // This is the end of a selector for a top-level declaration rule.
				case 'media': // This is the end of a selector for a declaration rule in a valid media block.
					var s = cat(sd);
					if (s)
						// collect this selector
						sd.sel.push(s);
					else {
						// a stray comma caused a syntax error
						dn(ss, sd, 'error');
						sd.stop = true;
					}
					break;
				case 'at': // This is the end of an item in a list in an at-rule (e.g. media types)
				case 'decl': // This is the end of an item in a property declaration (e.g. font-family).
					sd.pre.push(',');
					break;
			}
		}

		function semi (ss, sd) {
			// A semicolon was encountered.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			switch (sd.state) {
				case 'at': // This is the end of an at-rule.
					// at-rules are invalid once the first block is found
					if (!sd.blockFound) {
						var s = cat(sd),
							parts = s.split(/\s+/, 2);
						if (!sd.stop && cb.onImport && parts[0].match(/^import$/i)) {
							// call onImport
							var m = parts[1].match(rxUrl),
								media = m[5];
							if (!media || media.match(rxMTypes))
								sd.stop = cb.onImport.call(ctx, m[2] || m[4], media, ss) === false;
						}
						else if (!sd.stop && cb.onAtRule) {
							// call onAtRule
							sd.stop = cb.onAtRule.call(ctx, parts[0], parts[1], false, ss) === false;
						}
					}
					sd.stop = true;
					break;
				case 'decl': // This is the end of a style property declaration.
					if (cb.onProperty)
						sd.stop = prop(cat(sd), sd.sel, ss);
					break;
				case 'ignore': // This is the end of an ignored at-rule.
					sd.stop = true;
					break;
				default: // This must be a stray semicolon at the top level.
					// the next block is invalid
					dn(ss, sd, 'error');
					sd.stop = true;
					break;
			}
		}

		function atRule (ss, sd) {
			// An at-rule was encountered.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			// Note: at-rules after or inside any block are ignored per the CSS2.1 spec.
			dn(ss, sd, 'at');
		}

		function block (ss, sd) {
			// A start-of-block transition was encountered.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			sd.blockFound = true; // We've found at least one block.
			var s = cat(sd); // Collect all pre-transition text.
			switch (sd.state) {
				case 'top': // This is the start of a top-level declaration rule.
				case 'media': // This is the start of a declaration rule in a valid media block.
					// TODO: if no selectors were found, skip this and log a debug message?
					sd.sel.push(s);
					var sels = cb.dontSplit ? sd.sel.join(',') : sd.sel;
					// call onRule
					if (cb.onRule)
						sd.stop = cb.onRule.call(ctx, sels, ss) === false;
					// call onSelector
					if (c && !sd.stop && cb.onSelector) {
						every(isArray(sels) ? sels : [sels], function (sel) {
							// onSelector === false does not prevent onProperty calls, so don't
							// set sd.stop!
							return cb.onSelector.call(ctx, sel, ss) !== false && c;
						});
					}
					// Dig into declarations.
					dn(ss, sd, 'decl');
					break;
				case 'at': // This is the start of at-rule block (@media or @page, for instance).
					if (cb.onAtRule) {
						// call onAtRule
						var parts = s.split(/\s+/, 2); // this should be safe from quoted spaces
						sd.stop = cb.onAtRule.call(ctx, parts[0], parts[1], true, ss) === false;
					}
					if (c) {
						// submerge into the declarations.
						dn(ss, sd, s.match(/^media/) && s.match(rxMTypes) ? 'media' : 'invalid');
						// stop since we're in an at-rule
						sd.stop = true;
					}
					break;
				default: // This must be an ignored, unexpected, or unrecognized block.
					// submerge into the declarations.
					dn(ss, sd, 'invalid');
					sd.stop = true;
			}
			sd.sel = [];
		}

		function unblock (ss, sd) {
			// An end-of-block transition was encountered.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			switch (sd.state) {
				case 'decl': // This is the end of a declaration block.
					// Process a possible property declaration that didn't end with a semicolon.
					if (!sd.stop && sd.pre[0] && cb.onProperty)
						sd.stop = prop(cat(sd), sd.sel, ss);
					if (!sd.stop && cb.onEndRule)
						sd.stop = cb.onEndRule.call(ctx, sd.sel, ss);
					break;
			}
			// All end-of-block transitions should end the current iteration loop and return
			// to the parent loop.
			sd.stop = true;
		}

		function cd (ss, sd) {
			// Skips over a CDO or CDC comment at the top level.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			if (sd.state != 'top') {
				dn(ss, sd, 'error');
				sd.stop = true;
			}
		}

		function skip (rxSkip, pre, ss, sd) {
			// Skips to the end of the current quote or comment.  This is a fast way to submerge for
			// states that can reliably scan to the end: quotes and comments.
			// rxSkip: regex to use to skip.
			// pre: Boolean. Collects the skipped characters if true.
			// ss: String. The text of the stylesheet.
			// sd: Object. The state metadata.
			var pos = rxSs.lastIndex;
			rxSkip.lastIndex = pos;
			rxSkip.exec(ss);
			if (pre) {
				var str = ss.substring(pos - 1, rxSkip.lastIndex);
				if (str)
					sd.pre.push(str);
			}
			rxSs.lastIndex = rxSkip.lastIndex;
		}

		function passthru (ss, sd) { }

		function dn (ss, sd, state) {
			// props: String|Object. The new state or an object with the overridden properties.
			var newSd = beget(sd, {state: state});
			iter(ss, newSd);
			sd.sel = [];
			sd.pre = [];
		}

		function prop (pre, sel, ss) {
			// Calls the onProperty callback.
			// pre: String. The collected pre-transition text.
			// sel: String. The collected selectors.
			// ss: String. The text of the stylesheet.
			// Note: css properties are escaped
			var parts = pre.split(/\s*:\s*/, 2);
			if (cb.dontSplit)
				sel = [sel.join(',')];
			return cb.onProperty.call(ctx, parts[0], parts[1], sel, ss) === false;
		}

		function cat (sd) {
			// concatenates all of the collected pre-transition text and resets the array back to []
			// sd: Object. The state metadata.
			var s = sd.pre.join('');
			sd.pre.length = 0;
			return s;
		}

	}


});
