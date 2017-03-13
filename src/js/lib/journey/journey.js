define( function ( require ) {
	var roadtrip = require( "roadtrip" );
	var Ractive = require( "ractive" );
	var EventEmitter = require( "./EventEmitter" );
	var utils = require( "./util/utils" );
	var mode = require( "./util/mode" );

	var callstack = [ ];

	var initOptions = {
		target: null,
		routes: null,
		defaultRoute: null,
		unknownRouteResolver: null,
		debug: true
	};

	var Promise = window.Promise;

	var journey = new EventEmitter();

	var origEmit = journey.emit;

	journey.add = function add( path, options ) {
		roadtrip.add( path, options );

		wrap( options );

		return journey;
	};

	journey.start = function( options ) {

		initOptions = utils.extend( { }, initOptions, options );

		mode.DEBUG = Ractive.DEBUG = initOptions.debug;

		roadtrip.start( options );
	};

	journey.goto = function goto( href, options ) {
		var promise = roadtrip.goto( href, options );
		return promise;
	};


	journey.emit = function ( that, evt ) {
		if ( typeof that === 'string' ) {
			var args = Array.prototype.slice.call( arguments );
			args.unshift( this );
			return origEmit.apply( this, args );
		}
		origEmit.apply( this, arguments );
		//(options.view, prefix + eventName, triggerOptions);
	};

	function raiseEvent( eventName, options ) {
		utils.logError( options.error );
		journey.emit( journey, eventName, options );
	}
	
	function wrap( options ) {
		addErrorHandling( "enter", options );
		addErrorHandling( "beforeenter", options );
		addErrorHandling( "leave", options );

		/*
		 Promise.all([
		 currentRoute.leave( currentData, data ),
		 newRoute.beforeenter( data, currentData )
		 ])
		 .then( function () { return newRoute.enter( data, currentData ); } )
		 .then( function () {
		 
		 }).catch(function(e) {
		 
		 });*/
	}
	;

	function wrapHandlerWithTrashingSupport( options ) {

		/*
		 
		 options.leave = function ( route, nextRoute ) {
		 var that = this;
		 var origArguments = arguments;
		 var promise = new Promise( function ( resolve, reject ) {
		 
		 // TODO playing with overwrite. Currently trying to simulate 2 different errors, one overwrite which should enter, 
		 // the other a ligit error which should not enter
		 var origPromise = origLeave.apply( that, origArguments );
		 
		 origPromise = Promise.all([origPromise]); // Ensure origLeave can be handled as promise
		 
		 origPromise.then( function () {
		 
		 var random = Math.random() >= 0.5;
		 if ( random ) {
		 resolve.apply( this, arguments );
		 
		 } else {
		 if ( Ractive.defaults.transitionsEnabled ) {
		 Ractive.defaults.transitionsEnabled = false;
		 reject( "overwritten" );
		 console.log( "randomly overwritten, and we are Rasing" );
		 
		 reenableAnimationsAfterDelay();
		 } else {
		 console.log( "randomly overwritten, but we are Skipping" );
		 resolve.apply( this, arguments );
		 }
		 }
		 
		 } ).catch( function ( e ) {
		 console.log( "journey caught reject", e );
		 reject( e );
		 } );
		 } );
		 return promise;
		 };*/

		options.leave._wrapped = true;
	}
	;

	function addErrorHandling( name, options ) {
		var handler = options[name];
		if ( handler == null || handler._wrapped ) {
			return;
		}

		var wrapper = function ( ) {
			var that = this;
			var origArguments = arguments;

			// Handle errors thrown by handler: enter, leave or beforeenter
			try {
				var result = handler.apply( that, origArguments );
				return result;

			} catch ( e ) {
				utils.log( "JA journey got this one: " + name );
				var options = { error: e, handler: name };
				raiseEvent( "onerror", options );
				return Promise.reject( "error occurred in [" + name + "] - " + e.message ); // let others handle further up the stack
			}
		};

		options[name] = wrapper;

		handler._wrapped = true;
	}

	function disableAnimations() {
		Ractive.defaults.transitionsEnabled = false;

	}
	;

	function reenableAnimationsAfterDelay() {//reenableAnimationTracker) {
		// We wait a bit before enabling animations in case user is still thrashing UI.
		setTimeout( function () {
			Ractive.defaults.transitionsEnabled = true;
			utils.log( "Renabling animations" );
		}, 10350 );
	}

	return journey;

} );