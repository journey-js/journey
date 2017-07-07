/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( './util' );

require( 'console-group' ).install();

describe( 'current route', ( ) => {

	describe( 'after leave()', () => {

		it( 'should return the new route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let leavePath, leftPath;

				journey.add( '/foo', {
					
					leave() {
						leavePath = journey.getCurrentRoute().path;						
					}
				} );

				journey.add( '/bar', {
				} );

				journey.start().then( function () {
					journey.goto( '/bar' )
							.then( function () {
								leftPath = journey.getCurrentRoute().path;
								assert.equal( leavePath, 'foo' );
								assert.equal( leftPath, 'bar' );
								done( );
							} )
							.catch( function ( e) {
								done('currentRoute did not update after leave');
							} );
				} );

			} );
		} ) );
	} );
} );