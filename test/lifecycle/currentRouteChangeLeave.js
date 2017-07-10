/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'current route', ( ) => {

	describe( 'after leave()', () => {

		it( 'should return the new route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let leavePath, leftPath;

				journey.add( '/foo' );

				journey.add( '/bar' );

				journey.on( 'leave', function () {
					leavePath = journey.getCurrentRoute().path;
				} );

				journey.on( 'left', function () {
					leftPath = journey.getCurrentRoute().path;
				} );

				journey.start().then( function () {
					journey.goto( '/bar' )
							.then( function () {
								assert.equal( leavePath, 'foo' );
								assert.equal( leftPath, 'bar' );
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