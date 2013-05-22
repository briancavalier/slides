define(['when/function'], function(fn) {
	return function(tx1, tx2/* ...txs */) {
		return fn.compose.apply(fn, arguments);
	};
})