import Ractive from  "../lib/ractive";
import journey from "../lib/journey/journey";

journey.on( "routeAbuseStart", function ( ) {
	Ractive.defaults.transitionsEnabled = false;
	console.log( "* Animation disabled" );
} );
journey.on( "routeAbuseEnd", function ( ) {
	Ractive.defaults.transitionsEnabled = true;
	console.log( "** Renabling animations" );
} );
