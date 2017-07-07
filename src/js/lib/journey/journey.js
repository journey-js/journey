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
import mode from "./utils/mode";
import events from "./event/events.js";
import './utils/polyfill.js';
import "./handler/routeAbuseMonitor";

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

	add ( path, options ) {

		if ( path == null ) {
			throw new Error( "journey.add() requires a path argument!" );
		}

		options = util.extend( { }, options );

		eventer.addEvents( options );

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

			const internalOptions = {
				replaceState: true,
				scrollX: window.scrollX,
				scrollY: window.scrollY
			};
			const otherOptions = {};

		return journey.goto( href, otherOptions, internalOptions);
	},

	goto ( href, internalOptions = {}) {
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
				scrollX: internalOptions.scrollX || 0,
				scrollY: internalOptions.scrollY || 0,
				internalOptions,
				fulfil,
				reject,
				currentRoute: currentRoute,
				currentData: currentData
			};
		});
		console.log("lockdown currentRoute:", target.currentRoute.path, " for:", href)
		
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
		redirect: internalOptions.redirect,
		pathname: href,
		href: location.href
	};

	journey.emit( journey, events._GOTO, emitOptions );
	
		promise.catch( function ( e ) {
			// TODO should we catch this one here? If further inside the plumbing an error is also thrown we end up logging the error twice
			eventer.raiseError( { error: e } );
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
	}
};

eventer.init( journey );

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

function historyListener(options) {

		let url = util.stripBase(options.url, journey.getBase());

	const internalOptions = {};
	let target;

		target = _target = {
			href: url,
			hashChange: options.hashChange, // so we know not to manipulate the history
			popState: options.popState, // so we know not to manipulate the history
			internalOptions,
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
	let forceReloadRoute = target.internalOptions.forceReload || false;

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

		// For updates, merge newData into currentData, in order to preserve custom data that was set during enter or beforeenter events
		newData = newData.extend({}, target.currentData, newData);

		promise = newRoute.update( newData );

	} else {

		promise = new journey.Promise((resolve, reject) => {
			
					let transitionPromise;

						transitionPromise = journey.Promise.all([ target.currentRoute.beforeleave( target.currentData, newData )	]);

					transitionPromise
							.then( () => {
								if ( continueTransition( target ) ) {
									return journey.Promise.all( [ newRoute.beforeenter( newData, target.currentData ) ]);
								} else {

									resolve( {interrupted: true, msg: "route interrupted"} );
									return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							})

							.then( () => {
								if ( continueTransition( target ) ) {

									return journey.Promise.all( [ target.currentRoute.leave( target.currentData, newData ) ]);
								} else {
									let promiseResult = {interrupted: true, msg: "route interrupted"};

									resolve( promiseResult  );
									return journey.Promise.resolve( promiseResult );
								}
							})

							.then( () => {

								if ( continueTransition( target ) ) {
									// Only update currentRoute *after* .leave is called and the route hasn't changed in the meantime
									currentRoute = newRoute;
									currentData = newData;

                                    return newRoute.enter( newData, target.currentData ).then( () => resolve() );
								} else {
									resolve( {interrupted: true, msg: "route interrupted"} );
									return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							}).then( () => {
								if ( continueTransition( target ) ) {
								}
							})
							.catch( ( e ) => {
								return reject( e );
							} );
						} );
	}

	promise
		.then( ( ) => {

			isTransitioning = false;

			if ( continueTransition( target ) ) {
				
				target.fulfil();
				updateHistory(target);

			} else {
				// if the user navigated while the transition was taking
				// place, we need to do it all again
				//console.log("target != _target", newRoute.path)
				//_goto( _target );
				_target.promise.then( target.fulfil, target.reject );
			}
		})
		.catch( e => {
			isTransitioning = false;
			target.reject(e);
		});

		// If we want the URL to change to the target irrespective if an error occurs or not, uncomment below
		//updateHistory(target);
} // * _goto end*

function updateHistory(target) {
	
	if ( target.popState || target.hashChange ) return;

	const { replaceState, invisible } = target.internalOptions;
	if ( invisible ) return;
	
	const uid = replaceState ? currentID : ++uniqueID;

	let targetHref = target.href;

	if (watchHistory.useOnHashChange) {
		targetHref = pathHelper.prefixWithHash(targetHref);
		target.href = targetHref;
		watchHistory.setHash( targetHref, target.internalOptions );

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

		history[ target.internalOptions.replaceState ? 'replaceState' : 'pushState' ]( { uid }, '', target.href );
	}

	currentID = uid;
	scrollHistory[ currentID ] = {
		x: target.scrollX,
		y: target.scrollY
	};
}

function continueTransition(target) {
	if (_target === target) return true;
	return false;
}

export default journey;
