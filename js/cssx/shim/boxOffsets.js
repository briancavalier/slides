/*
    cssx/shim/boxOffsets
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    This cssx plugin fixes lack of box offset positioning in IE6.

    TODO: the logic in here could be improved a bit

*/
define(
	function () {

		return {

			onProperty: function (processor, parseArgs) {
				// processor: the cssx processor in context
				// parseArgs:
				// 		propName: String
				// 		value: String
				// 		selectors: String|Array
				// 		sheet: String

				var prop = parseArgs.propName,
					value = parseArgs.propValue,
					result;

				if (prop === 'bottom' && value !== 'auto') {
					// optimize common case in which bottom is in pixels already or is 0 (IE always uses '0px' for '0')
					if (value.match(/px$/)) {
						result = {
							selectors: parseArgs.selectors,
							propName: 'height',
							propValue: 'expression(cssx_boxOffsets_checkBoxHeight(this, ' + parseInt(value) + '))'
						};
					}
					else {
						result = [
							{
								selectors: parseArgs.selectors,
								propName: 'height',
								propValue: 'expression(cssx_boxOffsets_checkBoxHeight(this))'
							},
							{
								selectors: parseArgs.selectors,
								propName: 'bottom',
								propValue:'expression("' + value + '")'
							}
						];
					}
				}
				else if (prop === 'right' && value !== 'auto') {
					if (value.match(/px$/)) {
						result = {
							selectors: parseArgs.selectors,
							propName: 'width',
							propValue: 'expression(cssx_boxOffsets_checkBoxWidth(this, ' + parseInt(value) + '))'
						};
					}
					else {
						result = [
							{
								selectors: parseArgs.selectors,
								propName: 'width',
								propValue: 'expression(cssx_boxOffsets_checkBoxWidth(this))'
							},
							{
								selectors: parseArgs.selectors,
								propName: 'right',
								propValue:'expression("' + value + '")'
							}
						];
					}
				}

				if (result) {
					processor.appendRule(result);
				}

			}

		};

	}
);

// it's easiest if these functions are global

function cssx_boxOffsets_checkBoxHeight (node, bVal) {
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
}

function cssx_boxOffsets_checkBoxWidth (node, rVal) {
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
