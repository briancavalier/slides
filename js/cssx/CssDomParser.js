/*
    cssx/CssDomParser
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.
*/
define(function () {

	function every (a, cb) {
		var e = true, i, len = a.length;
		for (i = 0; i < len && e; i++) {
			e = cb(a[i], i, a);
		}
		return e;
	}

	return function (/* Object */ cb) {
		//  summary: A fast, flexible CSS event-based DOM parser in 1kB! (minified)
		//      See also the cssx.cssTextParser!
		//  cb: Object
		//      The cb parameter is a configuration object supplying callbacks that are called whenever
		//      a new object is encountered in the CSS object hierarchy. Return an explicit false (not
		//      a falsy value) from the callback to terminate processing that branch in the hierarchy.
		//      For instance, to abort the parsing of the current rule, return false from the onRule
		//      callback. To abort parsing of the current sheet, return false from the onSheet callback.
		//      Call the stop() method to stop parsing altogether. The signatures of the callbacks
		//      are as follows:
		//          onSheet: function (/* CSSStyleSheet */ ss) {}
		//          onRule: function (/* CSSStyleRule */ rule, /* CSSStyleSheet */ ss) {}
		//          onImport: function (/* CSSStyleSheet */ importedSheet, /* CSSStyleRule */ rule, /* CSSStyleSheet */ ss) {}
		//          onSelector: function (/* String */ selectorText, /* CSSStyleRule */ rule, /* CSSStyleSheet */ ss) {}
		//          onProperty: function (/* String */ propName, /* String */ value, /* CSSStyleRule */ rule, /* CSSStyleSheet */ ss) {}
		//      This css parser will only dig into the stylesheet as deeply as you require. If
		//      you don't supply an onSelector or onProperty callback, it will not process that
		//      deeply.
		//      Other properties of cb:
		//          dontSplit: Boolean. Prevents the parser from spliting compound selectors into
		//              multiple single selectors in all browsers except IE.  See Notes below.
		//          skipImports: Boolean. If true, the parser will not process any imported stylesheets.
		//          context: Object. If supplied, runs the callbacks in the context of this object.
		//              If missing, runs the callbacks in the context of the CssParser instance.
		//  Notes:
		//      1.  The selectors are split at the comma in compound selectors, e.g. the selector,
		//          ".dijitFoo, .dijitBar", results in two onSelector callbacks: one for ".dijitFoo"
		//          and one for ".dijitBar". If you don't want the selectorText split, supply a truthy
		//          dontSplit property on the cb parameter.
		//      2.  IE breaks compound selectors into separate rules. If your stylesheet has a rule with
		//          the selector, ".dijitFoo, .dijitBar", IE will break it into two rules having only
		//          one of the pair of selectors, i.e. one with ".dijitFoo" and one with ".dijitBar".
		//          Both rules will, of course, have the exact same style properties.
		//          Thanks to PPK for clarification on IE: http://www.quirksmode.org/dom/w3c_css.html
		//      3.  To obtain the style properties as text from a rule, use the rule's style.cssText
		//          property.  All browsers support this method.
		//  Example 1:
		//        var myCallbacks = {
		//                dontSplit: true,
		//                onSelector: function (st, r, ss) { console.log(st, r, ss); }
		//            };
		//        (new CssParser(myCallbacks)).parse();
		//  Example 2:
		//        function checkRuleForOpacity (rule, sheet) {
		//            /* stop all processing if we hit a style property for opacity */
		//            if (rule.style.cssText.match(/opacity|rgba/))
		//                this.stop();
		//        }
		//        var canceled = !(new CssParser({onRule: checkRuleForOpacity})).parse();
		//
		//  TODO: onSheet only gets called if a document (or null) is passed into parse()

		var
			// context in which to execute callbacks
			ctx = cb.context || this,
			// flag to detect if user has stopped (c is short for "continue")
			c = true,
			// preventative measure
			undefined;

		this.parse = function (/* DOMDocument|CSSStyleSheet|Array? */ w) {
			//  summary: Call parse to start parsing the document.
			//  w: DOMDocument|CSSStyleSheet|Array? - The item(s) to parse.
			//      Defaults to currently-scoped document (dojo.doc). May be any number of
			//      documents or stylesheet objects.
			//  returns Boolean. true == parse was not stopped; false == it was stopped.
			c = true;
			if (!common.isArray(w)) w = [w || document];
			every(w, function (obj) {
				return obj.nodeType == 9 ? doc(obj) : sheet(obj); // 9 == DOMDocument
			});
			return c;
		};

		this.stop = function () {
			//  summary: Call stop() from within a callback to stop parsing.
			c = false;
		};

		function doc (/* DOMDocument */ doc) {
			every(doc.styleSheets, function (s) {
				// Note: c should be checked AFTER the callback.
				sheet(s);
				return c;
			});
		}

		function sheet (/* CSSStyleSheet */ s) {
			if (cb.onRule || cb.onImport || cb.onSelector || cb.onProperty || (cb.onSheet && cb.onSheet.call(ctx, s) !== false) && c)
				every(s.cssRules || s.rules /* <-- friggin IE! */, function (r) {
					// parse if there are callbacks AND the current callback (if any) didn't cancel and
					// caller didn't cancel (c == false). Note: c should be checked AFTER the callback.
					if (cb.onSelector || cb.onProperty || cb.onImport || (cb.onRule && cb.onRule.call(ctx, r, s) !== false) && c)
						rule(r, s);
					return c;
				});
		}

		function rule (/* CSSStyleRule */ r, /* CSSStyleSheet */ s) {
			// if this is an @import
			if (r.styleSheet) {
				if (!cb.skipImports) {
					if (cb.onImport && cb.onImport(r.stylesheet, r, s) !== false && c)
						sheet(r.stylesheet);
				}
			}
			// otherwise
			else {
				var t;
				// if there is an onSelector callback
				if (cb.onSelector && (/* performance gain and less bytes: */ t = r.selectorText))
					every(cb.dontSplit ? [t] : t.split(/\s*,\s*/g), function (p) {
						return cb.onSelector.call(ctx, p, r, s) !== false && c;
					});
				// if there is an onProperty callback
				if (cb.onProperty) {
					// grab the style object and iterate over its properties
					t = r.style;
					// normal (fast) way
					if (t.length !== undefined)
						every(t, function (p) {
							return cb.onProperty.call(ctx, p, t[p], r, s) !== false && c;
						});
					// IE (slow) way
					else {
						// Note: this regex is overly simple, but won't hurt because we'll catch invalid property names in the next loop
						var props = common.map(t.cssText.match(/([\w-]+):/g) || [], function (p) {
							return common.camelize(p.substr(0, p.length - 1).toLowerCase());
						});
						every(props, function (p) {
							var v = t[p]; // property value
							return (v == undefined || cb.onProperty.call(ctx, p, /* convert to string: */ '' + v, r, s) !== false) && c;
						});
					}
				}
			}
		}

	}

});
