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
	leave: () => roadtrip.Promise.resolve()
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
				reject
			};
		});
		
		promise._locked = false;
		
		_target.promise = promise;
		
		if ( isTransitioning ) {
			promise._locked = true;
			return promise;
		}

		_goto( target );

		promise._sameRoute = target._sameRoute;
		return promise;
	},

	getCurrentRoute () {
		return currentData;
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

		_target = {
			href: url,
			hashChange: options.hashChange, // so we know not to manipulate the history
			popState: options.popState, // so we know not to manipulate the history
			fulfil: noop,
			reject: noop,
			internalOptions
		};

		if(options.popEvent != null) {
			const scroll = scrollHistory[ options.popEvent.state.uid ] || {x: 0, y: 0};
			_target.scrollX = scroll.x;
			_target.scrollY = scroll.y;

		} else {
			_target.scrollX = 0;
			_target.scrollY = 0;
		}

		_goto( _target );

		if(options.popEvent != null) {
			currentID = options.popEvent.state.uid;
		}
}

function _goto ( target ) {
	let newRoute;
	let newData;
	let forceReloadRoute = target.internalOptions.forceReload || false;

	//let targetHref = util.stripBase(target.href, config.base);
	targetHref = pathHelper.prefixWithSlash(target.href);
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
	if ( !newRoute || (isSameRoute( newRoute, currentRoute, newData, currentData ) && !forceReloadRoute) ) {
		target.fulfil();
		target._sameRoute = true;
		return;
	}

	scrollHistory[ currentID ] = {
		x: ( currentData.scrollX = window.scrollX ),
		y: ( currentData.scrollY = window.scrollY )
	};

	isTransitioning = true;

	let promise;
	if ( !forceReloadRoute && ( newRoute === currentRoute ) && newRoute.updateable ) {

		// For updates, copy merge newData into currentData, in order to peserve custom data that was set during enter or beforeenter events
		newData = newData.extend({}, currentData, newData);

		promise = newRoute.update( newData );
	} else {
		promise = roadtrip.Promise.all([
			currentRoute.leave( currentData, newData ),
			newRoute.beforeenter( newData, currentData )
		]).then( () => newRoute.enter( newData, currentData ) );
	}

	promise
		.then( () => {
			currentRoute = newRoute;
			currentData = newData;

			isTransitioning = false;

			// if the user navigated while the transition was taking
			// place, we need to do it all again
			if ( _target !== target ) {
				_goto( _target );
				_target.promise.then( target.fulfil, target.reject );

			} else {
				target.fulfil();
			}
		})
		.catch( e => {
			isTransitioning = false;
			target.reject(e);
		});

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
