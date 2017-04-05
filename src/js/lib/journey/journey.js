import roadtrip from  "../roadtrip/roadtrip";
import Ractive from  "../ractive";
import EventEmitter from  "./EventEmitter";
import utils from "./util/utils";
import mode from "./util/mode";

var callstack = [ ];

var initOptions = {
	target: null,
	routes: null,
	defaultRoute: null,
	unknownRouteResolver: null,
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

	roadtrip.start( options );
};

journey.goto = function goto( href, options ) {
	var promise = roadtrip.goto( href, options );
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

function raiseEvent( eventName, args ) {
	var options = { };
	if ( eventName === "update" || "updated" ) {
		options.route = args[0];

	} else if ( eventName === "beforeenter" || "beforeenterComplete" ) {
		options.to = args[0];
		options.from = args[1];

	} else if ( eventName === "enter" || eventName === "entered" ) {
		options.to = args[0];
		options.from = args[1];

	} else if ( eventName === "leave" || eventName === "left" ) {
		options.from = args[0];
		options.to = args[1];
	}

	journey.emit( journey, eventName, options );
}

function wrap( options ) {
	addErrorHandling( "enter", options );
	addErrorHandling( "update", options );
	addErrorHandling( "beforeenter", options );
	addErrorHandling( "leave", options );
}

function wrapHandlerWithTrashingSupport( options ) {

	/*
	 
	 options.leave = function ( route, nextRoute ) {
	 var that = this;
	 var origArguments = arguments;
	 var promise = new Promise( function ( resolve, reject ) {
	 
	 // TODO playing with overwrite. Currently trying to simulate 2 different errors, one overwrite which should enter, 
	 // the other a ligit error which should not enter
	 var origPromise = origLeave.apply( that, origArguments );
	 
	 origPromise = Promise.all([origPromise]); // Ensure origLeave can be handled as promise
	 
	 origPromise.then( function () {
	 
	 var random = Math.random() >= 0.5;
	 if ( random ) {
	 resolve.apply( this, arguments );
	 
	 } else {
	 if ( Ractive.defaults.transitionsEnabled ) {
	 Ractive.defaults.transitionsEnabled = false;
	 reject( "overwritten" );
	 console.log( "randomly overwritten, and we are Rasing" );
	 
	 reenableAnimationsAfterDelay();
	 } else {
	 console.log( "randomly overwritten, but we are Skipping" );
	 resolve.apply( this, arguments );
	 }
	 }
	 
	 } ).catch( function ( e ) {
	 console.log( "journey caught reject", e );
	 reject( e );
	 } );
	 } );
	 return promise;
	 };*/

	options.leave._wrapped = true;
}

function addErrorHandling( name, options ) {
	var handler = options[name];

	// remove this wrapper stuff and rather copy options
	if ( handler == null ) {
		return;
	}

	var wrapper = function ( ) {
		var that = this;
		var thatArgs = arguments;

		// Handle errors thrown by handler: enter, leave, update or beforeenter
		try {
			raiseEvent( name, thatArgs );

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
			} );

			return result;

		} catch ( e ) {
			utils.log( "JA journey got this one: " + name );
			var route, from, to;

			if ( name === "update" ) {
				route = thatArgs[0];

			} else if ( name === "beforeenter" || "enter" ) {
				route = thatArgs[0];
				to = thatArgs[0];
				from = thatArgs[1];
			} else {
				route = thatArgs[1];
				to = thatArgs[1];
				from = thatArgs[0];
			}
			var options = { error: e, handler: name, from: from, to: to, route: route };
			raiseError( options );
			return Promise.reject( "error occurred in [" + name + "] - " + e.message ); // let others handle further up the stack
		}
	};

	options[name] = wrapper;

	//wrapper._wrapped = true;
}

function disableAnimations() {
	Ractive.defaults.transitionsEnabled = false;

}
;

function reenableAnimationsAfterDelay() {//reenableAnimationTracker) {
	// We wait a bit before enabling animations in case user is still thrashing UI.
	setTimeout( function () {
		Ractive.defaults.transitionsEnabled = true;
		utils.log( "Renabling animations" );
	}, 10350 );
}

export default journey;

