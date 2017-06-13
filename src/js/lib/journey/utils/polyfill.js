// Promise
// TODO: Better global attachment
if ( window && ! window.Promise ) {
	var PENDING = { };
	var FULFILLED = { };
	var REJECTED = { };

	var Promise = window.Promise = function ( callback ) {
		var fulfilledHandlers = [ ];
		var rejectedHandlers = [ ];
		var state = PENDING;
		var result;
		var dispatchHandlers;

		var makeResolver = function ( newState ) {
			return function ( value ) {
				if ( state !== PENDING ) {
					return;
				}
				result = value;
				state = newState;
				dispatchHandlers = makeDispatcher( ( state === FULFILLED ? fulfilledHandlers : rejectedHandlers ), result );
				wait( dispatchHandlers );
			};
		};

		var fulfill = makeResolver( FULFILLED );
		var reject = makeResolver( REJECTED );

		try {
			callback( fulfill, reject );
		} catch ( err ) {
			reject( err );
		}

		return {
			// `then()` returns a Promise - 2.2.7
			then: function then( onFulfilled, onRejected ) {
				var promise2 = new Promise( function ( fulfill, reject ) {

					var processResolutionHandler = function ( handler, handlers, forward ) {
						if ( typeof handler === 'function' ) {
							handlers.push( function ( p1result ) {
								try {
									resolve( promise2, handler( p1result ), fulfill, reject );
								} catch ( err ) {
									reject( err );
								}
							} );
						} else {
							handlers.push( forward );
						}
					};

					processResolutionHandler( onFulfilled, fulfilledHandlers, fulfill );
					processResolutionHandler( onRejected, rejectedHandlers, reject );

					if ( state !== PENDING ) {
						wait( dispatchHandlers );
					}

				} );
				return promise2;
			},
			'catch': function catch$1( onRejected ) {
				return this.then( null, onRejected );
			}
		};
	};

	Promise.all = function ( promises ) {
		return new Promise( function ( fulfil, reject ) {
			var result = [ ];
			var pending;
			var i;

			if ( ! promises.length ) {
				fulfil( result );
				return;
			}

			var processPromise = function ( promise, i ) {
				if ( promise && typeof promise.then === 'function' ) {
					promise.then( function ( value ) {
						result[i] = value;
						-- pending || fulfil( result );
					}, reject );
				} else {
					result[i] = promise;
					-- pending || fulfil( result );
				}
			};

			pending = i = promises.length;

			while ( i -- ) {
				processPromise( promises[i], i );
			}
		} );
	};

	Promise.resolve = function ( value ) {
		return new Promise( function ( fulfill ) {
			fulfill( value );
		} );
	};

	Promise.reject = function ( reason ) {
		return new Promise( function ( fulfill, reject ) {
			reject( reason );
		} );
	};

	// TODO use MutationObservers or something to simulate setImmediate
	var wait = function ( callback ) {
		setTimeout( callback, 0 );
	};

	var makeDispatcher = function ( handlers, result ) {
		return function () {
			for ( var handler = ( void 0 ); handler = handlers.shift(); ) {
				handler( result );
			}
		};
	};

	var resolve = function ( promise, x, fulfil, reject ) {
		var then;
		if ( x === promise ) {
			throw new TypeError( "A promise's fulfillment handler cannot return the same promise" );
		}
		if ( x instanceof Promise ) {
			x.then( fulfil, reject );
		} else if ( x && ( typeof x === 'object' || typeof x === 'function' ) ) {
			try {
				then = x.then;
			} catch ( e ) {
				reject( e );
				return;
			}
			if ( typeof then === 'function' ) {
				var called;

				var resolvePromise = function ( y ) {
					if ( called ) {
						return;
					}
					called = true;
					resolve( promise, y, fulfil, reject );
				};
				var rejectPromise = function ( r ) {
					if ( called ) {
						return;
					}
					called = true;
					reject( r );
				};

				try {
					then.call( x, resolvePromise, rejectPromise );
				} catch ( e ) {
					if ( ! called ) {
						reject( e );
						called = true;
						return;
					}
				}
			} else {
				fulfil( x );
			}
		} else {
			fulfil( x );
		}
	};

}
