import roadtrip from  "../roadtrip/roadtrip";
import Ractive from  "../ractive";
import EventEmitter from  "./EventEmitter";
import utils from "./util/utils";
import mode from "./util/mode";
import rapidClickHandler from "./handler/rapidClick";
import callstack from "./handler/callstack";

var initOptions = {
	target: null,
	defaultRoute: null,
	debug: true
};

var journey = new EventEmitter();

var origEmit = journey.emit;

journey.add = function add( path, options ) {
	options = utils.extend( { }, options );
	wrap( options );

	roadtrip.add( path, options );

	return journey;
};

journey.start = function ( options ) {

	initOptions = utils.extend( { }, initOptions, options );

	mode.DEBUG = Ractive.DEBUG = initOptions.debug;

	roadtrip._goto = roadtrip.goto;
	roadtrip.goto = journey.goto;
	
	callstack.init({journey: journey});
	rapidClickHandler.init({journey: journey});

	roadtrip.start( options );
};

journey.goto = function goto( href, options ) {
	callstack.push();
	callstack.check();
	var promise = roadtrip._goto( href, options );

	return promise;
};


journey.emit = function ( that ) {
	if ( typeof that === 'string' ) {
		var args = Array.prototype.slice.call( arguments );
		args.unshift( this );
		return origEmit.apply( this, args );
	}
	origEmit.apply( this, arguments );
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
	addErrorHandling( "enter", options );
	addErrorHandling( "update", options );
	addErrorHandling( "beforeenter", options );
	addErrorHandling( "leave", options );
}

function addErrorHandling( name, options ) {
	var handler = options[name];

	if ( handler == null ) {
		return;
	}

	var wrapper = function ( ) {
		var that = this;
		var thatArgs = arguments;

		// Handle errors thrown by handler: enter, leave, update or beforeenter
		try {
			raiseEvent( name, thatArgs );
			
			// Pass default target to events events
			thatArgs.target = initOptions.target;

			// Call handler
			var result = handler.apply( that, thatArgs );

			result = Promise.all( [ result ] ); // Ensure handler result can be handled as promise
			result.then( function () {

				if ( name === "beforeenter" ) {
					raiseEvent( "beforeenterComplete", thatArgs );

				} else if ( name === "enter" ) {
					raiseEvent( "entered", thatArgs );

				} else if ( name === "leave" ) {
					raiseEvent( "left", thatArgs );

				} else if ( name === "update" ) {
					raiseEvent( "updated", thatArgs );
				}
			} ).catch( err => {
				var options = gatherErrorOptions( name, thatArgs, err );
				raiseError( options );
			} );

			return result;

		} catch ( err ) {
			var options = gatherErrorOptions( name, thatArgs, err );
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

