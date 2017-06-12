# dev.js

Below is the complete **dev.js**.

```js
let fsPath = require( 'path' );
var chokidar = require( 'chokidar' );
var fs = require( 'fs-extra' );
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' ); // Rollup config is covered in the next section

var express = require( 'express' ); // For our Express server
var open = require( 'open' );

// Set source/build folders
const buildFolder = 'build';
const srcFolder = 'src';

// Set the destination where Rollup will write the transpiled Javascript bundle to
const rollupDest = buildFolder + '/js/app/app.js';

// Start the development environment
start( );

// start() drives the logic
function start() {

    // Watch files for changes and copy changed files to the build folder
    watchAssets()
        .then( compileJS )	 // Start transpiling and bundling our ES6 JS into ES5 JS.
        .then( startServer ) // We can start a Node based server such as Express to view our application.
                             // Or we can setup an external server to serve content from the
                            // 'build' folder.

        .catch( ( e ) => {      // catch any error and log to console
            console.log( e );   // Log errors to console
        } );
}

// Setup a watcher on our 'src' so that modified files are
// copied to the build folder
function watchAssets() {

    let p = new Promise( function ( resolve, reject ) {

        // Watch all files (except JS in 'app' folder, since Rollup takes care of those) for changes 
		// and  when a file is created,  updated or deleted the 'all' events is fired.
		let watcher = chokidar.watch( srcFolder + '/**/*', { ignored: [ srcFolder + '/**/app/**/*.js' ] } );

        // 'ready' event fires when all files have been scanned and copied to the 'build' folder
        watcher.on( 'ready', ( ) => {
            resolve('initial scan complete');
        } );

        watcher.on( 'all', ( event, path ) => {

            // No need to copy directories
            if ( ! fs.lstatSync( path ).isDirectory() ) {

                // We copy the changed file to the build folder
                writeToDest( path );
            }
        } );
    } );

    return p;
}

// Function to write given path to the build folder
function writeToDest( path ) {

    // Set buildPath by replacing 'src' string with 'build' string
    let buildPath = buildFolder + path.slice(srcFolder.length);

    // Ensure the build folder exists
    let buildDir = fsPath.dirname( buildPath );
    fs.ensureDirSync( buildDir );

    fs.copySync( path, buildPath );

    return Promise.resolve(); // All our functions return a promise
}

// Setup Rollup to transpile and bundle our ES6 JS into ES5 JS.
function compileJS() {

    let p = new Promise( function ( resolve, reject ) {

        // Set the destination where Rollup should write the ES5 bundle to.
        rollupConfig.targets[0].dest = rollupDest; // Output file

        // setup rollup' watcher in order to run rollup
        // whenever a JS file is changed		
        let watcher = watch( rollup, rollupConfig );

        // We setup a listener for certain Rollup events
        watcher.on( 'event', e => {

            // Note: every time a file changes Rollup will tire a 'BUILD_END' event
            if ( e.code == 'BUILD_END' ) {

                // At this point our JS has been transpiled and bundled into ES5 code
                // so we can resolve the promise.				
                resolve();
            }

            // If Rollup encounters an error, we reject the promise and eventually log the error in start()
            if ( e.code === 'ERROR' ) {
                console.log( e );   // Log Rollup errors to console so we can debug.
                reject( e );
            }
        } );
    } );

    return p;
}

// Starting express server is optional. If you are developing on an external
// server, you can remove this function
function startServer() {

    // Start an express serve for our dev environment
    var app = express();
    let serverFolder = fsPath.join( __dirname, buildFolder );
    app.use( express.static( serverFolder ) );
    app.listen( 9988 );

    // Launch browser
    open( 'http://localhost:9988/' );

    return Promise.resolve(); // All our functions return a promise
}
```
