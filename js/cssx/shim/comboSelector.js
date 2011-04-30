/**
 * Copyright (c) 2011 unscriptable.com
 *
 * TODO: documentation
 * TODO: allow for nested rules (LESS, SASS, XStyle)
 * TODO: reuse toggleClass
 *
 */

(function (global, doc) {

	var
		comboCheckers = [],
		replacements,
		id = 0,
		comboDetectorRx = /\.[\w\-]+\./g,
		comboFinderRx = /(.*?)((?:\.[\w\-]+){2,})/g,
		comboSplitterRx = /\b(\w|-)+\b/g,
		ruleTemplate = '.${0}{${1}:expression(cssx_combo_selector_check(this,"${2}",${3}));}\n';

	function createKey () {
        return 'cssx-combo-selector-' + id++;
    }

	var replaceRx = /\$\{(\d)\}/g;
	function templatize (string, values) {
		return string.replace(replaceRx, function (match, pos) {
			return values[pos];
		});
	}

	function createComboChecker (combo) {
		var classes = {}, classList = [], checker, index = 0;

		combo.replace(comboSplitterRx, function (className) {
			if (!classes[className]) {
				classes[className] = Math.pow(2, index++);
				classList.push(className);
			}
			return ''; // minimizes memory allocation work
		});

		// IE is such a cluster ____. Can't seem to get any single-pass
		// regex to work without capturing an starting space so we have
		// to post-process the matched strings. performance fail!

		checker = {
			classes: classes,
			full: Math.pow(2, index) - 1,
			rx: new RegExp('(^|\\s)(' + classList.join('|') + ')(?=$|\\s)', 'g'),
			check: function (classes) {
				var accum = 0, map = this.classes;
				classes.replace(this.rx, function (className) {
					// here's the post-processing needed:
					className = className.replace(/^\s/, '');
					accum |= (map[className] || 0);
					return className; // minimizes memory allocation work
				});
				return this.full == accum;
			}
		};
		return comboCheckers.push(checker) - 1;
	}

	function checkComboChecker (classes, checkerId) {
		var checker = comboCheckers[checkerId];
		return checker && checker.check(classes);
	}

	define({

		onSelector: function (selector) {

			if (comboDetectorRx.test(selector)) {

				replacements = replacements || [];

				selector = selector.replace(comboFinderRx, function (match, other, combo) {
					var key = createKey(),
						newPart = other + '.' + key ;
					replacements.push({
						other: other,
						combo: combo,
						key: key
					});
					return newPart;
				});

				return selector;
			}

		},

		onEndRule: function () {
			var i, part, checkerId, baseKey, baseRule = '', rules = '';

			if (replacements) {

				for (i = 0; i < replacements.length; i++) {

					// TODO: bail if any blanks were found in classes
					//parts = parseCombos(replacements[i].selector);
					part = replacements[i];
					baseKey = part.key;
					baseRule += part.other;
					checkerId = createComboChecker(part.combo);
					part.combo.replace(comboSplitterRx, function (className) {
						rules += templatize(ruleTemplate, [className, part.key, baseKey, checkerId]);
						return ''; // minimizes memory allocation work
					});
					baseRule += '.' + part.key + ',';

				}

				baseRule += '\n' + rules;
			}

			// clean up replacements
			replacements = null;

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

	global['cssx_combo_selector_check'] = function (node, origClass, checkerId) {
		var allSatisfied = checkComboChecker(node.className, checkerId);
		toggleClass(node, origClass, allSatisfied);
	};

}(this, document));
