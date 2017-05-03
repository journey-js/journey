/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );

require( 'console-group' ).install();

const journeysrc = fs.readFileSync( path.resolve( __dirname, '../dist/journey.js' ), 'utf-8' );
//const simulantSrc = fs.readFileSync( require.resolve( 'simulant' ), 'utf-8' );

describe( 'history', () => {
	function createTestEnvironment( initial ) {
		return new Promise( ( fulfil, reject ) => {

			jsdom.env( {
				html: '',
				url: 'http://journey.com' + ( initial || '' ),
				src: [ journeysrc ],
				done( err, window ) {
					if ( err ) {
						reject( err );
					} else {
						window.Promise = window.journey.Promise = Promise;
						window.console = console;
						fulfil( window );
					}
				}
			} );
		} );
	}

	describe( 'history scroll location', () => {

		it( 'store scroll positions ahen navigating between routes', () => {
			return createTestEnvironment( "/" ).then( window => {

				const journey = window.journey;
				const routes = [ ];
				const scrollPos = {
					root: [ ],
					foo: [ ]
				};

				journey
						.add( '/', {
							enter: ( route, prevRoute ) => {
								routes.push( 'root' );

								// JSDom doesn't render the DOM so impossible to set the window height to enforce scroll position beyond 0.
								// Instead we simply set the scroll manualy.
								// Journey should pick up the scroll positions when navigating to next route.
								window.scrollX = 100;
								window.scrollY = 200;

								var pos = { x: route.scrollX, y: route.scrollY };
								scrollPos.root.push( pos );
							}
						} )

						.add( '/foo', {
							enter: ( route, prevRoute ) => {
								routes.push( 'foo' );

								window.scrollX = 50;
								window.scrollY = 150;

								var pos = { x: route.scrollX, y: route.scrollY };
								scrollPos.foo.push( pos );
							},

							leave: ( route, prevRoute ) => {

								// During leave. the the scroll positions should already have been set
								var pos = { x: route.scrollX, y: route.scrollY };
								scrollPos.foo.push( pos );
							}
						} );

				function goto( href ) {
					return () => {
						return journey.goto( href );
					};
				}

				function back() {
					window.history.back();
					return wait();
				}

				function forward() {
					window.history.forward();
					return wait();
				}

				return journey.start().then( goto( 'foo' ) )
						.then( back )    // root
						.then( forward )    // foo

						.then( () => {
							assert.deepEqual( scrollPos.root, [ { x: 0, y: 0 }, { x: 100, y: 200 } ] );
							assert.deepEqual( scrollPos.foo, [ { x: 0, y: 0 }, { x: 50, y: 150 }, { x: 50, y: 150 } ] );
							assert.deepEqual( routes, [ 'root', 'foo', 'root', 'foo' ] );
							window.close();
						} );
			} );
		} );

		it( 'journey start() option, onHashChange, wont be able to store scroll positions when navigating between routes', () => {
			return createTestEnvironment( "/" ).then( window => {

				const journey = window.journey;
				const routes = [ ];
				const scrollPos = {
					root: [ ],
					foo: [ ]
				};

				journey
						.add( '/', {
							enter: ( route, prevRoute ) => {
								routes.push( 'root' );

								window.scrollX = 100;
								window.scrollY = 200;

								var pos = { x: route.scrollX, y: route.scrollY };
								scrollPos.root.push( pos );
							}
						} )

						.add( '/foo', {
							enter: ( route, prevRoute ) => {
								routes.push( 'foo' );

								window.scrollX = 1;
								window.scrollY = 2;

								var pos = { x: route.scrollX, y: route.scrollY };
								scrollPos.foo.push( pos );
							}
						} );

				function goto( href ) {
					return () => {
						return journey.goto( href );
					};
				}

				function back() {
					window.history.back();
					return wait();
				}

				function forward() {
					window.history.forward();
					return wait();
				}
				
				let options = {
					useOnHashChange: true
				};

				return journey.start(options).then( goto( 'foo' ) )
						.then( back )    // root
						.then( forward )    // foo

						.then( () => {
							assert.deepEqual( scrollPos.root, [ { x: 0, y: 0 }, { x: 0, y: 0 } ] );
							assert.deepEqual( scrollPos.foo, [ { x: 0, y: 0 }, { x: 0, y: 0 } ] );
							assert.deepEqual( routes, [ 'root', 'foo', 'root', 'foo' ] );
							window.close();
						} );
			} );
		} );
	} );
	
	describe( 'journey.start( useHash: true )', () => {
		it( 'navigates to the current route', done => {
			createTestEnvironment().then( window => {
				const journey = window.journey;

				journey
						.add( '/', {
							enter() {
								assert.ok( true );
								done();
							}
						} )
						.start({useHash: true});

				window.close();
			} );
		} );
	});

	describe( 'journey.start( useHash: true, useOnHashChange: true )', () => {
		it( 'navigates to the current route', done => {
			createTestEnvironment().then( window => {
				const journey = window.journey;

				journey
						.add( '/', {
							enter() {
								assert.ok( true );
								done();
							}
						} )
						.start( {
							useHash: true,
							useOnHashChange: true
						} );

				window.close();
			} );
		} );
	});

} );

function wait( ms ) {
	return new Promise( fulfil => setTimeout( fulfil, ms || 50 ) );
}