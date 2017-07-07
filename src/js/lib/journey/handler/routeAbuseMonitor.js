import eventer from "../event/eventer.js";
import utils from  "../utils/util.js";
import config from  "../utils/config.js";
import events from  "../event/events.js";

let callstack = [ ];

let resetRequest = false;

let busy = false;

setupListeners();

var handler = {

	check: ( options ) => {
		if ( callstack.length > 1 ) {

			if ( !busy ) {
				busy = true;
				options.startOptions = config;
				eventer.emit( events.ROUTE_ABUSE_START, options );
			}

			// After a short delay we check if the callstack is back to normal.
			// If at the end of the delay the callstack is normal, we emit ROUTE_ABUSE_STOP event.
			// If the callstack overflows again during the delay, we cancel the reset request
			// and begin a new reset request after a delay.
			var delay = config.abuseTimeout;
			resetWhenNormal( delay, options );
		}
	},
	reset: ( options ) => {
		callstack = [ ];
		resetRequest = false;
		busy = false;
		options.startOptions = config;
		eventer.emit( events.ROUTE_ABUSE_STOP, options );
	},

	push: ( options ) => {
		callstack.push( 1 );
		handler.check( options );
	},

	pop: () => {
		callstack.splice( 0, 1 );
	}
};

function setupListeners() {

	eventer.on( events._GOTO, ( options ) => {
		if ( options.redirect === true ) {
			return;
		}
		handler.push( options );
	} );


	eventer.on( events.ERROR, ( options ) => {
		handler.pop();
	} );

	eventer.on( events.ENTERED, ( options ) => {
		handler.pop();
	} );

	eventer.on( events.UPDATED, ( options ) => {
		handler.pop();
	} );
}

function resetWhenNormal( delay = config.abuseTimeout, options ) {

	// if a request was already made to reenable animations, clear it and make a new request
	if ( resetRequest ) {
		clearTimeout( resetRequest );
	}

	// We wait a bit before restting callstack in case user is still thrashing UI.
	resetRequest = setTimeout( function ( ) {
		handler.reset( options );
	}, delay );
}

export default handler;
