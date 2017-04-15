import roadtrip from  "../roadtrip/roadtrip";
import eventer from "./handler/eventer";
import utils from "./util/utils";
import mode from "./util/mode";
import "./handler/routeAbuseMonitor";

var initOptions = {
	target: null,
	defaultRoute: null,
	debug: true
};

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
const location = window && ( window.history.location || window.location );

var journey = { };

eventer.init( journey );

journey.add = function add( path, options ) {
	
	if (path == null) {
		throw new Error("journey.add does not accept 'null' path");
	}
	
	if (options == null) {
		throw new Error("journey.add does not accept 'null' options");
	}
	
	options = utils.extend( { }, options );
	wrap( options );

	roadtrip.add( path, options );

	return journey;
};

journey.start = function ( options ) {

	initOptions = utils.extend( { }, initOptions, options );

	mode.DEBUG = initOptions.debug;

	roadtrip._goto = roadtrip.goto;
	roadtrip.goto = journey.goto;

	roadtrip.start( options );
};

journey.goto = function ( href, options ) {

		var promise = roadtrip._goto( href, options );

	if (promise._sameRoute) {
		return promise;
	}

	journey.emit( journey, "goto", {href: location.href} );

	//routeAbuseMonitor.push();
	//callstack.check();

	return promise;
};

function raiseError( options ) {
	utils.logError( options.error );
	journey.emit( journey, "error", options );
}

function raiseEvent( event, args ) {
	var options = { };
	if ( event === "update" || event === "updated" ) {
		options.route = args[0];

	} else if ( event === "beforeenter" || event === "beforeenterComplete" ) {
		options.to = args[0];
		options.from = args[1];

	} else if ( event === "enter" || event === "entered" ) {
		options.to = args[0];
		options.from = args[1];

	} else if ( event === "leave" || event === "left" ) {
		options.from = args[0];
		options.to = args[1];
	}

	journey.emit( journey, event, options );
}

function wrap( options ) {
	enhanceEvent( "enter", options );
	enhanceEvent( "update", options );
	enhanceEvent( "beforeenter", options );
	enhanceEvent( "leave", options );
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
			
			var options;
			
			if (name === "update") { // update only accepts one argument
				options = args[1];

			} else {
				options = args[2];
			}

			var options = options || {};

			// Ensure default target is passed to events, but don't override if already present
			options.target = options.target || initOptions.target;
			args.push(options);

			raiseEvent( name, args );

			// Call handler
			var result = handler.apply( that, args );

			result = Promise.all( [ result ] ); // Ensure handler result can be handled as promise
			result.then( () => {

				if ( name === "beforeenter" ) {
					raiseEvent( "beforeenterComplete", args );

				} else if ( name === "enter" ) {
					raiseEvent( "entered", args );

				} else if ( name === "leave" ) {
					raiseEvent( "left", args );

				} else if ( name === "update" ) {
					raiseEvent( "updated", args );
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
	utils.log( "JA journey got this one: " + event );
	var route, from, to;

	if ( event === "update" ) {
		route = args[0];

	} else if ( event === "beforeenter" || event === "enter" ) {
		route = args[0];
		to = args[0];
		from = args[1];
	} else {
		route = args[1];
		to = args[1];
		from = args[0];
	}
	var options = { error: err, event: event, from: from, to: to, route: route };
	return options;

}


export default journey;
