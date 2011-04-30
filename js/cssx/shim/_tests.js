/**
    cssx/shim/_tests
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

 */

define({

	// these are the feature tests needed to determine if cssx shims should be loaded
	// each one has a test() function and a plugin (string) property
	// the test function is passed three arguments:
	//    env: Object - has a property, isBuild, which is true during a build
	//    sniff: Object - the cssx/sniff module, with many sniffing methods
	//    ctx: Object - a place to store stuff that the shim might need (e.g. vendor prefix)

	/***** properties and vaues *****/

	minmax: {
		test: function (env, sniff) {
			return sniff.cssProp('maxWidth');
		},
		name: './shim/minmax'
	},

	opacity: {
		// non-ie opacity
		test: function (env, sniff, ctx) {
			// store the property name (may have vendor prefix)
			ctx.opacityName = sniff.cssProp('opacity', true);
			ctx.filterName = sniff.cssProp('filter', true);
			return ctx.opacityName == 'opacity' || ctx.filterName;
		},
		name: './shim/opacity'
	},

	ieOpacity: {
		test: function (env, sniff, ctx) {
			// store the property names (may have vendor prefix)
			ctx.opacityName = sniff.cssProp('opacity', true);
			ctx.filterName = sniff.cssProp('filter', true);
			return ctx.opacityName || !ctx.filterName;
		},
		name: './shim/ieOpacity'
	},

	inlineBlock: {
		test: function (env, sniff) {
			// Note: this is an inference test. A true test would require
			// setting height of an inline-block node and
			// verifying the height which would need to wait for domready.
			// FIXME: do a true test?
			return sniff.cssProp('maxWidth');
		},
		name: './shim/inlineBlock'
	},

	boxOffsets: {
		test: function (env, sniff) {
			// Note: this is an inference test. A true test would require
			// setting top and bottom of an absolutely positioned node and
			// verifying the height which would need to wait for domready.
			// FIXME: do a true test?
			return sniff.cssProp('maxWidth');
		},
		name: './shim/boxOffsets'
	},

	scrollbar: {
		test: function () { return false; },
		name: './shim/scrollbar'
	},

	/***** selectors *****/

	hoverPseudo: {
		test: function (env, sniff) {
			// Note: this is an inference test.
			// FIXME: do a true test?
			return sniff.cssProp('maxWidth');
		},
		name: './shim/hover'
	},

	// TODO: get attrSelector working
	//attrSelector: {
	//	test: function (env, sniff) {
	//		// Note: this is an inference test.
	//		// FIXME: do a true test?
	//		return sniff.cssProp('maxWidth');
	//	},
	//	name: './shim/attrSelector'
	//},

	comboSelector: {
		test: function (env, sniff) {
			// Note: this is an inference test.
			// FIXME: do a true test?
			return sniff.cssProp('maxWidth');
		},
		name: './shim/comboSelector'
	},

	// Note: child selector shim needs to run after other shims because it
	// removes the selectors entirely and replaces them with a new one.
	// Fix this somehow?
	childSelector: {
		test: function (env, sniff) {
			// Note: this is an inference test.
			// FIXME: do a true test?
			return sniff.cssProp('maxWidth');
		},
		name: './shim/childSelector'
	}

});
