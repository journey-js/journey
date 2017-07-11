/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'on', ( ) => {

	describe( 'navigating between routes before they complete', ( ) => {

		it.only( 'should raise the transitionAborted event', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let transitionAbortedEvent, target = '#main';

				journey.add( '/foo' );
				journey.add( '/bar' );
				journey.add( '/baz' );

				addListeners();

				journey.start( { target: target } ).then( function () {

					journey.goto( '/bar' );
					journey.goto( '/baz' )
							.then( function () {

								assert.ok(transitionAbortedEvent != null);
								let to = transitionAbortedEvent.to.pathname;
								let from = transitionAbortedEvent.from.pathname;
								assert.equal( from, 'foo' );
								assert.equal( to, 'bar' );
								
								assert.equal( transitionAbortedEvent.options.target, target );

								done( );
							} )
							.catch( function ( e ) {
								done( e );
							} );
				} );

				function addListeners() {

					journey.on( 'transitionAborted', function ( event ) {
						transitionAbortedEvent = event;
					} );

				}

			} );
		} ) );
	} );
} );