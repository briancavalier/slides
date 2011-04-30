/**
 * Copyright (c) 2011 unscriptable.com
 *
 * TODO: documentation
 * TODO: allow for nested rules (LESS, SASS, XStyle)
 * TODO: reuse toggleClass and templatize
 *
 */

(function (global, doc) {

	var
		replacements,
		id = 0,
		attrDetectorRx = /\[/g,
		attrFinderRx = /(.*?)\[([^\]]+)\]/g,
		attrSplitterRx = /(\w+)=["']?([^"']+)["']/g,
		ruleTemplate = '${0}{${1}:expression(cssx_attr_selector_check(this, "${1}","${2}","${3}"));}\n';

	function createKey () {
        return 'cssx-attr-selector-' + id++;
    }

	var replaceRx = /\$\{(\d)\}/g;
	function templatize (string, values) {
		return string.replace(replaceRx, function (match, pos) {
			return values[pos];
		});
	}

	define({

		onSelector: function (selector) {

			if (attrDetectorRx.test(selector)) {

				replacements = replacements || [];

				selector = selector.replace(attrFinderRx, function (match, base, attrDef) {
					var key = createKey(),
						newPart = base + '.' + key ;

					replacements.push({
						base: base,
						attrDef: attrDef,
						key: key
					});
					return newPart;
				});
//alert('new selector: ' + selector);
				return selector;
			}

		},

		onEndRule: function () {
			var i, part, baseRule = '', rules = '';

			if (replacements) {

				for (i = 0; i < replacements.length; i++) {

					part = replacements[i];
					part.attrDef.replace(attrSplitterRx, function (match, attr, value) {
//alert('attr: ' + attr + ' value: ' + value);
						rules += templatize(ruleTemplate, [part.base, part.key, attr, value]);
						return ''; // minimizes memory allocation work
					});

				}

				baseRule += '\n' + rules;
			}

			// clean up replacements
			replacements = null;
//if (baseRule) alert(baseRule);
			return baseRule;

		}

	});

	// TODO: remove this and replace it with something simpler
	function toggleClass (node, className, add) {
		var replaced, newClassName, replaceRx = new RegExp('\\s?' + className + '\\s?');
		newClassName = node.className.replace(replaceRx, function (match) {
			replaced = add;
			return add ? match : '';
		});
		newClassName += add && !replaced ? ' ' + className : '';
		// IE6 isn't smart enough to check if className actually changed
		if (node.className != newClassName) {
			node.className = newClassName;
		}
	}

	global['cssx_attr_selector_check'] = function (node, proxyClass, attr, value) {
		var valid = attr && node.getAttribute(attr) == value;
//alert(valid + ' ' + attr + ' '+ value);
		toggleClass(node, proxyClass, valid);
		return '';
	};

}(this, document));
