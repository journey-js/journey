const jsdom = require( "jsdom/lib/old-api.js" );
const path = require( 'path' );
const fs = require( 'fs' );

const journeysrc = fs.readFileSync( path.resolve( __dirname, '../dist/journey.js' ), 'utf-8' );
//const simulantSrc = fs.readFileSync( require.resolve( 'simulant' ), 'utf-8' );

let global;

let util = {

	createTestEnvironment( initial ) {
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
	},

	goto( href ) {
		return ( ) => {
			return global.journey.goto( href );
		};
	},

	back( ) {
		global.history.back( );
		return util.wait( );
	},

	forward( ) {
		global.history.forward( );
		return util.wait( );
	},

	wait( ms ) {
		return new Promise( fulfil => setTimeout( fulfil, ms || 50 ) );
	}
};

module.exports = util;