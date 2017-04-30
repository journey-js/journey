/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( "jsdom/lib/old-api.js" );
const assert = require( 'assert' );

require( 'console-group' ).install();

const journeysrc = fs.readFileSync( path.resolve( __dirname, '../dist/journey.js' ), 'utf-8' );
//const simulantSrc = fs.readFileSync( require.resolve( 'simulant' ), 'utf-8' );

describe( 'journey', () => {
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

	describe( 'sanity checks', () => {
		it( 'journey exists', () => {
			return createTestEnvironment().then( window => {
				assert.ok( window.journey );
				window.close();
			} );
		} );

		it( 'journey has add, start and goto methods', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				assert.ok( typeof journey.add === 'function' );
				assert.ok( typeof journey.goto === 'function' );
				assert.ok( typeof journey.start === 'function' );
				window.close();
			} );
		} );
	} );

	describe( 'journey.start()', () => {
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
						.start();

				window.close();
			} );
		} );

		it( 'returns a promise that resolves once the route transition completes', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				let enteredRoot;

				journey
						.add( '/', {
							enter: () => {
								enteredRoot = true;
							}
						} );

				return journey.start().then( () => {
					assert.ok( enteredRoot );
					window.close();
				} );
			} );
		} );

		it( 'falls back to a specified route', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				let enteredFoo;

				journey
						.add( '/foo', {
							enter: () => {
								enteredFoo = true;
							}
						} );

				return journey.start( { fallback: '/foo' } ).then( () => {
					assert.ok( enteredFoo );
					window.close();
				} );
			} );
		} );
	} );

	describe( 'journey.goto()', () => {
		it( 'leaves the current route and enters a new one', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				let leftRoot;
				let enteredFoo;

				journey
						.add( '/', {
							leave() {
								leftRoot = true;
							}
						} )
						.add( '/foo', {
							enter() {
								enteredFoo = true;
							}
						} )
						.start();

				return journey.goto( '/foo' ).then( () => {
					assert.ok( leftRoot || enteredFoo );
					window.close();
				} );
			} );
		} );

		it( 'returns a promise that resolves once the route transition completes', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				let enteredFoo;

				journey
						.add( '/', { } )
						.add( '/foo', {
							enter() {
								enteredFoo = true;
							}
						} )
						.start();

				return journey.goto( '/foo' ).then( () => {
					assert.ok( enteredFoo );
					window.close();
				} );
			} );
		} );

		it( 'treats navigating to the same route as a noop', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				let leftFoo;

				window.location.href += 'foo';

				journey
						.add( '/foo', {
							leave() {
								leftFoo = true;
							}
						} )
						.start();

				return journey.goto( '/foo' ).then( () => {
					assert.ok( ! leftFoo );
					window.close();
				} );
			} );
		} );

		it( 'does not treat navigating to the same route with different params as a noop', () => {
			return createTestEnvironment( '/foo' ).then( window => {
				const journey = window.journey;

				const left = { };

				journey
						.add( '/:id', {
							leave( route ) {
								left[ route.params.id ] = true;
							}
						} )
						.start();

				return journey.goto( '/bar' ).then( () => {
					assert.ok( left.foo );
					window.close();
				} );
			} );
		} );

		it( 'does not treat navigating to the same route with different query params as a noop', () => {
			return createTestEnvironment( '/foo?a=1' ).then( window => {
				const journey = window.journey;

				const entered = [ ];
				const left = [ ];

				journey
						.add( '/foo', {
							enter( route ) {
								entered.push( route.query.a );
							},
							leave( route ) {
								left.push( route.query.a );
							}
						} )
						.start()
						.then( () => {
							assert.deepEqual( entered, [ '1' ] );
							assert.deepEqual( left, [ ] );

							return journey.goto( '/foo?a=2' );
						} )
						.then( () => {
							assert.deepEqual( entered, [ '1', '2' ] );
							assert.deepEqual( left, [ '1' ] );
							window.close();
						} );
			} );
		} );

		it( 'differentiates between previous route and current route', () => {
			return createTestEnvironment( '/foo' ).then( window => {
				const journey = window.journey;

				journey
						.add( '/:id', {
							enter( route, previousRoute ) {
								assert.ok( route !== previousRoute );
							}
						} )
						.start();

				return journey.goto( '/bar' ).then( () => {
					window.close();
				} );
			} );
		} );

		it( 'includes the hash', () => {
			return createTestEnvironment( '/foo#bar' ).then( window => {
				const journey = window.journey;

				const hashes = [ ];

				journey
						.add( '/foo', {
							enter( route ) {
								hashes.push( route.hash );
							}
						} );

				journey.start();

				return journey.start()
						.then( () => journey.goto( '/foo#baz' ) )
						.then( () => {
							assert.deepEqual( hashes, [
								'bar',
								'baz'
							] );

							window.close();
						} );
			} );
		} );

		it( 'updates a route rather than leaving and entering, if applicable', () => {
			return createTestEnvironment( '/foo' ).then( window => {
				const journey = window.journey;

				const ids = [ ];

				journey
						.add( '/:id', {
							enter( route ) {
								ids.push( route.params.id );
							},

							update( route ) {
								this.enter( route );
							}
						} )
						.start();

				return journey.goto( '/bar' ).then( () => {
					assert.deepEqual( ids, [
						'foo',
						'bar'
					] );

					window.close();
				} );
			} );
		} );
	} );

	describe( 'route.isInitial', () => {
		it( 'is true for the first (and only the first) route navigated to', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;

				let rootWasInitial;
				let fooWasInitial;

				journey
						.add( '/', {
							enter( route ) {
								rootWasInitial = route.isInitial;
							}
						} )
						.add( '/foo', {
							enter( route ) {
								fooWasInitial = route.isInitial;
							}
						} )
						.start();

				return journey.goto( '/foo' ).then( () => {
					assert.ok( rootWasInitial );
					assert.ok( ! fooWasInitial );
					window.close();
				} );
			} );
		} );
	} );

	describe( 'history', () => {
		it( 'can control journey without the history stack being corrupted', () => {
			return createTestEnvironment().then( window => {
				const journey = window.journey;
				const routes = [ ];

				journey
						.add( '/', {
							enter: () => {
								routes.push( 'root' );
							}
						} )
						.add( '/foo', {
							enter: () => {
								routes.push( 'foo' );
							}
						} )
						.add( '/:id', {
							enter( route ) {
								routes.push( route.params.id );
							}
						} )
						.start();

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

				return journey.goto( '/foo' )
						.then( goto( '/bar' ) )
						.then( goto( '/baz' ) )
						.then( back )    // bar
						.then( back )    // foo
						.then( back )    // root
						.then( forward ) // foo
						.then( forward ) // bar
						.then( forward ) // baz
						.then( () => {
							assert.deepEqual( routes, [ 'root', 'foo', 'bar', 'baz', 'bar', 'foo', 'root', 'foo', 'bar', 'baz' ] );
							window.close();
						} );
			} );
		} );
	} );
} );

function wait( ms ) {
	return new Promise( fulfil => setTimeout( fulfil, ms || 50 ) );
}