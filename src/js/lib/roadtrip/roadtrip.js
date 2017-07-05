import Route from './Route.js';
import watchLinks from './utils/watchLinks.js';
import pathHelper from './utils/pathHelper.js';
import isSameRoute from './utils/isSameRoute.js';
import window from './utils/window.js';
import routes from './routes.js';
import watchHistory from './utils/watchHistory.js';
import util from './utils/util.js';
import config from './utils/config.js';
import './utils/polyfill.js';

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
const location = window && ( window.history.location || window.location );

function noop () {}

let currentData = {};
let currentRoute = {
	enter: () => roadtrip.Promise.resolve(),
	leave: () => roadtrip.Promise.resolve(),
	beforeleave: () => roadtrip.Promise.resolve()
};

let _target;
let isTransitioning = false;

const scrollHistory = {};
let uniqueID = 1;
let currentID = uniqueID;

const roadtrip = {
	Promise,

	add ( path, options ) {
		routes.push( new Route( path, options ) );
		return roadtrip;
	},

	start ( options = {} ) {

		util.extend( config, options );
		
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

		return roadtrip.goto( href, otherOptions, internalOptions);
	},

	goto ( href, internalOptions = {}) {
		if (href == null) return roadtrip.Promise.resolve();

		href = pathHelper.getGotoPath(href);

		scrollHistory[ currentID ] = {
			x: window.scrollX,
			y: window.scrollY
		};

		let target;
		const promise = new roadtrip.Promise( ( fulfil, reject ) => {
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
		
		promise._locked = false;
		
		_target.promise = promise;
		
		if ( isTransitioning ) {
			promise._locked = true;
			//return promise;
		}

		_goto( target );

		promise._sameRoute = target._sameRoute;
		return promise;
	},

	getCurrentData () {
		return currentData;
	},

	getCurrentRoute () {
		return currentRoute;
	}
};

if ( window ) {
	watchLinks( href => {
		roadtrip.goto( href )

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

		let url = util.stripBase(options.url, config.base);

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

	//let targetHref = util.stripBase(target.href, config.base);
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

		promise = new roadtrip.Promise((resolve, reject) => {
			
					let transitionPromise;

						transitionPromise = roadtrip.Promise.all([ target.currentRoute.beforeleave( target.currentData, newData )	]);

					transitionPromise
							.then( () => {
								if ( _target === target ) {
									return roadtrip.Promise.all( [ newRoute.beforeenter( newData, target.currentData ) ]);
								} else {

									resolve( {interrupted: true, msg: "route interrupted"} );
									return roadtrip.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							})

							.then( () => {
								if ( _target === target ) {

									target._left = true;
									return roadtrip.Promise.all( [ target.currentRoute.leave( target.currentData, newData ) ]);

								} else {
									let promiseResult = {interrupted: true, msg: "route interrupted"};

									resolve( promiseResult  );
									return roadtrip.Promise.resolve( promiseResult );
								}
							})

							.then( () => {
								target.currentRoute._left = true;

								if ( _target === target ) {
									// Only update currentRoute *after* .leave is called and the route hasn't changed in the meantime
									currentRoute = newRoute;
									currentData = newData;

                                    return newRoute.enter( newData, target.currentData ).then( () => resolve() );

								} else {
									resolve( {interrupted: true, msg: "route interrupted"} );
									return roadtrip.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							}).then( () => {
								if ( _target === target ) {
									// Route entered, so we switch off left prop
									newRoute._left = false;
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

			if ( _target === target ) {
				target.fulfil();
				updateHistory(target);

			} else {
				newRoute._interrupted = true;
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
			targetHref = util.prefixWithBase(targetHref, config.base);
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

export default roadtrip;
