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
	 * @param {Object} options specifies the route options:<pre><code> {<br/>
	 *		&nbsp;&nbsp;<em>enter</em>: function( route, prevRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>leave</em>: function( route, nextRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>beforeleave</em>:  function( route, nextRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>beforeenter</em> function( route, prevRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>update</em>: function( route, options )<br/>
	 *  }
	 * </code></pre>
	 * 
	 * @returns {journey} returns the journey instance to allow chaining: 
	 * <pre>
	 * journey.add( 'foo' ).add( 'bar' ).start();
	 * </pre>
	 */
	add( path, options ) {

		if ( path == null ) {
			throw new Error( "journey.add() requires a path argument!" );
		}

		options = util.extend( { }, options );

		routes.push( new Route( path, options ) );
		return journey;
	},

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
	 * Add a new route for the given path and options.
	 * 
	 * @param {string} path route url path eg. 'foo', '/foo', '#foo', '/foo:id', '/foo/:fooId/bar/:barId'
	 * 
	 * @param {Object} options specifies the route options:<pre>
	 *	<em>enter</em>: function( route, prevRoute, options ),<br/>
	 *  <em>leave</em>: function( route, nextRoute, options ),<br/>
	 *  <em>beforeleave</em>:  function( route, nextRoute, options ),<br/>
	 *  <em>beforeenter</em> function( route, prevRoute, options ),<br/>
	 *  <em>update</em>: function( route, options ),	 
	 * </pre>
	 * 
	 * @returns {journey} returns the journey instance to allow chaining: 
	 * <pre>
	 * journey.add( 'foo' ).add( 'bar' ).start();
	 * </pre>
	 */

	/**
	 * Navigate to the given <em>href</em>.
	 *  <em>invincible</em>: true/false, <br/>
	 *  <em>forceReload</em>: true/false <br/>
	 * @param {type} href
	 * @param {type} options
	 * @returns {journey.goto.promise.journeygoto#=>#109|arg.goto.promise|journey.goto.promise|Promise}
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

	getCurrentData () {
		return currentData;
	},

	getCurrentRoute () {
		return currentRoute;
	},	

	getBase ( ) {
		return config.base;
	},
	
	
	/** 
	 * 
	 * @param {string} name of the event to listen to: <em>enter, entered, leave, left, beforeenter, beforeenterComplete, beforeleave, beforeleaveComplete,
	 * update, updated, error, transitionAborted.
	 * 
	 * @param {function} the function to call when the event is fired. function receives an event argument: <b>journey.on ('enter', function ( event ) {});</b>
	 */
	on( event, listener ) {
		eventer.on( event, listener );
	},

	off( event, listener ) {
		eventer.off( event, listener );
	},

	once( event, listener ) {
		eventer.off( event, listener );
	},

	emit() {
		eventer.emit.apply( eventer, arguments );
	},

	emitEvent () {
		eventer.emitEvent.apply( eventer, arguments );
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
