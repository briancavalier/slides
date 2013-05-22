define(['when'], function(when) {
	return function(require) {
		return function(path) {
			var d = when.defer();
			require(['text!'+path], d.resolve, d.reject);
			return d.promise;
		};
	};
})