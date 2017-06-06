# dev.js

Below is the complete **dev.js**.

```js
let fsPath = require( 'path' );
var chokidar = require( 'chokidar' );
var fs = require( 'fs-extra' );
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' );
let server = require( './server' );

// Flag to ensure we only start server once
let serverRunning = false;

// Set source/build folders
const buildFolder = 'build';
const srcFolder = 'src';

// start() drives the logic
function start() {
	
	watchAssets();
	
	compileJS();
}

// Setup Rollup to transpile and bundle our ES6 JS into ES5 JS.
function compileJS() {

	// setup rollup' watcher in order to run rollup 
	// whenever a JS file is changed
	let watcher = watch( rollup, rollupConfig );

	// We setup a listener for certain Rollup events
	watcher.on( 'event', e => {

		// If Rollup encounters an error, we log to console so we can debug
		if ( e.code === 'ERROR' ) {
			console.log( e );
		}

		// Once the build is finished we start our server to access app
		if ( e.code == 'BUILD_END' ) {
			startServer();
		}
	} );
}

// Start Express server so we can view our application in the browser
function startServer() {
	// This function will be called every time Rollup completes a build (ie everytime a file change)
	// so we add a check to only start the server once
	if ( serverRunning ) return;	
	
	server.start( {
		buildFolder: buildFolder,
		srcFolder: srcFolder
	} );
	serverRunning = true;
}

// Setup a watcher on our 'src' so that modified files are
// copied tro the build folder
function watchAssets() {

	chokidar.watch( srcFolder + '/**/*' ).on( 'all', ( event, path ) => {

		// No need to copy directories
		if ( ! fs.lstatSync( path ).isDirectory() ) {

			writeToDest( path );
		}
	} );
}

// Function to write given path to the build folder
function writeToDest( path ) {

	// Set buildPath by replacing 'src' str with 'build' str
	let buildPath = buildFolder + path.slice(srcFolder.length);

	let buildDir = fsPath.dirname( buildPath );

	// Ensure the build folder exists
	fs.ensureDirSync( buildDir );

	fs.copySync( path, buildPath );
}

// Start the development environment
start( );
```
