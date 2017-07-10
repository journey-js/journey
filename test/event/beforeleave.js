/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'on', ( ) => {

	describe( 'beforeleave()', () => {

		it( 'should receive the correct arguments', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let beforeleaveEvent, beforeleaveCompleteEvent, target = '#main';

				journey.add( '/foo' );
				journey.add( '/bar' );

				journey.start( { target: target } ).then( function () {

					addListeners();

					journey.goto( '/bar' )
							.then( function () {
								let to = beforeleaveEvent.to.pathname;
								let from = beforeleaveCompleteEvent.from.pathname;
								assert.equal( from, 'foo' );
								assert.equal( to, 'bar' );
								assert.equal( beforeleaveEvent.options.target, target );
								assert.equal( beforeleaveCompleteEvent.options.target, target );

								done( );
							} )
							.catch( function ( e ) {
								done( e );
							} );
				} );

				function addListeners() {

					journey.on( 'beforeleave', function ( event ) {
						beforeleaveEvent = event;
					} );

					journey.on( 'beforeleaveComplete', function ( event ) {
						beforeleaveCompleteEvent = event;
					} );

				}

			} );
		} ) );
	} );
} );