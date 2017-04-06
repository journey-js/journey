import Ractive from  "../../ractive";
import utils from  "../util/utils";
import callstack from  "./callstack";
var reenableAnimationRequest = false;
var journey;
var handler = {

	init: function ( options ) {

		journey = options.journey;
		journey.on( "rapidClickStart", ( ) => {
			Ractive.defaults.transitionsEnabled = false;
			handler.reenableAnimationsAfterDelay( );
			console.log( "Animation disabled" );
		} );
		journey.on( "rapidClickEnd", ( ) => {
			Ractive.defaults.transitionsEnabled = true;
			utils.log( "Renabling animations" );
		} );
	},

	reenableAnimationsAfterDelay: function ( ) {

		// if a request was already made to reenable animations, clear it and make a new request
		if ( reenableAnimationRequest ) {
			utils.log( "further delay reenabling animations" );
			clearTimeout( reenableAnimationRequest );
		}

		// We wait a bit before enabling animations in case user is still thrashing UI.
		reenableAnimationRequest = setTimeout( function ( ) {
			callstack.reset( );
		}, 2000 );
	}
};
export default handler;