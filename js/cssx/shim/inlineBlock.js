/*
    cssx/shim/inlineBlock
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    This cssx plugin fixes lack of inline-block support in IE6 and IE7

*/
define(function () {

	var inlineBlockRx = /inline-block/;
	
	return {

		display: function (prop, value, selectors) {
			if (inlineBlockRx.test(value)) {
				return 'display:inline;zoom:1;';
			}
		}

	};

});
