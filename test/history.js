/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );

require( 'console-group' ).install();

const journeysrc = fs.readFileSync( path.resolve( __dirname, '../dist/journey.js' ), 'utf-8' );
//const simulantSrc = fs.readFileSync( require.resolve( 'simulant' ), 'utf-8' );

let global;

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
						global = window;
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

		it( 'journey start( { onHashChange: true } ), wont be able to store scroll positions when navigating between routes', () => {
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

				let options = {
					useOnHashChange: true
				};

				return journey.start( options ).then( goto( 'foo' ) )
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

	describe( 'test journey.start( { useHash: true } )', () => {

		it( 'ensure hash is appended to route', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				let hashAppended = false;

				return journey
						.add( '/', {
							enter() {
								let href = window.location.href;
								hashAppended = href[href.length - 1] === '#';
							}
						} )
						.start( { useHash: true } ).then( () => {
					assert.ok( hashAppended );
					window.close();
				} );

			} );
		} );

		it( 'ensure hash history works', () => {
			return createTestEnvironment( ).then( window => {

				const journey = window.journey;
				const routes = [ ];

				journey
						.add( '/', {
							enter: ( ) => {
								routes.push( 'root' );

								let href = window.location.href;
								assert.ok( href.endsWith( "#" ) );
							}
						} )

						.add( '/foo', {
							enter: ( ) => {
								let href = window.location.href;
								assert.ok( href.endsWith( "#foo" ) );
								routes.push( 'foo' );
							}
						} );

				return journey.start( { useHash: true } ).then( goto( 'foo' ) )
						.then( back )    // root
						.then( forward )    // foo

						.then( () => {
							assert.deepEqual( routes, [ 'root', 'foo', 'root', 'foo' ] );
							window.close();
						} );
			} );
		} );
	} );

	describe( 'test journey.start( useHash: true, useOnHashChange: true )', ( ) => {

		it( 'ensure hash is appended to route', ( ) => {
			return createTestEnvironment( ).then( window => {
				const journey = window.journey;
				let hashAppended = false;
				return journey
						.add( '/', {
							enter( ) {
								let href = window.location.href;
								hashAppended = href[href.length - 1] === '#';
							}
						} )
						.start( { useHash: true, useOnHashChange: true } ).then( ( ) => {
					assert.ok( hashAppended );
					window.close( );
				} );
			} );
		} );

		it( 'ensure hash history works', () => {
			return createTestEnvironment( ).then( window => {

				const journey = window.journey;
				const routes = [ ];

				journey
						.add( '/', {
							enter: ( ) => {
								routes.push( 'root' );

								let href = window.location.href;
								assert.ok( href.endsWith( "#" ) );
							}
						} )

						.add( '/foo', {
							enter: ( ) => {
								let href = window.location.href;
								assert.ok( href.endsWith( "#foo" ) );
								routes.push( 'foo' );
							}
						} );

				return journey.start( { useHash: true, useOnHashChange: true } ).then( goto( 'foo' ) )
						.then( back )    // root
						.then( forward )    // foo

						.then( () => {
							assert.deepEqual( routes, [ 'root', 'foo', 'root', 'foo' ] );
							window.close();
						} );
			} );
		} );
	} );

	describe( 'misc tests', ( ) => {
		it( 'ensure routes with prefix "/#" is supported eg. "/#home"', ( ) => {
			return createTestEnvironment( '/#foo' ).then( window => {
				const journey = window.journey;
				let fooEntered = false;
				return journey
						.add( '/foo', {
							enter( ) {
								fooEntered = true;
							}
						} )
						.start().then( ( ) => {
					assert.ok( fooEntered );
					window.close( );
				} );
			} );
		} );
		
		it( 'ensure goto "/#" routes work eg. goto(/#foo) - useHash: true"', ( ) => {
			return createTestEnvironment( ).then( window => {
				const journey = window.journey;
				let fooEntered = false;
				return journey
						.add( '/foo', {
							enter( ) {
								fooEntered = true;
							}
						} )
						.start( { useHash: true } ).then( goto("/#foo") )
						.then( () => {
					assert.ok( fooEntered );
					window.close( );
				} );
			} );
		} );

		it( 'ensure goto "/#" routes work eg goto(/#foo) - useHash: false "', ( ) => {
			return createTestEnvironment( ).then( window => {
				const journey = window.journey;
				let fooEntered = false;
				return journey
						.add( '/foo', {
							enter( ) {
								fooEntered = true;
							}
						} )
						.start( { useHash: false } ).then( goto("/#foo") )
						.then( () => {
					assert.ok( fooEntered );
					window.close( );
				} );
			} );
		} );

	} );
} );


function goto( href ) {
	return () => {
		return global.journey.goto( href );
	};
}

function back() {
	global.history.back();
	return wait();
}

function forward() {
	global.history.forward();
	return wait();
}

function wait( ms ) {
	return new Promise( fulfil => setTimeout( fulfil, ms || 50 ) );
}