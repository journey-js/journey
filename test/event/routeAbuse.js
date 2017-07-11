/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );
const util = require( '../util' );

require( 'console-group' ).install();

describe( 'navigating between routes before they complete', ( ) => {

	it( 'should raise routeAbuseStart and routeAbuseStop events', ( ) => {
		return util.createTestEnvironment( '/#foo' ).then( window => {
			const journey = window.journey;

			let routeAbuseStart = false;
			let routeAbuseStop = false;

			// in journey.start() we set abuseTimeout to 0ms, so wait a little longer than that so routeAbuseStop  is called and we can test.
			let timeToWaitForAbuseToStop = 100;

			journey.on( 'routeAbuseStart', function () {
				routeAbuseStart = true;
			} );

			journey.on( 'routeAbuseStop', function () {
				routeAbuseStop = true;
			} );

			journey.add( '/foo', {
				enter( ) {
					journey.goto( '/bar' );
				}
			} );

			journey.add( '/bar', {
				enter( ) {
				}
			} );

			return journey.start( { abuseTimeout: 0 } ).then( ( ) => {
				return util.wait( timeToWaitForAbuseToStop ).then( () => {
					assert.ok( routeAbuseStart );
					assert.ok( routeAbuseStop );
					window.close( );
				} );
			} );
		} );
	} );

	it( 'ensures default abuseTimeout is 1000ms', ( ) => {
		return util.createTestEnvironment( '/#foo' ).then( window => {
			const journey = window.journey;

			let routeAbuseStart = false;
			let routeAbuseStop = false;

			// The sdefault abuse time is 1000ms, so we run a test in 900 ms to test that routeAbuseStop has not been called yet
			let timeToWaitForAbuseToStop = 900;

			journey.on( 'routeAbuseStart', function () {
				routeAbuseStart = true;
			} );

			journey.on( 'routeAbuseStop', function () {
				routeAbuseStop = true;
			} );

			journey.add( '/foo', {
				enter( ) {
					journey.goto( '/bar' );
				}
			} );

			journey.add( '/bar', {
				enter( ) {

				}
			} );

			return journey.start( ).then( ( ) => {

				return util.wait( timeToWaitForAbuseToStop ).then( () => {
					assert.ok( routeAbuseStart === true ); // routeAbuseStart have run
					assert.ok( routeAbuseStop === false ); // routeAbuseStop should not run because its still waiting for it's timeout at this stage
					window.close( );
				} );
			} );
		} );
	} );

	it( 'ensures abuseTimeout works', ( ) => {
		return util.createTestEnvironment( '/#foo' ).then( window => {
			const journey = window.journey;

			let routeAbuseStart = false;
			let routeAbuseStop = false;

			// in journey.start() we set abuseTimeout to 0ms, so we need to wait a little longer than that to ensure routeAbuseStop is called
			let timeToWaitForAbuseToStop = 100;

			journey.on( 'routeAbuseStart', function () {
				routeAbuseStart = true;
			} );

			journey.on( 'routeAbuseStop', function () {
				routeAbuseStop = true;
			} );

			journey.add( '/foo', {
				enter( ) {
					journey.goto( '/bar' );
				}
			} );

			journey.add( '/bar', {
				enter( ) {

				}
			} );

			return journey.start( { abuseTimeout: 0 } ).then( ( ) => {

				return util.wait( timeToWaitForAbuseToStop ).then( () => {
					assert.ok( routeAbuseStart === true );
					assert.ok( routeAbuseStop === true );
					window.close( );
				} );
			} );
		} );
	} );
} );