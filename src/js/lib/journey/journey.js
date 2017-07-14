import Route from './Route.js';
import watchLinks from './utils/watchLinks.js';
import pathHelper from './utils/pathHelper.js';
import isSameRoute from './utils/isSameRoute.js';
import window from './utils/window.js';
import routes from './routes.js';
import watchHistory from './utils/watchHistory.js';
import util from './utils/util.js';
import config from './utils/config.js';
import eventer from "./event/eventer";
import handler from "./handler.js";
import events from "./event/events.js";
import mode from "./utils/mode.js";
import './utils/polyfill.js';
import "./event/routeAbuseMonitor.js";

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
const location = window && ( window.history.location || window.location );

function noop () {}

let currentData = {};
let currentRoute = {
	enter: () => journey.Promise.resolve(),
	leave: () => journey.Promise.resolve(),
	beforeleave: () => journey.Promise.resolve()
};

let _target;
let isTransitioning = false;

const scrollHistory = {};
let uniqueID = 1;
let currentID = uniqueID;

const journey = {
	Promise,

	/**
	 * Add a new route for the given path and transition options.
	 * 
	 * @param {string} path route url path eg. 'foo', '/foo', '#foo', '/foo:id', '/foo/:fooId/bar/:barId'
	 * 
	 * @param {Object} options specifies the route handlers:<pre><code> {<br/>
	 *		&nbsp;&nbsp;<em>enter</em>: function( route, prevRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>leave</em>: function( route, nextRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>beforeleave</em>:  function( route, nextRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>beforeenter</em> function( route, prevRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>update</em>: function( route, options )<br/>
	 *  }
	 * </code></pre>
	 * 
	 * @returns {journey} returns the journey instance to allow chaining: 
	 * <pre><code>
	 * journey.add( 'foo' ).add( 'bar' ).start();
	 * </code></pre>
	 */
	add( path, options ) {

		if ( path == null ) {
			throw new Error( "journey.add() requires a path argument!" );
		}

		options = util.extend( { }, options );

		routes.push( new Route( path, options ) );
		return journey;
	},

	/**
	 * Start Journey with the given options.
	 * <pre><code>
	 * journey.add('foo');
	 * journey.start();
	 * 
	 * // with options:
	 * journey.start( { target: '#main', debug: false, fallback: '/notFound'});
	defaultRoute: '/home'
	 * </code></pre>
	 * 
	 * @param {Object} options specifies the route options:<pre><code>
	 *  <em>target</em> (string): the default target to use for rendering views eg. '#main' to render to &lt;div id="main"&gt;&lt;/div&gt;,<br/>
	 *  <em>fallback</em> (string): specifies a route to use when navigating to a route that does not exist,<br/>
	 *  <em>debug</em> (boolean): specifies if Journey should print debug statements or not. default: true,<br/>
	 *  <em>base</em> (string): specifies a base path to use when deploying the application under a specific contextPath,<br/>
	 *  <em>defaultRoute</em> (string): specifies a default route Journey should navigate to upon startup if no route is specified,<br/>
	 *  <em>useHash</em> (boolean): specifies whether Hashes or HTML5 pushState should be used. default: true,<br/>
	 *  <em>hash</em> (string): specifies the hash string to eg. hash: #!, default: #,<br/>
	 * @returns a promise that resolves after the route enters, or rejects if an error occurs
	 */
	start ( options = {} ) {

		util.extend( config, options );

	mode.DEBUG = config.debug;
		
		watchHistory.start(config);
		watchHistory.setListener(historyListener);

		let path = pathHelper.getInitialPath();

		let matchFound = routes.some( route => route.matches( path ) );
		const href = matchFound ?
			path :
			config.fallback;

			const gotoOptions = {
				replaceState: true,
				scrollX: window.scrollX,
				scrollY: window.scrollY
			};

		return journey.goto( href, gotoOptions);
	},

	/**
	 * Navigate to the given <em>href</em>.
	 * <pre><code>
	 * journey.goto( 'foo' );
	 * journey.goto( 'foo', { forceReload: true, invisible: true });
	 * </code></pre>
	 * 
	 * @param {string} href specifies a registered path of the route to navigate to
	 * @param {Object} options specifies the route options:<pre><code>
	 *  <em>invisible</em> (boolean): whether to update the url or not,<br/>
	 *  <em>forceReload</em> (boolean): reload the route even if the given route is the current route,<br/>
	 *  <em>redirect</em> (boolean): specifies that this route will redirect. Journey won't fire routeAbuseStart/routeAbuseEnd.<br/>
	 * </code></pre>
	 * @returns a promise that resolves after the route enters, or rejects if an error occurs
	 */
	goto ( href, options = {}) {
		if (href == null) return journey.Promise.resolve();

		href = pathHelper.getGotoPath(href);

		scrollHistory[ currentID ] = {
			x: window.scrollX,
			y: window.scrollY
		};

		let target;
		const promise = new journey.Promise( ( fulfil, reject ) => {
			target = _target = {
				href,
				scrollX: options.scrollX || 0,
				scrollY: options.scrollY || 0,
				options,
				fulfil,
				reject,
				currentRoute: currentRoute,
				currentData: currentData
			};
		});
		
		promise._locked = false;
		
		_target.promise = promise;
		
		if ( isTransitioning ) {
			promise._locked = true;
			//return promise;
		}

		_goto( target );
		
		if ( target._sameRoute ) {
			return promise;
		}

		let emitOptions = {
			redirect: options.redirect,
			pathname: href,
			href: location.href
		};

		journey.emit( journey, events._GOTO, emitOptions );
	
		promise.catch( function ( err ) {
			// TODO should we catch this one here? If further inside the plumbing an error is also thrown we end up logging the error twice
			let errorOptions = handler.gatherErrorOptions( null, currentRoute, null, null, err );
			eventer.raiseError( errorOptions );
		} );

		return promise;
	},

	/**
	 * Returns the data for the current route
	 *
	 * @returns the data for the current route
	 */
	getCurrentData () {
		return currentData;
	},

	/**
	 * Returns the current route
	 *
	 * @returns the current route
	 */
	getCurrentRoute() {
		return currentRoute;
	},

	/**
	 * Returns the base that was set during startup.
	 *
	 * @returns the base that was set during startup
	 */
	getBase ( ) {
		return config.base;
	},

	/**
	 * Start listening to the given event, one of <em>enter, entered, leave, left, beforeenter, beforeenterComplete, beforeleave, beforeleaveComplete,
	 * update, updated, error, transitionAborted.
	 * 
	 * @param {string} event to listen to
	 * @param {function} listener the function to call when the event is fired. function receives an event argument: <b>journey.on ('enter', function ( event ) {});</b>
	 * @return {journey} Current instance of journey for chaining.
	 */
	on( event, listener ) {
		eventer.on( event, listener );
		return journey;
	},

	/**
	 * Stop listening to the given event, one of <em>enter, entered, leave, left, beforeenter, beforeenterComplete, beforeleave, beforeleaveComplete,
	 * update, updated, error, transitionAborted
	 * @param {string} event top stop listening to
	 * @param {function} listener optionally provide a specific listener to remove for the event
	 * @return {journey} Current instance of journey for chaining.
	 */
	off( event, listener ) {
		eventer.off( event, listener );
		return journey;
	},

	/**
	 * Listen to the given event once, after which the listener is removed. Event can be one of
	 *  <em>enter, entered, leave, left, beforeenter, beforeenterComplete, beforeleave, beforeleaveComplete, update, updated, error, transitionAborted.
	 *
	 * @param {string} event to listen to
	 * @param {function} listener the function to call when the event is fired. function receives an event argument: <b>journey.once ('enter', function ( event ) {});</b>
	 * @return {journey} Current instance of journey for chaining.
	 */
	once( event, listener ) {
		eventer.off( event, listener );
		return journey;
	},

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} event Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {journey} Current instance of journey for chaining.
	 */
	emit( event ) {
		eventer.emit.apply( eventer, arguments );
		return journey;
	},

	 /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} event Name of the event to emit and execute listeners for.
     * @param {Array} args Optional array of arguments to be passed to each listener.
     * @return {journey} Current instance of EventEmitter for chaining.
     */
	emitEvent ( event, args ) {
		eventer.emitEvent.apply( eventer, arguments );
		return journey;
	}
};

eventer.init( journey );
handler.init( journey );

if ( window ) {
	watchLinks( href => {
		journey.goto( href )

			.catch(e => {
				isTransitioning = false; 
			} );
	});
}

function getNewData(target) {
	let newData;
	let newRoute;

	for ( let i = 0; i < routes.length; i += 1 ) {
		const route = routes[i];
		newData = route.exec( target );

		if ( newData ) {
			newRoute = route;
			break;
		}
	}

	return {
		newRoute: newRoute,
		newData: newData
	};
}

function historyListener( options ) {

		let url = util.stripBase(options.url, journey.getBase());

	const targetOptions = {};
	let target;

		target = _target = {
			href: url,
			hashChange: options.hashChange, // so we know not to manipulate the history
			popState: options.popState, // so we know not to manipulate the history
			options: targetOptions,
			fulfil: noop,
			reject: noop,
			currentRoute: currentRoute,
			currentData: currentData
		};

		if(options.popEvent != null) {
			const scroll = scrollHistory[ options.popEvent.state.uid ] || {x: 0, y: 0};
			target.scrollX = scroll.x;
			target.scrollY = scroll.y;

		} else {
			target.scrollX = 0;
			target.scrollY = 0;
		}

		_goto( target );

		if(options.popEvent != null) {
			currentID = options.popEvent.state.uid;
		}
}

function _goto ( target ) {
	let newRoute;
	let newData;
	let forceReloadRoute = target.options.forceReload || false;

	let targetHref = pathHelper.prefixWithSlash(target.href);
	target.href = targetHref;

	var result = getNewData(target);

	if (!result.newData) {
		// If we cannot find data, it is because the requested url isn't mapped to a route. Use fallback to render page. Keep url pointing to requested url for 
		// debugging.
		let tempHref = target.href;
		target.href = config.fallback;
		result = getNewData(target);
		target.href = tempHref;
	}

	newData = result.newData;
	newRoute = result.newRoute;

	target._sameRoute = false;
	let _isSameRoute = isSameRoute( newRoute, target.currentRoute, newData, target.currentData );
	if ( !newRoute || ( _isSameRoute && !forceReloadRoute) ) {
		target.fulfil();
		target._sameRoute = true;
		return;
	}

	scrollHistory[ currentID ] = {
		x: ( target.currentData.scrollX = window.scrollX ),
		y: ( target.currentData.scrollY = window.scrollY )
	};

	isTransitioning = true;

	let promise;
	if ( !forceReloadRoute && ( newRoute === target.currentRoute ) && newRoute.updateable ) {
		
		// handler.emit(UPDATE);

		// For updates, merge newData into currentData, in order to preserve custom data that was set during enter or beforeenter events
		//newData = util.extend( target.currentData, newData );

		//promise = newRoute.update( newData );
		promise = handler.update( newRoute, newData, target );
		
		promise.then( () => {

			if ( !continueTransition( target, newData ) ) {
				return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
			}
		} );

	} else {

		promise = new journey.Promise((resolve, reject) => {

					let transitionPromise;

						//transitionPromise = journey.Promise.all([ target.currentRoute.beforeleave( target.currentData, newData )	]);
						transitionPromise = handler.beforeleave( newRoute, newData, target );

					transitionPromise
							.then( () => {
								if ( continueTransition( target, newData ) ) {
									let promise = handler.beforeenter( newRoute, newData, target );
									return promise;
								} else {

									resolve( {interrupted: true, msg: "route interrupted"} );
									return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							})

							.then( () => {
								if ( continueTransition( target, newData ) ) {

									let promise = handler.leave( newRoute, newData, target );
									return promise;

									//return journey.Promise.all( [ target.currentRoute.leave( target.currentData, newData ) ]);

								} else {
									let promiseResult = {interrupted: true, msg: "route interrupted"};

									resolve( promiseResult  );
									return journey.Promise.resolve( promiseResult );
								}
							})

							.then( () => {

								if ( continueTransition( target, newData ) ) {
									// Only update currentRoute *after* .leave is called and the route hasn't changed in the meantime
									//currentRoute = newRoute;
									//currentData = newData;

                                    //return newRoute.enter( newData, target.currentData ).then( () => resolve() );
									let promise = handler.enter( newRoute, newData, target );
									return promise;
								} else {
									resolve( {interrupted: true, msg: "route interrupted"} );
									return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							}).then( () => {
								resolve();
							})
							.catch( ( e ) => {
								return reject( e );
							} );
						} );
	}

	promise
		.then( ( ) => {

			isTransitioning = false;

			if ( continueTransition( target, newData ) ) {
				
				target.fulfil();
				updateHistory(target);

			} else {
				// if the user navigated while the transition was taking
				// place, we need to do it all again
				//_goto( _target );
				_target.promise.then( target.fulfil, target.reject );
			}
		})
		.catch( err => {
			isTransitioning = false;
			target.reject(err);
		});

		// If we want the URL to change to the target irrespective if an error occurs or not, uncomment below
		//updateHistory(target);
} // * _goto end*

function updateHistory(target) {
	
	if ( target.popState || target.hashChange ) return;

	const { replaceState, invisible } = target.options;
	if ( invisible ) return;
	
	const uid = replaceState ? currentID : ++uniqueID;

	let targetHref = target.href;

	if (watchHistory.useOnHashChange) {
		targetHref = pathHelper.prefixWithHash(targetHref);
		target.href = targetHref;
		watchHistory.setHash( targetHref, target.options );

	} else {

		if (config.useHash) {
			targetHref = pathHelper.prefixWithHash(targetHref);
			target.href = targetHref;

		} else {
			targetHref = pathHelper.prefixWithSlash(targetHref);
			// Add base path for pushstate, as we are routing to an absolute path '/' eg. /base/page1
			targetHref = util.prefixWithBase(targetHref, journey.getBase());
			target.href = targetHref;
		}

		history[ target.options.replaceState ? 'replaceState' : 'pushState' ]( { uid }, '', target.href );
	}

	currentID = uid;
	scrollHistory[ currentID ] = {
		x: target.scrollX,
		y: target.scrollY
	};
}

function continueTransition( target, newData ) {
	
	if ( target._transitionAborted === true )	return false;

	if ( _target === target ) {
		return true;
	}

	// add guard so we don't emit transition_aborted more than once for this route transition
	target._transitionAborted = true;

	let eventOptions = handler.getDefaultOptions( journey.getCurrentRoute() );
	let options = {
		to: newData,
		from: target.currentData,
		options: eventOptions
};

	eventer.emit( events.TRANSITION_ABORTED, options );
	return false;
}

/**
 * Not for public use.
 * 
 * @private
 * @param {type} target
 * @param {type} newRoute
 * @param {type} newData
 * @returns {undefined}
 */
journey._updateCurrentRoute = function( target, newRoute, newData) {
	// Only update currentRoute if the route hasn't changed in the meantime
	if (continueTransition(target, newData)) {
		currentRoute = newRoute;
		currentData = newData;
	}
};

export default journey;
