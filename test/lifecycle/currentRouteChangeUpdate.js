/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'journey.getCcurrentRoute', ( ) => {

	describe( 'after update()', () => {

		it( 'should return the same route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let updatePath, updatedPath, updateData, updatedData;

				journey.add( '/foo', {
					update() {
						// noop: need update method in order for update to be called
					}
				});

				journey.on( 'update', function ( event ) {
					updatePath = journey.getCurrentData().pathname;
					updateData = journey.getCurrentData();
				} );

				journey.on( 'updated', function ( event ) {
					updatedPath = journey.getCurrentData().pathname;
					updatedData = journey.getCurrentData();
				} );

				journey.start().then( function () {
					journey.goto( '/foo?a=1' )
							.then( function () {
								assert.equal( updatePath, 'foo' );
								assert.equal( updatedPath, 'foo' );
								assert.ok( updatedData === updateData );
								done( );
							} )
							.catch( function ( e ) {
								done( e );
							} );
				} );

			} );
		} ) );
	} );
} );