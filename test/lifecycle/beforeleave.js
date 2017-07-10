/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'lifecycle', ( ) => {

	describe( 'beforeleave()', () => {

		it( 'should stop transition if returned promise is rejected', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				// foo.beforeenter() is rejected so neither foo.leave() nor bar.enter() should be called
				let fooEntered = false;
				let fooLeft = false;
				let barEntered = false;
				let fooBeforeLeave = false;

				journey.add( '/foo', {

					beforeleave() {
						fooBeforeLeave = true;
						return Promise.reject( "beforeLeave rejected" );
					},

					enter() {
						fooEntered = true;
					},

					leave() {
						fooLeft = true;
					}
				} );

				journey.add( '/bar', {
					enter( route, prev ) {
						barEntered = true;
					}
				} );

				journey.start().then( function () {
					journey.goto( '/bar' )
							.then( function () {
								done( 'beforeEnter should reject the route from proceeding' );

							} )
							.catch( function ( ) {
								assert.ok( fooBeforeLeave );
								assert.ok( fooEntered );
								assert.ok( ! fooLeft );
								assert.ok( ! barEntered );
								done();
							} );
				} );

			} );
		} ) );
	} );
} );