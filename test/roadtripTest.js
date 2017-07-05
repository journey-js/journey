/*global require, describe, it, __dirname */
const assert = require( 'assert' );
const util = require('./util');

require( 'console-group' ).install();

describe( 'journey', () => {

	describe( 'sanity checks', () => {
		it( 'journey exists', () => {
			return util.createTestEnvironment().then( window => {
				assert.ok( window.journey );
				window.close();
			} );
		} );

		it( 'journey has add, start and goto methods', () => {
			return util.createTestEnvironment().then( window => {
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
			util.createTestEnvironment().then( window => {
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
			return util.createTestEnvironment().then( window => {
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
			return util.createTestEnvironment().then( window => {
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
			return util.createTestEnvironment().then( window => {
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
			return util.createTestEnvironment().then( window => {
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
			return util.createTestEnvironment().then( window => {
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
			return util.createTestEnvironment( '/foo' ).then( window => {
				const journey = window.journey;

				const left = { };

				journey
						.add( '/:id', {
							leave( route ) {
								left[ route.params.id ] = true;
							}
						} );

				return journey.start( { useHash: false } ).then( function () {
					return journey.goto( '/bar' ).then( () => {
						assert.ok( left.foo );
						window.close();
					} );
				} );

			} );
		} );

		it( 'does not treat navigating to the same route with different query params as a noop', () => {
			return util.createTestEnvironment( '/foo?a=1' ).then( window => {
				const journey = window.journey;

				const entered = [ ];
				const left = [ ];

				return journey
						.add( '/foo', {
							enter( route ) {
								entered.push( route.query.a );
							},
							leave( route ) {
								left.push( route.query.a );
							}
						} )
						.start( { useHash: false } )
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
			return util.createTestEnvironment( '/foo' ).then( window => {
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
			return util.createTestEnvironment( '/foo#bar' ).then( window => {
				const journey = window.journey;

				const hashes = [ ];

				journey
						.add( '/foo', {
							enter( route ) {
								hashes.push( route.hash );
							}
						} );

				journey.start( { useHash: false } );

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
			return util.createTestEnvironment( '/foo' ).then( window => {
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
						.start( { useHash: false } ).then( () => {
					return journey.goto( '/bar' ).then( () => {
						assert.deepEqual( ids, [
							'foo',
							'bar'
						] );
					} );

					window.close();
				} );
			} );
		} );

		it( 'updates the route without updating the URL with invisible: true', () => {
			return util.createTestEnvironment( '/foo' ).then( window => {
				const roadtrip = window.journey;

				let enteredBar;

				roadtrip
						.add( '/foo', {
							enter() {
								roadtrip.goto( '/bar', { invisible: true } );
							}
						} )
						.add( '/bar', {
							enter() {
								enteredBar = true;
							}
						} );

				return roadtrip.start( { useHash: false } ).then( () => {
					assert.ok( enteredBar );
					assert.equal( window.location.href, 'http://journey.com/foo' );
					window.close();
				} );
			} );
		} );
	} );

	describe( 'route.isInitial', () => {
		it( 'is true for the first (and only the first) route navigated to', () => {
			return util.createTestEnvironment().then( window => {
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
						} );

				return journey.start().then( () => {

					return journey.goto( '/foo' ).then( () => {
						assert.ok( rootWasInitial );
						assert.ok( ! fooWasInitial );
						window.close();
					} );
				} );
			} );
		} );
	} );

	describe( 'history', () => {
		it( 'can control journey without the history stack being corrupted', () => {
			return util.createTestEnvironment().then( window => {
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
								let id = route.params.id;
								routes.push( id );
							}
						} );

				return journey.start()
						.then( util.goto( '/foo' ) )
						.then( util.goto( '/bar' ) )
						.then( util.goto( '/baz' ) )
						.then( util.back )    // bar
						.then( util.back )    // foo
						.then( util.back )    // root
						.then( util.forward ) // foo
						.then( util.forward ) // bar
						.then( util.forward ) // baz
						.then( () => {
							assert.deepEqual( routes, [ 'root', 'foo', 'bar', 'baz', 'bar', 'foo', 'root', 'foo', 'bar', 'baz' ] );
					//assert.deepEqual( routes, [ 'root', 'foo', 'root' ] );
							window.close();
						} );
			} );
		} );
	} );
} );

function wait( ms ) {
	return new Promise( fulfil => setTimeout( fulfil, ms || 50 ) );
}