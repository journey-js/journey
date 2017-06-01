# Distribution Setup

In this section we will look at setting up a  script to create a distribution for our Single Page Application that relies on ES6 features such as ES6 Modules.

If you would like an overview of Single Page Applications and ES6 Modules see [Overview](overview.md).

Before creating a distribution you should read through the [Development Setup Guide](dev-setup.md).

There are a variety of solutions available such as [Rollup](), [Webpack](), [Browserify](), [Grunt](), [Gulp]() etc. Here we will look at Rollup as I've found it the easiest to get started with.


## The Problem
The problem we face is that not all browsers support all ES features, especially ES6 Modules. So when creating a distribution from sources that contains ES6 features such as ES6 Modules, browsers won't be able to interpret the new syntax and the code won't be executed.

Once we have built our application as set out in the  [Development Setup Guide](dev-setup.md), we need to create a production ready distribution.


## The Goal
We are trying to reach the following goals from our distribution script *dist.js*:

 1. compile our ES6 source code into an ES5 bundle (his is accomplished with Rollup)
 2. minify our JS code (through the Uglify Rollup plugin)
 3. precompile our View templates (we will use Ractive as our view here)
 4. combine and minify our CSS (we'll use clean-css)
 5. version our assets (js/css). (We use node-version-assets module) Browsers cache js/css files so if we release a new version of our application the browser could continue to serve the previous version causing confusion. By versioning our files each build/release, we will force the browser to download the latest version.
 6. We might also want to load certain assets (js/css) from CDN servers for two reasons:
	 - popular libraries such as jQuery/Bootstrap etc. could already be cached by the browser from previous visits to other sites that served those same libraries. We don't have to bundle those libraries with out application, leading to a smaller bundle that can be downloaded (and thus launch) faster on the client browser.
	 - every time we release a new version of our application, those CDN hosted libraries will now be available in the browser cache (except where we updated a library to a new version as well).


## The Solution
Let's get down to business.

We need to convert (transpile) the ES6 features into ES5 features that browsers understand.

We will use [Rollup]() to convert the ES6 Modules into ES5 code. Rollup has a couple of output format options available, including [IIFE]() and [AMD](). IIFE is what we will setup here, because it is self contained (it does not need an library like [RequireJS]() to run) but you can use AMD if you want. 

### Project structure

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

### index.html
Below we list the full *index.html* content:

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
    
<!-- If we want to use external libraries such as jQuery and load them from our localhost in DEV and CDN in PROD. we can place them in comments as shown below. In our dist.js script we will create a function to comment the local jQuery script and uncomment the CDN jQuery script. We can place as many external libraries in the comments as we like. -->

	<!-- start DEV imports -->
	<script src="js/lib/jquery-3.2.1.js"></script> 
    <!-- end DEV imports -->
    
    <!-- start PROD imports
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
end PROD imports -->

    <script src="js/app/app.js" defer nomodule></script> <!-- Entry point to our app -->

</html>
```

We will start with our *index.html* which serves up our application. The entry point to our SPA is: ``` <script src="js/app/app.js">```. 

We also use an external library, jQuery in this case, so we have a second ```<script src="js/lib/jquery-3.2.1.js">```.
The surrounding comments of our jQuery librari is important. When we develop our application, we want to load the jQuery lib from our local server. But in production we to serve it from CDN, so that we can independently upgrade our application or external library without having to re-download the other.

We wrap our DEV libraries with the comment:

```html
 <!-- start DEV imports -->
	<script src="lib/jquery3.2.1.js"></script>
 <!-- end DEV imports -->
```

Then we comment our PROD libraries with:

```html
<!-- start PROD imports
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
end PROD imports -->
```

In *dist.js* is a function **uncommentCDN**, which simply replaces the comments as follows:

```html
 <!-- start DEV imports 
	<script src="lib/jquery3.2.1.js"></script>
end DEV imports -->

<!-- start PROD imports -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<!-- end PROD imports -->
```

Our jQuery script that was served from our local server in development, will be served from a CDN in production. Neat right? 

## dist.js
We will use two separate Node scripts for our project, one to run an development environment, *dev.js*, and one to create a distribution with, *dist.js*. You can combine these two scripts into one script if you like.

**Note:** you can also use Grunt/Gulp/somethingElse to setup a dev and dist environment.

*build.js* is our build script that we use to create a production ready distribution of our application.

Our project structure has a *src* folder where we will develop our application and a *dist* folder where our distribution will be located.

+++++++++++++++++++++++++++++++++++

In order to view the application in a browser we need to setup a server to serve content from our *build* folder. We will show how to setup an Express server later on.

We need a way to keep the *src* and *build* folder in sync, so whenever files are changed in the *src* folder they must be copied to the *build* folder.

First we create a function, **watchAssets** to watch the *src* folder for files that are updated, and copy those files to the *build* folder. When this function is called upon startup, all files will be copied to the *build* folder.

```js
let fsPath = require( 'path' );
var chokidar = require( 'chokidar' );
var fs = require( 'fs-extra' );
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' ); // Rollup config is covered in the next section

// Define variables for src and build folders
const buildFolder = 'build';
const srcFolder = 'src';

// Watch files for changes and copy changed files to the build folder
watchAssets();

// Start transpiling and bundling our ES6 JS into ES5 JS.
compileJS();

// Setup a watcher to copy changed files to the build folder
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

		// Note: every time a file changes Rollup will tire a 'BUILD_END' event
		if ( e.code == 'BUILD_END' ) {
		
			// At this point our JS has been transpiled and bundled into ES5 code.
			// We can start a Node based server such as Express to view our application.
			// Or we can setup an external server to serve content from the 
			// 'build' folder.
			
			// startServer(); // Later on we will add a startServer script for Express.
		}
	} );
}
```

Hopefully not too daunting? That covers our *dev.js* script. 

The only outstanding part is the Rollup configuration. Let's cover it next.

### rollup.config.js

Below is our Rollup configuration to bundle our ES6 Modules into an output format that the browser can understand. We will use [iife]() as the output format. We also setup the [Buble]() plugin to convert ES6 syntax (classes, arrow functions) into ES5 syntax.

```js
var buble = require( 'rollup-plugin-buble' );
const pkg = require( './package.json' );

module.exports = {

	entry: 'src/js/app.js', // app.js bootstraps our application.
							// app.js is referenced from index.html <script> tag
	// Setup Buble plugin to transpiler ES6 to ES5
	plugins: [
		buble( {
			exclude: [ '**/*.html' ] // Skip HTML files
		} )
	],
	
	moduleName: 'myApp',

	targets: [
		{
			dest: 'build/js/app/myapp.js', // Rollup output file
			format: 'iife',
			sourceMap: true // NB: generating a SourceMap allows us to debug
							// our code in the browser in it's original ES6 format.
		}
	]
};
```
Now we have a Node script to transpile and bundle our ES6 source into an ES5 bundle we can serve to the browser. Changes to JS will automatically be re-bundled/re-transpiled, including a sourcemap for easy debugging.

### package.json
The ```package.json``` below lists all the node modules required to setup a *dev* and *production* environment.

```json
{
  "name": "My App",
  "description": "My Application",
  "version": "0.0.1",
  "main": "dist/js/app/app.js",
    
  "devDependencies": {
        "chokidar": "^1.6.1",
    "clean-css": "^4.1.2",
    "express": "^4.13.3",
        "fs-extra": "3.0.1",
    "glob": "^7.1.1",
    "node-cmd": "^2.0.0",
    "node-version-assets": "^1.2.0",
    "open": "0.0.5",
    "ractive": "^0.9.0",
    "replace-in-file": "^2.5.0",
    "rollup": "^0.41.6",
    "rollup-plugin-buble": "^0.15.0",
    "rollup-plugin-includepaths": "^0.2.2",
    "rollup-plugin-ractive": "^2.0.0",
    "rollup-plugin-uglify": "^1.0.2",
    "rollup-watch": "^3.2.2"
  },
  "scripts": {
    "dist": "node dist",
    "dev": "node dev"
  }
 }
```
Then run:
> npm i

This will download all node modules.

The following commands are available:

Create a distribution of the application:
> npm run dist

Start a development environment for the application:
> npm run dev
