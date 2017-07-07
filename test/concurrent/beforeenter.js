/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'concurrent beforeenter', ( ) => {

	describe( 'enter()', () => {

		it( 'should receive correct route and next route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let barEnterPrevRoute, barEnterRoute, startCompleted = false;

				// Journey should not continue routing to foo, once we route to bar, so foo.enter() should not be called
				let fooEntered = false;

				journey.add( '/foo', {

					beforeenter() {
						return util.wait( 50 ).then( () => {
						} );
					},

					enter() {
						fooEntered = true;
					}
				} );

				journey.add( '/bar', {
					enter( route, prev ) {
						barEnterRoute = route.pathname;
						barEnterPrevRoute = prev.pathname;
					}
				} );

				journey.start().then( function () {
					startCompleted = true;
				} );

				util.wait( 10 ).then( function () {
					journey.goto( '/bar' )
							.then( function () {

								try {
									// We wait a bit for foo.beforeenter to complete, so we can check that foo.enter was not called because route changed to bar
									util.wait( 100 ).then( function () {
										assert.ok( ! fooEntered );
										assert.ok( startCompleted );
										assert.equal( barEnterRoute, 'bar' );
										assert.equal( barEnterPrevRoute, null );
										done();
									} );


								} catch ( e ) {
									done( e );
								}
							} );

				} );

			} );
		} ) );
	} );

	describe( 'leave()', () => {

		it( 'should receive correct route and prev route', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;
				let barLeaveNextRoute, barLeaveRoute, startCompleted = false;

				// Journey should not continue routing to foo, once we route to bar, so foo.leave() should not be called
				let fooLeft = false;

				journey.add( '/foo', {

					beforeenter() {
						return util.wait( 50 ).then( () => {
						} );
					},

					leave() {
						fooLeft = true;
					}
				} );

				journey.add( '/bar', {
					leave( route, next ) {
						barLeaveRoute = route.pathname;
						barLeaveNextRoute = next.pathname;
					}
				} );
				
				journey.add( '/baz', { });

				journey.start().then( function () {
					startCompleted = true;
				} );

				util.wait( 10 ).then( function () {
					
					journey.goto( '/bar' )					
							.then( util.goto('/baz'))
							.then( function () {
								
								try {
									// We wait a bit for foo.beforeenter to complete, so we can check that foo.enter was not called because route changed to bar
									util.wait( 100 ).then( function () {
										assert.ok( startCompleted );
										assert.ok( ! fooLeft );
										assert.equal( barLeaveRoute, 'bar' );
										assert.equal( barLeaveNextRoute, 'baz' );
										done();
									} );


								} catch ( e ) {
									done( e );
								}
							} );

				} );

			} );
		} ) );
	} );


} );