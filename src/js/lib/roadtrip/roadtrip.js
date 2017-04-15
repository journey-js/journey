import Route from './Route.js';
import watchLinks from './utils/watchLinks.js';
import isSameRoute from './utils/isSameRoute.js';
import window from './utils/window.js';
import routes from './routes.js';

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
const location = window && ( window.history.location || window.location );

function noop () {}

let initOptions;

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
	base: '',
	Promise,

	add ( path, options ) {
		routes.push( new Route( path, options ) );
		return roadtrip;
	},

	start ( options = {} ) {
		const href = routes.some( route => route.matches( location.href ) ) ?
			location.href :
			options.fallback;

	initOptions = options;

		return roadtrip.goto( href, {
			replaceState: true,
			scrollX: window.scrollX,
			scrollY: window.scrollY
		});
	},

	goto ( href, options = {} ) {
		scrollHistory[ currentID ] = {
			x: window.scrollX,
			y: window.scrollY
		};

		let target;
		const promise = new roadtrip.Promise( ( fulfil, reject ) => {
			target = _target = {
				href,
				scrollX: options.scrollX || 0,
				scrollY: options.scrollY || 0,
				options,
				initOptions,
				fulfil,
				reject
			};
		});
		
		promise._locked = false;
		if ( isTransitioning ) {
			promise._locked = true;
			return promise;
		}

		_goto( target );

		promise._sameRoute = target._sameRoute;
		return promise;
	}
};

if ( window ) {
	watchLinks( href => roadtrip.goto( href )
			.catch(e => {
				isTransitioning = false; 
	} ) );

	// watch history
	window.addEventListener( 'popstate', event => {
		if ( !event.state ) return; // hashchange, or otherwise outside roadtrip's control
		const scroll = scrollHistory[ event.state.uid ];

		_target = {
			href: location.href,
			scrollX: scroll.x,
			scrollY: scroll.y,
			popstate: true, // so we know not to manipulate the history
			fulfil: noop,
			reject: noop,
			options: initOptions
		};

		_goto( _target );
		currentID = event.state.uid;
	}, false );
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

function _goto ( target ) {
	let newRoute;
	let newData;

	var result = getNewData(target);

	if (!result.newData) {
		let tempHref = target.href;
		target.href = initOptions.fallback;
		result = getNewData(target);
		target.href = tempHref;
	}
	newData = result.newData;
	newRoute = result.newRoute;

	target._sameRoute = false;
	if ( !newRoute || isSameRoute( newRoute, currentRoute, newData, currentData ) ) {
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
	if ( ( newRoute === currentRoute ) && newRoute.updateable ) {

		// For updates, copy merge newData into currentData, in order to peserve custom data that was set during enter or beforeenter events
		newData = newData.extend({}, currentData, newData);

		promise = newRoute.update( newData, target.options );
	} else {
		promise = roadtrip.Promise.all([
			currentRoute.leave( currentData, newData, target.options ),
			newRoute.beforeenter( newData, currentData, target.options )
		]).then( () => newRoute.enter( newData, currentData, target.options ) );
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
			} else {
				target.fulfil();
			}
		})
		.catch( e => {
			isTransitioning = false;
			target.reject(e); 
		});

	if ( target.popstate ) return;

	const uid = target.options.replaceState ? currentID : ++uniqueID;
	history[ target.options.replaceState ? 'replaceState' : 'pushState' ]( { uid }, '', target.href );

	currentID = uid;
	scrollHistory[ currentID ] = {
		x: target.scrollX,
		y: target.scrollY
	};
}

export default roadtrip;
