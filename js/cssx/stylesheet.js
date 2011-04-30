/*
    cssx/stylesheet
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.
*/
define(function () {

	function findDoc () {
		return window['document'];
	}

	function findHead (doc) {
		// Finds the HEAD element (or the BODY element if the head wasn't
		// found).
		//  doc: DOMDocument (optional) Searches the supplied document,
		// or the currently-scoped window.document if omitted.
		var node = (doc || findDoc()).documentElement.firstChild;
		while (node && (node.nodeType != 1 || !/head|body/i.test(node.tagName))) {
			node = node.nextSibling;
		}
		return node;
	}

	function _ss () {
		var sheet = createStylesheet();
		return (_ss = function () { return sheet; })();
	}

		function createStylesheet (cssText, position) {
			//  summary: Creates a new stylesheet so rules may be added.
			//  cssText: String  The initial text content of the stylesheet (i.e. rules in text form)
			//  description: Do not supply cssText if you plan to add rules via the appendRule method immediately.
			//      Firefox 3+ temporarily removes the cssRules collection when text content is
			//      inserted.  A setTimeout is required before the cssRules are available again.

			var doc = findDoc(),
				head = findHead();

			return (createStylesheet =
				doc.createStyleSheet ?
					// IE (hack city)
					function (cssText) {
						try {
							var node = doc.createElement('style');
							node.type = 'text/css';
							head.appendChild(node);
							var ss = node.styleSheet;
						}
						catch (ex) {
							// we must have hit 31 stylesheet limit so try the other way:
							ss = doc.createStyleSheet();
						}
						// IE6 needs to have cssText or the stylesheet won't get created (verify again?)
						cssText = cssText || '#cssx_ignore_ {}';
						ss.cssText = cssText;
						return ss;
					} :
					// w3c
					function (cssText) {
						var node = doc.createElement('style');
						node.type = 'text/css';
						head.appendChild(node);
						if (cssText) node.appendChild(doc.createTextNode(cssText));
						return node.sheet;
					}
			)();
		}

		function appendRule (/* String */ selectorText, /* String */ cssText, /* CSSStylesheet? */ ss) {
			//  summary: appends a new rule to the end of a stylesheet
			//  selectorText: String  the selector of the new rule
			//  cssText: String  the css property declarations of the new rule
			//  ss: StyleSheet?  if omitted, a default stylesheet is used
			return insertRule(selectorText, cssText, -1, ss);
		}

		function insertRule (/* String */ selectorText, /* String */ declText, /* Number? */ pos, /* CSSStylesheet? */ ss) {
			//  summary: inserts a new rule into a stylesheet
			//  selectorText: String  the selector of the new rule
			//  cssText: String  the css property declarations of the new rule
			//  pos: Number?  the position to insert at (or the end if omitted)
			//  ss: StyleSheet?  if omitted, a default stylesheet is used
			//  special thanks to PPK at http://www.quirksmode.org for his work on stylesheets
			ss = ss || _ss();
			var rules = ss.cssRules || ss.rules;
			if (ss.insertRule) {// w3c
				if (!(pos >= 0)) pos = rules.length;
				ss.insertRule(selectorText + '{' + declText + '}', pos);
			}
			// IE. what a stinkin pile!
			else {
				if (!declText) declText = 'zoom:1'; /* IE6 throws "Invalid argument." when there's no cssText */
				// addRule fails in IE6 if the selectors are comma-separated
				// TODO: FIXME? could there be a comma in a css3 attr selector?
				var selectors = selectorText.split(',');
				for (var i = 0; i < selectors.length; i++) {
					ss.addRule(selectors[i], declText, pos++ || -1);
				}
				if (!(pos >= 0)) pos = rules.length - 1;
			}
			return rules[pos];
		}

	return {
		createStylesheet: createStylesheet,
		insertRule: insertRule,
		appendRule: appendRule,
		common: function common () { return _ss(); }

	};

});
