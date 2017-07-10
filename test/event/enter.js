/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'on', ( ) => {

	describe( 'enter()', () => {

		it( 'should receive the correct arguments', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let enterEvent, enteredEvent, target = '#main';

				journey.add( '/foo' );
				journey.add( '/bar' );

				journey.start( { target: target } ).then( function () {

					addListeners();

					journey.goto( '/bar' )
							.then( function () {
								let to = enterEvent.to.pathname;
								let from = enterEvent.from.pathname;
								assert.equal( from, 'foo' );
								assert.equal( to, 'bar' );

								assert.equal( enterEvent.options.target, target );
								assert.equal( enteredEvent.options.target, target );

								done( );
							} )
							.catch( function ( e ) {
								done( e );
							} );
				} );

				function addListeners() {

					journey.on( 'enter', function ( event ) {
						enterEvent = event;
					} );

					journey.on( 'entered', function ( event ) {
						enteredEvent = event;
					} );

				}

			} );
		} ) );
	} );
} );