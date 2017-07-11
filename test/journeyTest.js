/*global require, describe, it, __dirname */
const assert = require( 'assert' );
const util = require('./util');

require( 'console-group' ).install();

describe( 'journey', () => {

	describe( 'history scroll location', () => {

		it( 'store scroll positions when navigating between routes', () => {
			return util.createTestEnvironment( "/" ).then( window => {

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
						
						console.log("-----------------------", util)

				return journey.start()
						.then( util.goto( 'foo' ) )
						.then( util.back )    // root
						.then( util.forward )    // foo

						.then( () => {
							assert.deepEqual( scrollPos.root, [ { x: 0, y: 0 }, { x: 100, y: 200 } ] );
							assert.deepEqual( scrollPos.foo, [ { x: 0, y: 0 }, { x: 50, y: 150 }, { x: 50, y: 150 } ] );
							assert.deepEqual( routes, [ 'root', 'foo', 'root', 'foo' ] );
							window.close();
						} );
			} );
		} );

		it( 'journey start( { onHashChange: true } ), wont be able to store scroll positions when navigating between routes', () => {
			return util.createTestEnvironment( "/" ).then( window => {

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

				return journey.start( options )
						.then( util.goto( 'foo' ) )
						.then( util.back )    // root
						.then( util.forward )    // foo

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
			return util.createTestEnvironment().then( window => {
				const journey = window.journey;

				return journey
						.add( '/', {
						} )
						.start( { useHash: true } ).then( () => {

						let href = window.location.href;
						let hashAppended = href[href.length - 1] === '#';
					assert.ok( hashAppended );
					window.close();
				} );

			} );
		} );

		it( 'ensure hash history works', () => {
			return util.createTestEnvironment( ).then( window => {

				const journey = window.journey;
				const routes = [ ];

				journey
						.add( '/', {
							enter: ( ) => {
								routes.push( 'root' );
							}
						} )

						.add( '/foo', {
							enter: ( ) => {
								routes.push( 'foo' );
							}
						} );

				return journey.start( { useHash: true } )
						.then( function() {

							let href = window.location.href;
					assert.ok( href.endsWith( "#" ) );

							return util.goto( 'foo' )();
						})
						.then( util.back )    // root
						.then( util.forward )    // foo

						.then( () => {
							assert.deepEqual( routes, [ 'root', 'foo', 'root', 'foo' ] );

							let href = window.location.href;
							assert.ok( href.endsWith( "#foo" ) );

							window.close();
						} );
			} );
		} );
	} );

	describe( 'test journey.start( useHash: true, useOnHashChange: true )', ( ) => {

		it( 'ensure hash is appended to route', ( ) => {
			return util.createTestEnvironment( ).then( window => {
				const journey = window.journey;
				let hashAppended = false;
				return journey
						.add( '/', {
							enter( ) {
							}
						} )
						.start( { useHash: true, useOnHashChange: true } ).then( ( ) => {
					let href = window.location.href;
					hashAppended = href[href.length - 1] === '#';
							
					assert.ok( hashAppended );
					window.close( );
				} );
			} );
		} );

		it( 'ensure hash history works', () => {
			return util.createTestEnvironment( ).then( window => {

				const journey = window.journey;
				const routes = [ ];

				journey
						.add( '/', {
							enter: ( ) => {
								routes.push( 'root' );
							}
						} )

						.add( '/foo', {
							enter: ( ) => {
								routes.push( 'foo' );
							}
						} );

				return journey.start( { useHash: true, useOnHashChange: true } )
						.then( function() {
					
							// Ensure the url updated
							let href = window.location.href;
							assert.ok( href.endsWith( "#" ) );

							let promise = util.goto( 'foo' )();
							return promise;
						}).then( util.back )    // root
						//.then( back )    // root
						.then( util.forward )    // foo

						.then( () => {
							assert.deepEqual( routes, [ 'root', 'foo', 'root', 'foo' ] );
							
							// ensue the url updated
							let href = window.location.href;
							assert.ok( href.endsWith( "#foo" ) );
							window.close();
						} );
			} );
		} );
	} );

	describe( 'misc tests', ( ) => {

		it( 'ensure routes with prefix "/#" is supported eg. "/#home"', ( ) => {
			return util.createTestEnvironment( '/#foo' ).then( window => {
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
			return util.createTestEnvironment( ).then( window => {
				const journey = window.journey;
				let fooEntered = false;
				return journey
						.add( '/foo', {
							enter( ) {
								fooEntered = true;
							}
						} )
						.start( { useHash: true } ).then( util.goto( "/#foo" ) )
						.then( () => {
							assert.ok( fooEntered );
							window.close( );
						} );
			} );
		} );

		it( 'ensure goto "/#" routes work eg goto(/#foo) - useHash: false "', ( ) => {
			return util.createTestEnvironment( ).then( window => {
				const journey = window.journey;
				let fooEntered = false;
				return journey
						.add( '/foo', {
							enter( ) {
								fooEntered = true;
							}
						} )
						.start( { useHash: false } ).then( util.goto( "/#foo" ) )
						.then( () => {
							assert.ok( fooEntered );
							window.close( );
						} );
			} );
		} );

	} );
} );
