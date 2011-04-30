/**
 * Copyright (c) 2011 unscriptable.com
 *
 * TODO: documentation
 * TODO: allow for nested rules (LESS, SASS, XStyle)
 *
 */

(function (global, doc) {

	var replacements,
		id = 0,
		parseHoverRx = /([^\s])+:hover(?=$|\s)/,
		// Note: this is safe if we assume nobody will create their own
		// classes that include cssx-hover-pseudo within them
		removeReplacementRx = /\s?cssx-hover-pseudo-\d+/g;

	function createKey () {
        return 'cssx-hover-pseudo-' + id++;
    }

	function install () {
		doc.attachEvent('onmouseover', enter);
		doc.attachEvent('onmouseout', leave);
	}

	function remove () {
		doc.detachEvent('onmouseover', enter);
		doc.detachEvent('onmouseout', leave);
		global.detachEvent('unload', remove);
	}

	function findHoverKeyAndNode (node) {
		var hoverKey;
		do {
			hoverKey = node.currentStyle['cssx_hover_pseudo'];
		}
		while (!hoverKey && (node = node.parentNode) && node.nodeType == 1);
		return {node: node, hoverKey: hoverKey};
	}

	function enter () {
		var e = window.event,
			search = findHoverKeyAndNode(e.toElement);
		if (search.hoverKey) {
			search.node.className += ' ' + search.hoverKey;
		}
	}

	function leave () {
		var e = window.event,
			search = findHoverKeyAndNode(e.fromElement);
		if (search.hoverKey) {
			search.node.className = search.node.className.replace(removeReplacementRx, '');
		}
	}

	define({

		onSelector: function (selector) {

			if (selector.indexOf(':hover')) {

				replacements = replacements || [];

				// parse selector
				selector = selector.replace(parseHoverRx, function (match) {
					// create unique key for this :hover replacement
					// and substitute it as a class instead
					var key = createKey(),
						partial = match.replace(':hover', ''),
						newPart = partial + '.' + key;
					// save replacement
					replacements.push({
						partial: partial,
						key: key
					});

					return newPart;

				});
				return selector;

			}
		},

		onEndRule: function () {
			var i, output = '', replacement;

			if (replacements) {

				// for each captured selector
				for (i = 0; i < replacements.length; i++) {

					replacement = replacements[i];

					// add a new rule that inserts a custom property
					output += replacement.partial + '{cssx_hover_pseudo:' + replacement.key + ';}';

				}

				replacements = null;
			}

			return output;
		}

	});

	install();
	global.attachEvent('unload', remove);

}(this, document));
