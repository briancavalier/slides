/*
    cssx/shim/boxOffsets
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    This cssx plugin fixes lack of box offset positioning in IE6.

    TODO: the logic in the global functions may be improved a bit

*/
(function (global) {

	define({
	
		bottom: function (prop, value, selectors) {
			if (value != 'auto') {
				// optimize common case in which bottom is in pixels already or is 0 (IE always uses '0px' for '0')
				if (value.match(/px$/)) {
					return 'height:expression(cssx_boxOffsets_checkBoxHeight(this,' + parseInt(value) + '));\nbottom:' + value + ';\n';
				}
				else {
					return 'height:expression(cssx_boxOffsets_checkBoxHeight(this));\nbottom:expression("' + value + '");\n';
				}
			}
		},

		right: function (prop, value, selectors) {
			if (value != 'auto') {
				// optimize common case in which right is in pixels already or is 0 (IE always uses '0px' for '0')
				if (value.match(/px$/)) {
					return 'width:expression(cssx_boxOffsets_checkBoxWidth(this,' + parseInt(value) + '));\nright:' + value + ';\n';
				}
				else {
					return 'width:expression(cssx_boxOffsets_checkBoxWidth(this));\nright:expression("' + value + '");\n';
				}
			}
		}

	});

	// unfortunately, these functions must be global

	global['cssx_boxOffsets_checkBoxHeight'] = function (node, bVal) {
		var style = node.currentStyle,
			parent = node.offsetParent,
			doc = node.ownerDocument;
		// are we using box offset positioning? (Note: assumes position:fixed is fixed for IE6)
		if (parent && style.top != 'auto' && style.position == 'absolute' || style.position == 'fixed') {
			var height = parent == doc.body ? doc.body.clientHeight : parent.offsetHeight
					- (node.offsetHeight - node.clientHeight) /* border height */
					- parseInt(style.paddingTop)- parseInt(style.paddingBottom) /* padding height if px */;
			return height - node.offsetTop - (bVal != null ? bVal : node.style.pixelBottom) + 'px';
		}
		else
			return '';
	};

	global['cssx_boxOffsets_checkBoxWidth'] = function (node, rVal) {
		var style = node.currentStyle,
			parent = node.offsetParent,
			doc = node.ownerDocument;
		// are we using box offset positioning? (Note: assumes position:fixed is fixed for IE6)
		if (parent && style.left != 'auto' && style.position == 'absolute' || style.position == 'fixed') {
			var width = (parent == doc.body ? doc.body.clientWidth : parent.offsetWidth)
					- (node.offsetWidth - node.clientWidth) /* border width */
					- parseInt(style.paddingLeft)- parseInt(style.paddingRight) /* padding width if px */;
			return width - node.offsetLeft - (rVal != null ? rVal : node.style.pixelRight) + 'px';
		}
		else
			return '';
	}

}(this));
