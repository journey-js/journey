/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'synchronous', ( ) => {

	describe( 'enter()', () => {

		it( 'should receive correct route and next route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let fooPrevRoute, fooCurrRoute, barCurrRoute, barPrevRoute;

				journey.add( '/foo', {
					enter( route, prev ) {
						fooCurrRoute = route.pathname;
						fooPrevRoute = prev.pathname;
					}
				} );

				journey.add( '/bar', {
					enter( route, prev ) {
						barCurrRoute = route.pathname;
						barPrevRoute = prev.pathname;
					}
				} );

				journey.start() // start at foo
						.then( util.goto( '/bar' ) )
						.then( util.goto( '/baz' ) )
						.then( function () {
							try {
								assert.equal( fooCurrRoute, 'foo' );
								assert.equal( fooPrevRoute, null );
								assert.equal( barCurrRoute, 'bar' );
								assert.equal( barPrevRoute, 'foo' );

								done();

							} catch ( e ) {
								done( e );
							}
						} );
			} );
		} ) );
	} );
} );