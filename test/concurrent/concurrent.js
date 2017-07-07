/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'concurrent', ( ) => {

	describe( 'enter()', () => {

		it( 'should receive correct route and next route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let barEnterPrevRoute, barEnterRoute;

				// Journey should not continue routing to foo, once we route to bar, so foo.enter() should be called
				let fooEntered = false;

				journey.add( '/foo', {
					enter() {
						fooEntered = true;
						console.log( "----------- enter.foo() " );
					}
				} );

				journey.add( '/bar', {
					enter( route, prev ) {
						console.log( "----------- bar.enter() " );
						barEnterRoute = route.pathname;
						barEnterPrevRoute = prev.pathname;
					}
				} );

				journey.start()
				journey.goto( '/bar' )
						.then( function () {

							try {
								assert.ok( ! fooEntered );
								assert.equal( barEnterRoute, 'bar' );
								assert.equal( barEnterPrevRoute, null );

								done();

							} catch ( e ) {
								done( e );
							}
						} );
			} );
		} ) );
	} );


	describe( 'leave()', () => {

		it( 'should receive correct route and next route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let barLeaveNextRoute, barLeaveRoute;

				// Journey should not continue routing to foo, once we route to bar, so bar.leave() should be called
				let fooLeft = false;

				journey.add( '/foo', {

					leave( route, next ) {
						fooLeft = true;
						console.log( "---------------------------- foo.leave()" );
					}
				} );

				journey.add( '/bar', {

					leave( route, next ) {
						barLeaveRoute = route.pathname;
						barLeaveNextRoute = next.pathname;
						console.log( "---------------------------- bar.leave()" );
					}
				} );

				journey.start()
				journey.goto( '/bar' )
						.then( util.goto( '/foo' ) )
						.then( function () {

							try {
								assert.ok( ! fooLeft );
								assert.equal( barLeaveRoute, 'bar' );
								assert.equal( barLeaveNextRoute, 'foo' );

								done();

							} catch ( e ) {
								done( e );
							}
						} );
			} );
		} ) );
	} );

} );