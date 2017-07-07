/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'synchronous', ( ) => {

	describe( 'leave()', () => {

		it( 'should receive correct route and next route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let nextRoute, currRoute;

				journey.add( '/foo', {
				} );

				journey.add( '/bar', {

					leave( route, next ) {
						currRoute = route.pathname;
						nextRoute = next.pathname;
					}
				} );

				journey.start()
						.then( util.goto( '/bar' ) ) // enter here
						.then( util.goto( '/foo' ) ) // and afterwards enter here
						.then( function () {
							try {
								assert.equal( currRoute, 'bar' );
								assert.equal( nextRoute, 'foo' );

								done();

							} catch ( e ) {
								done( e );
							}
						} );
			} );
		} ) );
	} );
} );