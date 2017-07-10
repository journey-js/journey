/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'on', ( ) => {

	describe( 'beforeenter()', () => {

		it( 'should receive the correct arguments', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let beforeenterEvent, beforeenterCompleteEvent, target = '#main';

				journey.add( '/foo' );
				journey.add( '/bar' );

				journey.start( { target: target } ).then( function () {

					addListeners();

					journey.goto( '/bar' )
							.then( function () {
								let to = beforeenterEvent.to.pathname;
								let from = beforeenterCompleteEvent.from.pathname;
								assert.equal( from, 'foo' );
								assert.equal( to, 'bar' );
								assert.equal( beforeenterEvent.options.target, target );
								assert.equal( beforeenterCompleteEvent.options.target, target );

								done( );
							} )
							.catch( function ( e ) {
								done( e );
							} );
				} );

				function addListeners() {

					journey.on( 'beforeenter', function ( event ) {
						beforeenterEvent = event;
					} );

					journey.on( 'beforeenterComplete', function ( event ) {
						beforeenterCompleteEvent = event;
					} );

				}

			} );
		} ) );
	} );
} );