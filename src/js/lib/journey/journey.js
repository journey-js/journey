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

var journey = {	};

eventer.init( journey );

journey.add = function add( path, options ) {
	
	if (path == null) {
		throw new Error("journey.add does not accept 'null' path");
	}
	
	if (options == null) {
		throw new Error("journey.add does not accept 'null' options");
	}
	
	options = roadtripUtils.extend( { }, options );
	wrap( options );

	roadtrip.add( path, options );

	return journey;
};

journey.start = function( options ) {

	roadtripUtils.extend( config, options );

	mode.DEBUG = config.debug;
	
	wrapRoadtripGoto();

	return roadtrip.start( options );
};

journey.goto = function ( href, internalOptions = {}) {
	if (roadtrip._origGoto == null) {
		throw new Error("call start() before using journey");
	}
		var promise = roadtrip._origGoto( href, internalOptions );

	if (promise._sameRoute) {
		return promise;
	}

	journey.emit( journey, "goto", {href: location.href} );

	//routeAbuseMonitor.push();
	//callstack.check();

	return promise;
};

journey.getBase = function( ) {
	return roadtrip.base;
};

journey.getCurrentRoute = function( ) {
	return roadtrip.getCurrentRoute();
};

function raiseError( options ) {
	journeyUtils.logError( options.error );
	journey.emit( journey, "error", options );
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
		
	} else if ( event === events.BEFORE_LEAVE || event === events.BEFORE_LEAVE_COMPLETE) {
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

function wrap( options ) {
	enhanceEvent( events.ENTER, options );
	enhanceEvent( events.UPDATE, options );
	enhanceEvent( events.BEFORE_ENTER, options );
	enhanceEvent( events.LEAVE, options );
	enhanceEvent( events.BEFORE_LEAVE, options );
}

function enhanceEvent( name, options ) {
	var handler = options[name];

	if ( handler == null ) {
		return;
	}

	var wrapper = function ( ) {
		var that = this;
		//var thatArgs = arguments;

		// Handle errors thrown by handler: enter, leave, update or beforeenter
		try {
			// convert arguments into a proper array
			var args = Array.prototype.slice.call(arguments);
			
			var options = {};
			
			if (name === events.UPDATE) { // update only accepts one argument
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

			raiseEvent( name, args );

			// Call handler
			var result = handler.apply( that, args );

			result = Promise.all( [ result ] ); // Ensure handler result can be handled as promise
			result.then( () => {

				if ( name === events.BEFORE_ENTER ) {
					raiseEvent( events.BEFORE_ENTER_COMPLETE, args );

				} else if ( name === events.ENTER ) {
					raiseEvent( events.ENTERED, args );

				} if ( name === events.BEFORE_LEAVE ) {
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
	return options;

}

function wrapRoadtripGoto() {
	// Ensure to only wrap goto once, in case journey.start is called more than once
	if (roadtrip._origGoto != null) return;

	roadtrip._origGoto = roadtrip.goto;
	roadtrip.goto = journey.goto;

	
}

export default journey;
