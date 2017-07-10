/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'on', ( ) => {

	describe( 'leave()', () => {

		it( 'should receive the correct arguments', ( function ( done ) {

			util.createTestEnvironment( '#foo' ).then( function ( window ) {

				const journey = window.journey;

				let leaveEvent, leftEvent, target = '#main';

				journey.add( '/foo' );
				journey.add( '/bar' );

				journey.start( { target: target } ).then( function () {

					addListeners();

					journey.goto( '/bar' )
							.then( function () {
								let to = leaveEvent.to.pathname;
								let from = leftEvent.from.pathname;
								assert.equal(from, 'foo');
								assert.equal(to, 'bar');
								assert.equal(leaveEvent.options.target, target);
								assert.equal(leftEvent.options.target, target);

								done( );
							} )
							.catch( function ( e ) {
								done( e );
							} );
				} );

				function addListeners() {
								
					journey.on( 'leave', function ( event ) {
						leaveEvent = event;
					} );

					journey.on( 'left', function ( event ) {
						leftEvent = event;
					} );

				}

			} );
		} ) );
	} );
} );