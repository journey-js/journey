/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'redirect', ( ) => {

	describe( 'leave()', ( ) => {

		it( 'should receive correct route and next route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let fooNextRoute, fooRoute, barRoute, barNextRoute;
				journey.add( '/foo', {

					enter( route, prevRoute ) {

						// redirect to bar
						journey.goto( 'bar' );
					},

					leave( route, next ) {
						fooRoute = route.pathname;
						fooNextRoute = next.pathname;
					}
				} );
				journey.add( '/bar', {

					enter( ) {
						journey.goto( '/baz' );
					},
					leave( route, next ) {
						barRoute = route.pathname;
						barNextRoute = next.pathname;
					}
				} );
				journey.add( '/baz', {
				} );
				journey.start( )
						.then( util.goto( '/baz' ) )
						.then( function ( ) {
							try {
								assert.equal( fooRoute, 'foo' );
								assert.equal( fooNextRoute, 'bar' );
								assert.equal( barRoute, 'bar' );
								assert.equal( barNextRoute, 'baz' );
								done( );
							} catch ( e ) {
								done( e );
							}
						} );
			} );
		}
		) );
	} );
} );