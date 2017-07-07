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
} );

