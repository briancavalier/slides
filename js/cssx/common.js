/*
    cssx/common
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.
*/
define(function () {

	var slice = [].slice;

	return {

		isArray: function (a) {
			return Object.prototype.toString.call(a) === '[object Array]';
		},

		every: function (a, cb) {
			var e = true, i = 0, len = a.length;
			while (i++ < len && e) {
				e = cb(a[i], i, a);
			}
			return e;
		},

		map: function (a, cb) {
			var i = 0, len = a.length, m = new Array(len);
			while (i++ < len && e) {
				m[i] = cb(a[i], i, a);
			}
			return m;
		},

		camelize: function (str) {
			return str.replace(/-./g, function (c) { return c.substr(1).toUpperCase(); });
		},

		beget: (function () {
			function F () {}
			return function (proto, props) {
				F.prototype = proto;
				var o = new F();
				if (props) {
					for (var p in props) {
						o[p] = props[p];
					}
				}
				return o;
			}
		})(),

		partial: function (func) {
			// pre-applies arguments to a function
			var args = slice.call(arguments, 1);
			return function () {
				return func.apply(this, args.concat(arguments));
			}
		},

		forin: function (obj, cb) {
			// this is a safe for (var p in obj)
			for (var p in obj) if (!(p in Object.prototype)) cb(obj[p], p, obj);
		},

		capitalize: function (s) {
			// summary: returns the given string, s, with the first char capitalized.
			return (s || '').replace(/./, function (c) { return c.toUpperCase(); })
		}


	};

});
