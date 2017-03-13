define(function (require) {
	
	var mode = require( "./mode" );

	function utils(options) {

		var that = {};

		var rbracket = /\[\]$/;
		var r20 = /%20/g;
		
		that.isFunction = function (val) {
			return typeof val === 'function';
		};

		that.fadeIn = function (el) {
			el.style.opacity = 0;

			var last = +new Date();
			var tick = function () {
				el.style.opacity = +el.style.opacity + (new Date() - last) / 400;
				last = +new Date();

				if (+el.style.opacity < 1) {
					(window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16)
				}
			};

			tick();
		};

		that.fadeOut = function (el) {
			el.style.opacity = 0;

			var last = +new Date();
			var tick = function () {
				el.style.opacity = +el.style.opacity + (new Date() - last) / 400;
				last = +new Date();

				if (+el.style.opacity < 1) {
					(window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16)
				}
			};

			tick();
		};

		that.extend = function (out) {
			out = out || {};

			for (var i = 1; i < arguments.length; i++) {
				if (!arguments[i])
					continue;

				for (var key in arguments[i]) {
					if (arguments[i].hasOwnProperty(key))
						out[key] = arguments[i][key];
				}
			}

			return out;
		};
		
		function type(obj) {
			return Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, "$1").toLowerCase();
		}


		function buildParams(prefix, obj, traditional, add) {
			var name;

			if (Array.isArray(obj)) {
				// Serialize array item.
				obj.forEach(function (item, index) {
					if (traditional || rbracket.test(prefix)) {
						// Treat each array item as a scalar.
						add(prefix, item);

					} else {
						// Item is non-scalar (array or object), encode its numeric index.
						buildParams(prefix + "[" + (typeof item === "object" ? index : "") + "]", item, traditional, add);
					}
				});

			} else if (!traditional && type(obj) === "object") {
				debugger;
				// Serialize object item.
				for (name in obj) {
					buildParams(prefix + "[" + name + "]", obj[ name ], traditional, add);
				}

			} else {
				// Serialize scalar item.
				add(prefix, obj);
			}
		}

		// Serialize an array of form elements or a set of key/values into a query string
		that.param = function (a, traditional) {
			var prefix,
					s = [],
					add = function (key, value) {
						// If value is a function, invoke it and return its value
						value = (typeof value === 'function') ? value() : (value == null ? "" : value);
						s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
					};


			// If an array was passed in, assume that it is an array of form elements.
			if (Array.isArray(a)) {
				// Serialize the form elements
				a.forEach(function (item, index) {
					add(item.name, item.value);
				});

			} else {
				// If traditional, encode the "old" way (the way 1.3.2 or older
				// did it), otherwise encode params recursively.
				for (prefix in a) {
					buildParams(prefix, a[ prefix ], traditional, add);
				}
			}

			// Return the resulting serialization
			return s.join("&").replace(r20, "+");
		};
		
		
	that.log =  function() {
		if (mode.DEBUG) {
			Function.apply.call(console.log, console, arguments);
		}
	};
	
	that.logError = function() {
		if (mode.DEBUG) {
			Function.apply.call(console.error, console, arguments);
		}
	};



		return that;
	}

	var utils = utils();
	return utils;

});