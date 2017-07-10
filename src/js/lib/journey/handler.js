import events from "./event/events.js";
import eventer from "./event/eventer.js";
import util from "./utils/util.js";
import config from "./utils/config.js";

let journey;

let handler = {

	init( arg ) {
		journey = arg;
	},

	update( newRoute, newData, target ) {

		// For updates, merge newData into currentData, in order to preserve custom data that was set during enter or beforeenter events
		newData = util.extend( target.currentData, newData );
		let handlerOptions = getDefaultOptions( newRoute );
		let eventOptions = { route: newData, from: null, to: null, options: handlerOptions };

		try {
			eventer.emit( events.UPDATE, eventOptions );

			let result = newRoute.update( newData, handlerOptions );
			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				// Update currentRoute *after* update resolves
				journey.updateCurrentRoute( target, newRoute, newData );

				eventer.emit( journey, events.UPDATED, eventOptions );

			} ).catch( err => {
				let options = gatherErrorOptions( events.UPDATE, newRoute, null, null, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = gatherErrorOptions( events.UPDATE, newRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.UPDATE + "] - " + err.message ); // let others handle further up the stack
		}
	},

	enter( newRoute, newData, target ) {
		
		let handlerOptions = getDefaultOptions( target.currentRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.ENTER, eventOptions );

			let result = newRoute.enter( newData, target.currentData, handlerOptions );

			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				eventer.emit( journey, events.ENTERED, eventOptions );

			} ).catch( err => {
				let options = gatherErrorOptions( events.ENTER, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = gatherErrorOptions( events.ENTER, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.ENTER + "] - " + err.message ); // let others handle further up the stack

		}
	},

	beforeenter( newRoute, newData, target ) {
		
		let handlerOptions = getDefaultOptions( target.currentRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.BEFORE_ENTER, eventOptions );

			let result = newRoute.beforeenter( newData, target.currentData, handlerOptions );

			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {

				eventer.emit( journey, events.BEFORE_ENTER_COMPLETE, eventOptions );

			} ).catch( err => {
				let options = gatherErrorOptions( events.BEFORE_ENTER, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = gatherErrorOptions( events.BEFORE_ENTER, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.BEFORE_ENTER + "] - " + err.message ); // let others handle further up the stack

		}
	},

	beforeleave( newRoute, newData, target ) {
		
		let handlerOptions = getDefaultOptions( target.currentRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.BEFORE_LEAVE, eventOptions );

			let result = target.currentRoute.beforeleave( target.currentData, newData, handlerOptions );
			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {

				eventer.emit( journey, events.BEFORE_LEAVE_COMPLETE, eventOptions );

			} ).catch( err => {
				let options = gatherErrorOptions( events.BEFORE_LEAVE, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = gatherErrorOptions( events.BEFORE_LEAVE, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.BEFORE_LEAVE + "] - " + err.message ); // let others handle further up the stack

		}
	},

	leave( newRoute, newData, target ) {

		let handlerOptions = getDefaultOptions( target.currentRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.LEAVE, eventOptions );

			let result = target.currentRoute.leave( target.currentData, newData, handlerOptions );
			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				// Update currentRoute *after* leave resolves
				journey.updateCurrentRoute( target, newRoute, newData );

				eventer.emit( journey, events.LEFT, eventOptions );

			} ).catch( err => {
				let options = gatherErrorOptions( events.LEAVE, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = gatherErrorOptions( events.LEAVE, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.LEAVE + "] - " + err.message ); // let others handle further up the stack

		}
	}
}


function processHandler( handlerName, start, end, route, to, from, err ) {
	let options = { };
	let args = [ newData, options ];

	try {

		// Ensure default target is passed to events, but don't override if already present
		options.target = config.target;
		options.startOptions = config; // TODO startOptions not needed
		options.hasHandler = handler != null;

		// For updates, merge newData into currentData, in order to preserve custom data that was set during enter or beforeenter events
		newData = util.extend( currentData, newData );

		eventer.raiseEvent( handlerName, args );

		let promise = route.update( newData );

		promise.then( function () {
			eventer.raiseEvent( events.UPDATED, args );

		} ).catch( err => {
			let options = gatherErrorOptions( 'update', route, null, null, err );
			eventer.raiseError( options );
		} );

		return promise;

	} catch ( err ) {
		let options = gatherErrorOptions( 'update', route, null, null, err );
		eventer.raiseError( options );
		return journey.Promise.reject( "error occurred in [" + 'update' + "] - " + err.message ); // let others handle further up the stack
	}
}

function getDefaultOptions( route ) {
	let options = { };
	// Ensure default target is passed to events, but don't override if already present
	options.target = config.target;
	options.startOptions = config; // TODO startOptions not needed
	//options.hasHandler = handler != null;
	options.hasHandler = route.hasHandler;
	return options;
}

function gatherErrorOptions( handlerName, route, to, from, err ) {
	var options = { error: err, event: handlerName, from: from, to: to, route: route };
	options.target = config.target;
	options.startOptions = config; // TODO needed?
	return options;
}

export default handler;