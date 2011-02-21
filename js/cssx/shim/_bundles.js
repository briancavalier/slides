/**
    cssx/shim/_bundles
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

 */

/*

	Loading scenario A: normal case
	1) coder specifies the cssx/cssx plugin in a dependency
		- cssx.js plugin is loaded
	2) cssx.js plugin figures out the correct bundle (which could be the default bundle)
		- default bundle is loaded
	3) each cssx plugin specified in the bundle is loaded and registers with cssx:
		- require(['cssx/cssx']).then(function (cssx) { cssx.register(thisPlugin); });

	Loading scenario B: coder-defined cssx plugin
	1) coder requires her cssx plugin in a module somewhere
		- plugin is loaded and calls require(['cssx/cssx']).then() to register
	2) cssx.js plugin is loaded, then detects and loads a bundle, etc. 

 */

// TODO: is the auto.js plugin needed any more?

define({

	ie60: {
		test: function (env, sniff) { return /^Mozilla\/4\.0 \(compatible; MSIE 6\.0; Windows NT \d\.\d(.*)\)$/.test(env.userAgent); },
		name: './shim/ie6Bundle'
	},

	ie70: {
		test: function (env, sniff) { return /^Mozilla\/4\.0 \(compatible; MSIE 7\.0; Windows NT \d\.\d(.*)\)$/.test(env.userAgent); },
		name: './shim/ie7Bundle'
	},

	ff36: {
		test: function (env, sniff) { return /^Mozilla\/5\.0 \(Windows; U;(.*)rv\:1\.9\.2.(\d{1,2})\)( Gecko\/(\d{8}))? Firefox\/3\.6(\.\d{1,2})?( \(.+\))?$/.test(env.userAgent); },
		name: './shim/ff36Bundle'
	},

	cr80: {
		test: function (env, sniff) { return /^Mozilla\/5\.0 \((Windows|Macintosh|X11); U;.+\) AppleWebKit\/534\.10 \(KHTML\, like Gecko\) (.+)Chrome\/8\.0\.(\d{3})\.(\d{1,3}) Safari\/534\.10$/.test(env.userAgent); },
		name: './shim/cr8Bundle'
	},

	'default': {
		test: true,
		name: './shim/default' // all non-detectable shims
	}

});
