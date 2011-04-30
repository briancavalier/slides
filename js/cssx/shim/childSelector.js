/**
 * Copyright (c) 2011 unscriptable.com
 *
 * TODO: documentation
 * TODO: process selector replacements in onSelector so they can be cascaded to other selector processors
 * TODO: allow for nested rules (LESS, SASS, XStyle)
 *
 */

(function (global, doc) {

	var ancestries, id = 0,
		ancestrySplitterRx = /\s*>\s*/g,
		rightTemplate = '${0}{${1}:expression(cssx_child_selector_right(this,"${1}","${2}"));}\n',
		levelTemplate = '${0}{${1}:expression(cssx_child_selector(this,"${1}","${2}"));}\n',
		leftTemplate = '${0}{${1}:${1}}';

	function createKey () {
        return 'cssx-child-selector-' + id++;
    }

	var replaceRx = /\$\{(\d)\}/g;
	function replace (string, values) {
		return string.replace(replaceRx, function (match, pos) {
			return values[pos];
		});
	}
	
	define({

		onSelector: function (selector) {

			if (selector.indexOf('>') >= 0) {

				// create unique key for this ancestry
				var key = createKey();

				// save ancestry
				ancestries = ancestries || [];
				ancestries.push({ selector: selector, key: key });

				return '.' + key;
			}

		},

		onEndRule: function (selectors) {
			var i, j, ancestry, level, parentKey, childKey, output = '';

			if (ancestries && ancestries.length > 0) {

				for (i = 0; i < ancestries.length; i++) {

					// TODO: bail if any blanks were found in ancestry
					ancestry = ancestries[i].selector.split(ancestrySplitterRx);
					childKey = ancestries[i].key;

					for (j = ancestry.length - 1; j > 0; j--) {

						level = ancestry[j];

						parentKey = createKey();

						if (j == ancestry.length - 1) {
							// create right-most rule
							output += replace(rightTemplate, [level, childKey, parentKey]);
						}
						else {
							output += replace(levelTemplate, [level, childKey, parentKey]);
						}
						
						childKey = parentKey;

					}

					// create left-most rule
					output += replace(leftTemplate, [ancestry[0], parentKey]);

				}
			}

			// clean up ancestries
			ancestries = null;

			return output;
		}

	});

	// TODO: remove this and replace it with something simpler
	function toggleClass (node, className, add) {
		var replaced, newClassName, replaceRx = new RegExp('\s?' + className + '\s?');
		newClassName = node.className.replace(replaceRx, function (match) {
			replaced = add;
			return add ? match : ' ';
		});
		newClassName += add && !replaced ? ' ' + className : '';
		// IE6 isn't smart enough to check if className actually changed
		if (node.className != newClassName) {
			node.className = newClassName;
		}
	}

	global['cssx_child_selector'] = function (node, childKey, parentKey) {
		var parent = node.parentNode;
		return parent && parent.currentStyle[parentKey] == parentKey ? childKey : '';
	};

	global['cssx_child_selector_right'] = function (node, origKey, parentKey) {
		var parent = node.parentNode;
		toggleClass(node, origKey, parent && parent.currentStyle[parentKey] == parentKey);
	};

}(this, document));
