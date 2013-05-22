define(function() {
	return function(separator) {
		return function(text) {
			return text.split(separator);
		};
	};
})