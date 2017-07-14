import EventEmitter from  "./EventEmitter.js";
import util from "../utils/util.js";
import events from "./events.js";
import config from "../utils/config.js";

var eventer = new EventEmitter();

var journey;

var origEmit = eventer.emit;

eventer.emit = function ( that ) {
	if ( typeof that === 'string' ) {
		var args = Array.prototype.slice.call( arguments );
		args.unshift( journey );
		return origEmit.apply( this, args );
	}
	origEmit.apply( this, arguments );
};

eventer.init = ( arg ) => {
	journey = arg;
};

eventer.raiseError = function ( options ) {
	util.logError( options.error );
	journey.emit( journey, events.ERROR, options );
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
	options.target = config.target;
	options.startOptions = config;
	return options;
}

export default eventer;