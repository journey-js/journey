import eventer from "./eventer";
import utils from  "../util/utils";

var callstack = [ ];

var resetRequest = false;

setupListeners();

var handler = {

	//init: ( options ) => {
	//},

	check: () => {
		console.log( "check abuseMonitor: ", callstack.length );
		if ( callstack.length > 1 ) {
			eventer.emit( "routeAbuseStart" );

			// After a short delay we check if the callstack is back to normal.
			// If at the end of the dely the callstack is normal, we emit "callstackNormal" event.
			// If the callstack overflows again during the delay, we cancel the reset request
			// and begin a new reset request after a delay.
			var delay = 2000;
			resetWhenNormal( delay );
		}
	},
	reset: () => {
		callstack = [ ];
		eventer.emit( "routeAbuseEnd" );
	},

	push: () => {
		callstack.push( 1 );
		handler.check();
	},

	pop: () => {
		callstack.splice( 0, 1 );
		if ( callstack.length === 0 ) {
		}
		console.log( "pop AT:", callstack.length );
	}
};

function setupListeners() {

	eventer.on( "goto", ( options ) => {
		handler.push();
		console.log( "GOTO", callstack.length );
	} );


	eventer.on( "error", ( options ) => {
		handler.pop();
		console.log( "ERROR", callstack.length );
		//debugger;
	} );

	eventer.on( "entered", ( options ) => {
		handler.pop();
		console.log( "ENTERED", callstack.length );
		//debugger;
	} );

	eventer.on( "updated", ( options ) => {
		handler.pop();
		console.log( "UPDATED", callstack.length );
		//debugger;
	} );
}

function resetWhenNormal( delay = 2000 ) {

	// if a request was already made to reenable animations, clear it and make a new request
	if ( resetRequest ) {
		utils.log( "further delay resetting abuseMonitor" );
		clearTimeout( resetRequest );
	}

	// We wait a bit before restting callstack in case user is still thrashing UI.
	resetRequest = setTimeout( function ( ) {
		handler.reset( );
	}, delay );
}

export default handler;
