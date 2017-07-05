/*global require, describe, it, __dirname */
const path = require('path');
const fs = require('fs');
const jsdom = require("jsdom/lib/old-api.js");
const assert = require('assert');
const util = require('./util');

require('console-group').install();

describe('route', () => {

	describe('enter()', () => {

		it('should receive a previous route without pathname but with scrollX / Y upon first enter()', (function (done) {

			util.createTestEnvironment('#foo').then(function (window) {

				const journey = window.journey;

				let prevRoute, prevRouteScrollPos = {};

				journey.add('/foo', {

					enter(route, prev) {
						prevRoute = prev.pathname;
						prevRouteScrollPos.x = prev.scrollX;
						prevRouteScrollPos.y = prev.scrollY;

					}
				});

				journey.start().then(function () {

					try {
						assert.equal(prevRoute, null);
						assert.ok(prevRouteScrollPos.x === 0);
						assert.ok(prevRouteScrollPos.y === 0);

						done();
					} catch (e) {
						done(e);
					}

				});
			});
		}));


		it(' should receive correct route and prev route', (function (done) {

			util.createTestEnvironment('#foo').then(function (window) {

				const journey = window.journey;
				let prevRoute, currRoute;

				journey.add('/foo', {
				});

				journey.add('/bar', {

					enter(route, prev) {
						currRoute = route.pathname;
						prevRoute = prev.pathname;
					}
				});

				journey.start().then(function () {


					journey.goto('/bar').then(function () {

						try {
							assert.equal(currRoute, 'bar');
							assert.equal(prevRoute, 'foo');

							done();

						} catch (e) {
							done(e);
						}
					});
				});
			});
		}));
	});

	describe('leave()', () => {

		it('should receive correct route and next route', (function (done) {

			util.createTestEnvironment('#foo').then(function (window) {

				const journey = window.journey;
				let nextRoute, currRoute;

				journey.add('/foo', {
				});

				journey.add('/bar', {

					leave(route, next) {
						currRoute = route.pathname;
						nextRoute = next.pathname;
					}
				});

				journey.start()
					.then(util.goto('/bar'))
					.then(util.goto('/foo'))
					.then(function () {
						try {
							assert.equal(currRoute, 'bar');
							assert.equal(nextRoute, 'foo');

							done();

						} catch (e) {
							done(e);
						}
					});
			});
		}));
	});

	describe('enter()', () => {
		describe('serially enter()', () => {

			it('should receive correct route and next route', (function (done) {

				util.createTestEnvironment('#foo').then(function (window) {

					const journey = window.journey;
					let nextRoute, currRoute;

					journey.add('/foo', {
					});

					journey.add('/bar', {

						leave(route, next) {
							currRoute = route.pathname;
							nextRoute = next.pathname;
						}
					});

					journey.start()
						.then(util.goto('/bar')) // enter here
						.then(util.goto('/foo')) // and afterwards enter here
						.then(function () {
							try {
								assert.equal(currRoute, 'bar');
								assert.equal(nextRoute, 'foo');

								done();

							} catch (e) {
								done(e);
							}
						});
				});
			}));
		});

		describe('concurrently enter()', () => {

			it.only('should receive correct route and next route', (function (done) {

				util.createTestEnvironment('#foo').then(function (window) {

					const journey = window.journey;
					let nextRoute, prevRoute, currRoute, currRoute2;

					journey.add('/foo', {
						enter() {
							console.log("----------- enter.foo() ");
						},
						leave(route, next) {
							console.log("---------------------------- foo.leave()");
						}

					});

					journey.add('/bar', {
						enter(route, prev) {
							console.log("----------- bar.enter() ");
							currRoute = route.pathname;
							prevRoute = prev.pathname;
						},

						leave(route, next) {
							currRoute2 = route.pathname;
							nextRoute = next.pathname;
							console.log("---------------------------- bar.leave()");
						}
					});

					journey.start()
					journey.goto('/bar')
						.then(util.goto('/foo'))
						.then(function () {
							console.log("ready to test");
							try {
								assert.equal(currRoute, 'bar');
								assert.equal(prevRoute, null);
								assert.equal(currRoute2, 'bar');
								assert.equal(nextRoute, 'foo');

								done();

							} catch (e) {
								done(e);
							}
						});
				});
			}));
		});

		describe('redirect enter()', () => {

			it('should receive correct route and prev route', (function (done) {

				util.createTestEnvironment('#foo').then(function (window) {

					const journey = window.journey;
					let barPrevRoute, barRoute, bazRoute, bazPrevRoute;

					journey.add('/foo', {

						enter(route, prevRoute) {
							// redirect to bar
							journey.goto('bar');

							return util.wait(50);
						},

						leave(route, prevRoute) {
							console.log("+++++++++ leave foo")
						}

					});

					journey.add('/bar', {

						enter(route, prev) {
							barRoute = route.pathname;
							barPrevRoute = prev.pathname;
							journey.goto('baz');
						},
						leave(route, prevRoute) {
							console.log("+++++++++ leave bar")
						}
					});

					journey.add('/baz', {

						enter(route, prev) {
							bazRoute = route.pathname;
							bazPrevRoute = prev.pathname;
						}
					});

					journey.start()
						//.then( util.goto('/bar') )
						//.then( util.goto('/foo') )
						.then(function () {
							try {
								assert.equal(barRoute, 'bar');
								assert.equal(barPrevRoute, 'foo');
								assert.equal(bazRoute, 'baz');
								assert.equal(bazPrevRoute, 'bar');

								done();

							} catch (e) {
								done(e);
							}
						});
				});
			}));
		});
	});
});
