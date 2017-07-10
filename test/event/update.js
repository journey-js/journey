/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'on', () => {

	describe( 'update()', () => {

		it( 'should receive the correct arguments', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let updateEvent, updatedEvent, target = '#main';

				journey.add( '/foo',
						{
							update( route, options ) {}
						}
				);

				journey.start( { target: target } ).then( function () {

					addListeners();

					journey.goto( '/foo?a=1' )
							.then( function () {

								assert.equal( updateEvent.route.pathname, 'foo' );
								assert.equal( updatedEvent.route.pathname, 'foo' );
								assert.equal( updateEvent.options.target, target );
								assert.equal( updatedEvent.options.target, target );

								done();
							} )
							.catch( function ( e ) {
								done( e );
							} );
				} );

				function addListeners() {

					journey.on( 'update', function ( event ) {
						updateEvent = event;
					} );

					journey.on( 'updated', function ( event ) {
						updatedEvent = event;
					} );

				}

			} );
		} ) );
	} );
} );