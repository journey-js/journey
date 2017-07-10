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

	journey.on = ( event, listener ) => {
		//eventer.on.call( journey, event, listener );
		eventer.on( event, listener );
	};

	journey.off = ( event, listener ) => {
		eventer.off( event, listener );
	};

	journey.once = ( event, listener ) => {
		eventer.off( event, listener );
	};

	journey.emit = function () {
		eventer.emit.apply( eventer, arguments );
	};

	journey.emitEvent = function () {
		eventer.emitEvent.apply( eventer, arguments );
	};
};

/*
function addEvent( name, options ) {
	let handler = options[name];

	let wrapper = function ( ) {
		let that = this;
		let args;
		//var thatArgs = arguments;

		// Handle errors thrown by handler: enter, leave, update or beforeenter
		try {
			// convert arguments into a proper array
			args = Array.prototype.slice.call( arguments );

			let options = { };

			if ( name === events.UPDATE ) { // update only accepts one argument
				args[1] = options;
				
			} else {
				args[2] = options;		

			// Ensure default target is passed to events, but don't override if already present
			options.target = config.target;
			options.startOptions = config;
			options.hasHandler = handler != null;

			eventer.raiseEvent( name, args );

			// Call handler
			let result;

			if ( handler != null ) {
				result = handler.apply( that, args );
			}

			result = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise
			result.then( () => {

				if ( name === events.BEFORE_ENTER ) {
					eventer.raiseEvent( events.BEFORE_ENTER_COMPLETE, args );

				} else if ( name === events.ENTER ) {
					eventer.raiseEvent( events.ENTERED, args );
				}

				if ( name === events.BEFORE_LEAVE ) {
					eventer.raiseEvent( events.BEFORE_LEAVE_COMPLETE, args );

				} else if ( name === events.LEAVE ) {
					eventer.raiseEvent( events.LEFT, args );

				} else if ( name === events.UPDATE ) {
					eventer.raiseEvent( events.UPDATED, args );
				}
			} ).catch( err => {
				var options = gatherErrorOptions( name, args, err );
				eventer.raiseError( options );
			} );

			return result;

		} catch ( err ) {
			var options = gatherErrorOptions( name, args, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + name + "] - " + err.message ); // let others handle further up the stack
		}
	};

	options[name] = wrapper;
}
*/

eventer.raiseEvent = function ( event, args ) {

	var options = { };
	if ( event === events.UPDATE || event === events.UPDATED ) {
		options.route = args[0];
		options.options = args[1];

	} else if ( event === events.BEFORE_ENTER || event === events.BEFORE_ENTER_COMPLETE ) {
		options.to = args[0];
		options.from = args[1];
		options.options = args[2];

	} else if ( event === events.ENTER || event === events.ENTERED ) {
		options.to = args[0];
		options.from = args[1];
		options.options = args[2];

	} else if ( event === events.BEFORE_LEAVE || event === events.BEFORE_LEAVE_COMPLETE ) {
		options.from = args[0];
		options.to = args[1];
		options.options = args[2];

	} else if ( event === events.LEAVE || event === events.LEFT ) {
		options.from = args[0];
		options.to = args[1];
		options.options = args[2];
	}

	journey.emit( journey, event, options );
}

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