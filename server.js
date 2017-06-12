var express = require( "express" );
var open = require( 'open' );
var chokidar = require( "chokidar" );
var fs = require( "fs-extra" );
var cmd = require( 'node-cmd' );
const execSync = require( 'child_process' ).execSync;
const exec = require( 'child_process' ).exec;
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var config = require( './rollup.config.js' );
const pkg = require( './package.json' );

let starting = true;

transpileJS();

function transpileJS() {

	watch( rollup, config )
			.on( 'event', e => {
				if ( e.code === 'ERROR' ) {
					console.log( e );
				}
			} )
			.on( 'event', e => {
				if ( e.code == 'BUILD_END' ) {
					setupServer();
				}
			} );
}

function setupServer() {
	if ( starting ) {
		watchAssets();
		startServer();
		// Only start servier once
		starting = false;
	}
}

function watchAssets() {
	let p = new Promise( function ( resolve, reject ) {

		let watcher = chokidar.watch( 'src/**/*', { ignored: [ 'src/**/*.js' ] } );

		// 'ready' event fires when all files have been scanned and copied to the 'build' folder
		watcher.on( 'ready', ( ) => {
			console.log( 'initial scan complete' );
			resolve( 'initial scan complete' );
		} );

		watcher.on( 'all', ( event, path ) => {

			if ( ! fs.lstatSync( path ).isDirectory() ) {
				var dest = path.replace( /^(src\\)/, "dist/" );
				fs.copySync( path, dest );
			}
		} );


	} );

	return p;

}

function startServer() {

	var root = "/dist";

	var app = express();

	// requests with . in them is passed to original request eg: my.js -> my.js, my.css -> my.css etc. Requests without an extension
	// are handled below
	app.get( "*.*", function ( req, res, next ) {
		res.sendFile( __dirname + root + req.url );
	} );

	// Catchall request: always return index.html. Thus we can support PUSHSTATE requests such as host/a and host/b. If user refresh browser
	// express will return index.html and the JS router can route to the neccessary controller
	app.get( "*", function ( req, res, next ) {
		res.sendFile( __dirname + root + "/index.html" );
	} );

	app.use( express.static( __dirname + "/dist" ) );
	app.listen( 9988 );
	open( 'http://localhost:9988/' );
}
