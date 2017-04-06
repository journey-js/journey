var callstack = [ ];

var journey;


var handler = {

	init: ( options ) => {
		journey = options.journey;
		setupListeners();
	},

	check: () => {
		console.log( "check callstack: ", callstack.length );
		if ( callstack.length > 1 ) {
			journey.emit( journey, "rapidClickStart" );
		}
	},
	reset: () => {
		callstack = [ ];
		journey.emit( journey, "rapidClickEnd" );
	},

	push: () => {
		callstack.push( 1 );
	},

	pop: () => {
		callstack.splice( 0, 1 );
		if ( callstack.length === 0 ) {
		}
		console.log( "pop AT:", callstack.length );
	}
};

function setupListeners() {


	journey.on( "error", ( options ) => {
		handler.pop();
		console.log( "ERROR", callstack.length );
		//debugger;
	} );

	journey.on( "entered", ( options ) => {
		handler.pop();
		console.log( "ENTERED", callstack.length );
		//debugger;
	} );

	journey.on( "updated", ( options ) => {
		handler.pop();
		console.log( "UPDATED", callstack.length );
		//debugger;
	} );
}

export default handler;
