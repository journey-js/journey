/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'redirect', ( ) => {

	describe( 'enter()', ( ) => {

		it( 'should receive correct route and prev route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let barPrevRoute, barRoute, bazRoute, bazPrevRoute;
				journey.add( '/foo', {

					enter( route, prevRoute ) {

						// redirect to bar
						journey.goto( 'bar' );
						//return util.wait( 50 );
					}
				} );
				journey.add( '/bar', {

					enter( route, prev ) {
						barRoute = route.pathname;
						barPrevRoute = prev.pathname;
						journey.goto( 'baz' );
					}
				} );
				journey.add( '/baz', {

					enter( route, prev ) {
						bazRoute = route.pathname;
						bazPrevRoute = prev.pathname;
					}
				} );
				journey.start( )
						.then( function ( ) {
							try {
								assert.equal( barRoute, 'bar' );
								assert.equal( barPrevRoute, 'foo' );
								assert.equal( bazRoute, 'baz' );
								assert.equal( bazPrevRoute, 'bar' );
								done( );
							} catch ( e ) {
								done( e );
							}
						} );
			} );
		} ) );
	} );
} );