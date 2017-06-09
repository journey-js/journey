# Development Setup

## Table of Contents
- [Why do we need a development environment?](#problem)
- [What would we like from a development environment](#goal)
- [How do we get there?](#solution)
- [Project Layout](#layout)
- [index.html](#index.html)
- [dev.js](#dev.js)
- [rollup.config.js](#rollup.config.js)
- [package.json](#package.json)

In this section we will look at setting up a development environment for writing Single Page Applications that relies on ES6 features such as ES6 Modules.

If you would like an overview of Single Page Applications and ES6 Modules see [Overview](overview.md).

**Note**: if you are looking to create a production ready distribution for your application see [Distribution Setup Guide](dist-setup.md).

There are a variety of solutions available such as [Rollup](), [Webpack](), [Browserify[() etc. Here we will look at Rollup as I've found it the easiest to get started with.

## <a id="problem"></a>The Problem
The problem we face is that not all browsers support all ES features, especially ES6 Modules. So when developing with ES6 features such as the new moduling system, browsers won't be able to interpret the new syntax and the code won't be executed.

## <a id="goal"></a>The Goal
We are trying to achieve the following development environment.

* write code using ES6 modules and possibly other ES6 language features such as classes and arrow functions.
* refreshing the browser should show the result of the code we just wrote in the step above
* Code should run in all modern browsers, Chrome, Firefo, Safari, IE9 and up

In other words, we want to use ES6 features and they must be just as easy to develop with as if we were using ES5.

But what about debugging? If we were to debug the transpiled ES5 code in the browser, there would be a major difference between our original source code and generated code. Stepping over code in the debugger won't correspond to our source code.

Fear not, [SourceMaps]() to the rescue. SourceMaps are text files that informs browsers how to convert the compiled ES5 code *back* to it's original ES6 source. So when you open a debugger in the browser, the code you step through will be exactly the same as the code in your */src* folder, each ES6 modules as a separate script.

Yay! You can have your cake and eat it. Can you gimme a "Oh Yeah"?

## <a id="solution"></a>The Solution
Let's get down to business.

We need to convert (transpile) the ES6 features into ES5 features that browsers understand.

We will use [Rollup]() to convert the ES6 Modules into ES5 code. Rollup has a couple output format options available, including [IIFE]() and [AMD](). IIFE is what we will setup here, because it is self contained (it does not need an library like [RequireJS]() to run) but you can use AMD if you want.

We will  also use RollUp' watcher to automaticaly bundle the source when we make changes to files.

We will also setup a distribution build so we can ship production code when we are need to release. The distribution build minimizes the IIFE and CSS as well as version the files, so when we make updates to our application in the future, the browser is forced to download our new version, instead of serving the old version from it's cache.

### <a id="layout"></a>Project Layout

Here is the layout we will use for our web app:

```
-- build    // This is where our development environment will be located
-- dist     // TYhis is where our production build will be located
-- src
    |-- css
    |-- js
         |-- app // our web application
              |-- app.js // our application entry point that is referenced
              			   // from index.html: <script src="js/app/app.js">
         |-- lib // Racive, jQuery etc.
    |-- fonts
    |-- images
    index.html
-- dev.js  // Node script to setup a development environment
-- dist.js // Node script to setup a development environment
```

### <a id="index.html"></a>index.html
We will start with our *index.html* which serves up our application. The entry point to our SPA is: ``` <script src="js/app/app.js">```.

We also reference the application CSS: ```<link rel="stylesheet" type="text/css" href="css/site.css" />```.

```html
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">        
        <title>My App</title>
        <!-- Our app CSS -->
        <link rel="stylesheet" type="text/css" href="css/site.css" />

    </head>
    <body>

        <div id="menu">
            <nav class="navbar navbar-default"></nav> <!-- A menu bar -->
        </div>

        <div id="container"></div> <!-- Our views will be rendered here -->
    </body>

<!-- If we want to use external libraries such as jQuery and load them from our localhost in DEV and CDN in PROD, we can place them in comments as shown below. In our dist.js script we
will create a function to comment the local jQuery script and uncomment the CDN jQuery
script. We can place as many external libraries in the comments as we like. -->

	<!-- start DEV imports -->
	<script src="js/lib/jquery-3.2.1.js"></script>
    <!-- end DEV imports -->

    <!-- start PROD imports
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
end PROD imports -->

    <script src="js/app/app.js" defer nomodule></script> <!-- Entry point to our app -->

</html>
```

### <a id="dev.js"></a>dev.js
We will use two separate Node scripts for our project, one to run an development environment, *dev.js*, and one to create a distribution with, *dist.js*. You can combine these two scripts into one if you like.

*dev.js* is the script we use to start our development environment. We will setup the minimum we need to get the job done and not necessarily best practices.

You can find the complete *dev.js* source [here](dev.js.md).

Our project layout has a *src* folder where we will develop our application and a *build* folder where our *src* code is *compiled*  to (or transpiled to if you prefer the term). Our *src* folder should be under source control (git, svn etc).

In order to view the application in a browser we need to setup a server to serve content from our *build* folder. In our *dev.js* script we will also setup an [Express](https://expressjs.com/) server.

We structure dev.js into sections (JS functions) that match our [Goals](#goal). The functions will return a promise so we don't have to worry about which section performs asynchronous work.

To kick things off we create a **start** function that assembles all the various sections into a working development environment. Once we have **start** defined we will add the different sections to our script.

```js
let fsPath = require( 'path' );
var chokidar = require( 'chokidar' );
var fs = require( 'fs-extra' );
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' ); // Rollup config is covered in the next section
var pkg = require( './package.json' );

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
```

When developing we need a way to keep the *src* and *build* folder in sync, so whenever files are changed in the *src* folder they must be copied to the *build* folder.

We create the function **watchAssets** to watch the *src* folder for files that are updated, and copy those files to the *build* folder. When this function is called upon startup, all files (except JS) will be copied to the *build* folder. We configure [Chokidar](https://github.com/paulmillr/chokidar) to ignore Javascript (*.js) files as they are managed by Rollup.

```js
// Setup a watcher on our 'src' so that modified files are
// copied to the build folder
function watchAssets() {

    let p = new Promise( function ( resolve, reject ) {

        // Watch all files (except JS since Rollup takes care of JS) for changes and when a file is created, 
	// updated or deleted the 'all' events is fired.
	let watcher = chokidar.watch( srcFolder + '/**/*', { ignored: [ srcFolder + '/**/*.js' ] } );

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
```

We use [chokidar](https://github.com/paulmillr/chokidar) to watch files for changes. Whenever a file is created, updated or deleted, chokidar fires the 'all' event, passing the path to the file that changed. We then copy that file to the *build* folder through the **writeToDest** function.

Below is the **writeToDest** function:

```js
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
```

Next we transpile our ES6 Javascript into ES5 and create a bundle in the [IIFE](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression) format.

Here is the **copileJS** function:

```js
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
```

**compileJS** returns a promise that either fails or succeeds depending on if our code contains errors or not.

We start Rollup with [Rollup Watch](https://github.com/rollup/rollup-watch) and pass in the
 [rollup.config.js](#rollup.config.js) which specifies that the ES5 output should be written to '*'build/js/app/myapp.js'*.

  The watcher fires events as files are transpiled and bundled. We are interested in two events, namely 'BUILD_END' and 'ERROR'.

 'BULD_END' is fired when all the ES6 code has been transpiled and bundled successfully, so we resolve the promise.

 'ERROR' is fired if our code contains errors, so we log the error to the console for debugging purposes and reject the promise.

 Because we use Rollup' watcher, every time a Javascript file is added, modified or deleted, this process is repeated - Rollup transpiles and bundles the code and writes it to the *buildFolder* and if an errors occurs we log the error to the console.

 *Note*: promises can only resolve/reject once, so after the first run, the resolve/reject calls won't make a difference. But that is ok, we only returned promises from this method to tie into the rest of our script' asynchronous nature.

 The final step is to start a server to serve our application. This is an optional step if we instead serve our application from an external server such as Apache, NGINX, Tomcat etc.

 Below we show the function **startServer**:

 ```js
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

Hopefully not too daunting? That covers our *dev.js* script.

**Note:** you can also use Webpack/Grunt/Gulp/somethingElse to develop and create a distribution with.

The only outstanding part is the Rollup configuration. Let's cover it next.

### <a id="rollup.config.js"></a>rollup.config.js

Below is our Rollup configuration to bundle our ES6 Modules into an output format that the browser can understand. We will use [iife]() as the output format. We also setup the [Buble]() plugin to convert ES6 syntax (classes, arrow functions) into ES5 syntax.

*Note:* the rollup.config.js script is shared between the [production](#dist-setup.md) and development environments.

```js
var buble = require( 'rollup-plugin-buble' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );
var pkg = require( './package.json' );

module.exports = {

	 entry: 'src/js/app.js', // app.js bootstraps our application.
                            // app.js is referenced from index.html <script> tag

	plugins: [

		// this plugin allows us to import Ractive templates and optionally compile them
		// for production use. We disable compile by default and switch it back on for
		// production in dist.js
		ractiveCompiler( {
			include: [ '**/*.html' ],

			compile: false
		} ),

		// this plugin allows us to import plain text/json files as ES6 Modules.
		// We configure this plugin to handle files with the pattern 'xxx.text.html'.
		stringToModule({
			include: '**/*.text.html'
		}),

		// Setup Buble plugin to transpiler ES6 to ES5
		buble( {
			exclude: [ '**/*.html' ] // Skip HTML files
		} ),

		includePaths( includePathOptions )
	],
	moduleName: 'myApp',

	targets: [
		{
			dest: 'build/js/app/myapp.js', // Rollup output during development,
						       // ignored for production build
			format: 'iife',
			banner: '/* myApp version ' + pkg.version + ' */',
			 sourceMap: true // NB: generating a SourceMap allows us to debug
                            // our code in the browser in it's original ES6 format.
		}
	]
};
```
Now we have a Node script to transpile and bundle our ES6 source into an ES5 bundle we can serve to the browser. Changes to JS will automatically be re-bundled/re-transpiled, including a sourcemap for easy debugging.

### <a id="package.json"></a>package.json
The ```package.json``` below lists all the node modules required to setup a *dev* and *production* environment.

```json
{
  "name": "myApp",
  "description": "My Application",
  "version": "0.0.1",
  "main": "build/js/app/app.js",
  "module": "docs/js/app/app.mjs.js",
  "devDependencies": {
    "chokidar": "1.6.1",
    "clean-css": "4.1.2",
    "express": "4.13.3",
    "fs-extra": "3.0.1",
    "glob": "7.1.1",
    "node-version-assets": "1.2.0",
    "open": "0.0.5",
    "ractive": "^0.9.0",
    "replace-in-file": "2.5.0",
    "rollup": "0.41.6",
    "rollup-plugin-buble": "0.15.0",
    "rollup-plugin-includepaths": "0.2.2",
    "rollup-plugin-ractive-compiler": "0.0.5",
    "rollup-plugin-string": "2.0.2",
    "rollup-plugin-uglify": "1.0.2",
    "rollup-watch": "^3.2.2"
  },
  "scripts": {
    "dist": "node dist",
    "dev": "node dev"
  }
}
```
Download and install all required modules with the command:
> npm i

The following commands are made available by *package.json*:

> npm run dev

This command starts a development environment for the application

> npm run dist

This command creates a distribution for the application
