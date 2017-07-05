import './utils/polyfill.js';
import roadtrip from  "../roadtrip/roadtrip";
import eventer from "./handler/eventer";
import journeyUtils from "./utils/util.js";
import roadtripUtils from "../roadtrip/utils/util.js";
import mode from "./utils/mode";
import events from "./utils/events";
import "./handler/routeAbuseMonitor";
import config from "./utils/config.js";

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
const location = window && ( window.history.location || window.location );

var journey = { };

eventer.init( journey );

journey.add = function add( path, options ) {

	if ( path == null ) {
		throw new Error( "journey.add does not accept 'null' path" );
	}

	if ( options == null ) {
		throw new Error( "journey.add does not accept 'null' options" );
	}

	options = roadtripUtils.extend( { }, options );
	wrap( options );

	roadtrip.add( path, options );

	return journey;
};

journey.start = function ( options ) {

	roadtripUtils.extend( config, options );

	mode.DEBUG = config.debug;

	wrapRoadtripGoto();

	return roadtrip.start( options );
};

journey.goto = function ( href, internalOptions = {} ) {
	if ( roadtrip._origGoto == null ) {
		throw new Error( "call start() before using journey" );
	}

	var promise = roadtrip._origGoto( href, internalOptions );

	if ( promise._sameRoute ) {
		return promise;
	}

	let emitOptions = {
		redirect: internalOptions.redirect,
		pathname: href,
		href: location.href
	};

	journey.emit( journey, events._GOTO, emitOptions );

	promise.catch( function(e) {
		// TODO should we catch this one here? If further inside the plumbing an error is also thrown we end up logging the error twice
		raiseError( { error: e } );
	});

	return promise;
};

journey.getBase = function ( ) {
	return roadtrip.base;
};

journey.getCurrentRoute = function ( ) {
	return roadtrip.getCurrentRoute();
};

journey.getCurrentData = function ( ) {
	return roadtrip.getCurrentData();
};

function wrap( options ) {
	enhanceEvent( events.ENTER, options );

	// Only enhance 'update' if it is declared on route, otherwise Roadtrip will see every route as updateable
	// and could call update (depending on the route url) instead of the normal enter/leave cycle as the user intended
	// by not declaring an update handler.
	let handler = options[events.UPDATE];
	if ( handler != null ) {
		enhanceEvent( events.UPDATE, options );
	}

	enhanceEvent( events.BEFORE_ENTER, options );
	enhanceEvent( events.LEAVE, options );
	enhanceEvent( events.BEFORE_LEAVE, options );
}

function enhanceEvent( name, options ) {
	let handler = options[name];

	let wrapper = function ( ) {
		let that = this;
		let args;
		//var thatArgs = arguments;

		// Handle errors thrown by handler: enter, leave, update or beforeenter
		try {
			// convert arguments into a proper array
			args = Array.prototype.slice.call( arguments );

			let options = { };

			if ( name === events.UPDATE ) { // update only accepts one argument
				args[1] = options;
				/*
				 if (options == null) {
				 options = args[1] = {};
				 }*/

			} else {
				args[2] = options;
				/*
				 if (options == null) {
				 options = args[2] = {};
				 }*/
			}

			// Ensure default target is passed to events, but don't override if already present
			options.target = config.target;
			options.startOptions = config;
			options.hasHandler = handler != null;

			raiseEvent( name, args );

			// Call handler
			let result;

			if ( handler != null ) {
				result = handler.apply( that, args );
			}

			result = Promise.all( [ result ] ); // Ensure handler result can be handled as promise
			result.then( () => {

				if ( name === events.BEFORE_ENTER ) {
					raiseEvent( events.BEFORE_ENTER_COMPLETE, args );

				} else if ( name === events.ENTER ) {
					raiseEvent( events.ENTERED, args );

				}
				if ( name === events.BEFORE_LEAVE ) {
					raiseEvent( events.BEFORE_LEAVE_COMPLETE, args );

				} else if ( name === events.LEAVE ) {
					raiseEvent( events.LEFT, args );

				} else if ( name === events.UPDATE ) {
					raiseEvent( events.UPDATED, args );
				}
			} ).catch( err => {
				var options = gatherErrorOptions( name, args, err );
				raiseError( options );
			} );

			return result;

		} catch ( err ) {
			var options = gatherErrorOptions( name, args, err );
			raiseError( options );
			return Promise.reject( "error occurred in [" + name + "] - " + err.message ); // let others handle further up the stack
		}
	};

	options[name] = wrapper;
}

function raiseEvent( event, args ) {
	var options = { };
	if ( event === events.UPDATE || event === events.UPDATED ) {
		options.route = args[0];
		options.options = args[1];

	} else if ( event === events.BEFORE_ENTER || event === events.BEFORE_ENTER_COMPLETE ) {
		options.to = args[0];
		options.from = args[1];
		options.options = args[2];

	} else if ( event === events.ENTER || event === events.ENTERED ) {
		options.to = args[0];
		options.from = args[1];
		options.options = args[2];

	} else if ( event === events.BEFORE_LEAVE || event === events.BEFORE_LEAVE_COMPLETE ) {
		options.from = args[0];
		options.to = args[1];
		options.options = args[2];

	} else if ( event === events.LEAVE || event === events.LEFT ) {
		options.from = args[0];
		options.to = args[1];
		options.options = args[2];
	}

	journey.emit( journey, event, options );
}

function raiseError( options ) {
	journeyUtils.logError( options.error );
	journey.emit( journey, events.ERROR, options );
}

function gatherErrorOptions( event, args, err ) {
	var route, from, to;

	if ( event === events.UPDATE ) {
		route = args[0];

	} else if ( event === events.BEFORE_ENTER || event === events.ENTER ) {
		route = args[0];
		to = args[0];
		from = args[1];
	} else { // LEAVE and BEFORE_LEAVE
		route = args[1];
		to = args[1];
		from = args[0];
	}
	var options = { error: err, event: event, from: from, to: to, route: route };
	options.target = config.target;
	options.startOptions = config;
	return options;

}

function wrapRoadtripGoto() {
	// Ensure to only wrap goto once, in case journey.start is called more than once
	if ( roadtrip._origGoto != null )
		return;

	roadtrip._origGoto = roadtrip.goto;
	roadtrip.goto = journey.goto;


}

export default journey;
