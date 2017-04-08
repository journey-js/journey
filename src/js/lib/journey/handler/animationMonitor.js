import Ractive from  "../../ractive";
import utils from  "../util/utils";
import eventer from "./eventer";

eventer.on( "routeAbuseStart", function ( ) {
	Ractive.defaults.transitionsEnabled = false;
	utils.log( "* Animation disabled" );
} );
eventer.on( "routeAbuseEnd", function ( ) {
	Ractive.defaults.transitionsEnabled = true;
	utils.log( "** Renabling animations" );
} );
