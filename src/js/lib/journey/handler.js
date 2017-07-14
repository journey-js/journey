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
		let handlerOptions = handler.getDefaultOptions( newRoute );
		let eventOptions = { route: newData, from: null, to: null, options: handlerOptions };

		try {
			eventer.emit( events.UPDATE, eventOptions );

			let result = newRoute.update( newData, handlerOptions );

			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				// Update currentRoute *after* update resolves
				journey._updateCurrentRoute( target, newRoute, newData );

				eventer.emit( journey, events.UPDATED, eventOptions );

			} ).catch( err => {
				let options = handler.gatherErrorOptions( events.UPDATE, newRoute, null, null, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = handler.gatherErrorOptions( events.UPDATE, newRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.UPDATE + "] - " + err.message ); // let others handle further up the stack
		}
	},

	enter( newRoute, newData, target ) {
		
		let handlerOptions = handler.getDefaultOptions( newRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.ENTER, eventOptions );

			let result = newRoute.enter( newData, target.currentData, handlerOptions );

			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				eventer.emit( journey, events.ENTERED, eventOptions );

			} ).catch( err => {
				let options = handler.gatherErrorOptions( events.ENTER, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = handler.gatherErrorOptions( events.ENTER, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.ENTER + "] - " + err.message ); // let others handle further up the stack

		}
	},

	beforeenter( newRoute, newData, target ) {
		
		let handlerOptions = handler.getDefaultOptions( newRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.BEFORE_ENTER, eventOptions );

			let result = newRoute.beforeenter( newData, target.currentData, handlerOptions );

			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {

				eventer.emit( journey, events.BEFORE_ENTER_COMPLETE, eventOptions );

			} ).catch( err => {
				let options = handler.gatherErrorOptions( events.BEFORE_ENTER, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = handler.gatherErrorOptions( events.BEFORE_ENTER, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.BEFORE_ENTER + "] - " + err.message ); // let others handle further up the stack
		}
	},

	beforeleave( newRoute, newData, target ) {

		let handlerOptions = handler.getDefaultOptions( target.currentRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.BEFORE_LEAVE, eventOptions );

			let result = target.currentRoute.beforeleave( target.currentData, newData, handlerOptions );

			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {

				eventer.emit( journey, events.BEFORE_LEAVE_COMPLETE, eventOptions );

			} ).catch( err => {
				let options = handler.gatherErrorOptions( events.BEFORE_LEAVE, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = handler.gatherErrorOptions( events.BEFORE_LEAVE, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.BEFORE_LEAVE + "] - " + err.message ); // let others handle further up the stack

		}
	},

	leave( newRoute, newData, target ) {

		let handlerOptions = handler.getDefaultOptions( target.currentRoute );
		let eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.LEAVE, eventOptions );

			let result = target.currentRoute.leave( target.currentData, newData, handlerOptions );
			let promise = journey.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				// Update currentRoute *after* leave resolves
				journey._updateCurrentRoute( target, newRoute, newData );

				eventer.emit( journey, events.LEFT, eventOptions );

			} ).catch( err => {
				let options = handler.gatherErrorOptions( events.LEAVE, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			let options = handler.gatherErrorOptions( events.LEAVE, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey.Promise.reject( "error occurred in [" + events.LEAVE + "] - " + err.message ); // let others handle further up the stack

		}
	}
};

handler.getDefaultOptions = function( route ) {
	let options = { };
	options.target = config.target;
	return options;
};

handler.gatherErrorOptions = function( handlerName, route, to, from, err ) {

	var errorOptions = { error: err, event: handlerName, from: from, to: to, route: route };

	let options = handler.getDefaultOptions( route );

	errorOptions.options = options;
	return errorOptions;
};

export default handler;