# Development Setup

In this section we will look at setting up a development environment for writing Single Page Applications that relies on ES6 features such as ES6 Modules.

If you would like an overview of Single Page Applications and ES6 Modules see [Overview](overview.md).

If you are looking to create a production ready distribution for your application see [Distribution Setup Guide](dist-setup.md).

There are a variety of solutions available such as [Rollup](), [Webpack](), [Browserify[() etc. Here we will look at Rollup as I've found it the easiest to get started with.

## The Problem
The problem we face is that not all browsers support all ES features, especially ES6 Modules. So when developing with ES6 features such as the new moduling system, browsers won't be able to interpret the new syntax and the code won't be executed.

## The Goal
We are trying to achieve the following development environment.

* write code using ES6 modules and possibly other ES6 language features such as classes and arrow functions.
* refreshing the browser should show the result of the code we just wrote in the step above
* Code should run in all modern browsers, Chrome, Firefo, Safari, IE9 and up

In other words, we want to use ES6 features and they must be just as easy to develop with as if we were using ES5.

But what about debugging? If we were to debug the transpiled ES5 code in the browser, there would be a major difference between our original source code and generated code. Stepping over code in the debugger won't correspond to our source code. 

Fear not, [SourceMaps]() to the rescue. SourceMaps are text files that informs browsers how to convert the compiled ES5 code *back* to it's original ES6 source. So when you open a debugger in the browser, the code you step through will be exactly the same as the code in your */src* folder, each ES6 modules as a separate script.

Yay! You can have your cake and eat it. Can you gimme a "Oh Yeah"?

## The Solution
Let's get down to business.

We need to convert (transpile) the ES6 features into ES5 features that browsers understand.

We will use [Rollup]() to convert the ES6 Modules into ES5 code. Rollup has a couple output format options available, including [IIFE]() and [AMD](). IIFE is what we will setup here, because it is self contained (it does not need an library like [RequireJS]() to run) but you can use AMD if you want. 

We will  also use RollUp' watcher to automaticaly bundle the source when we make changes to files.

We will also setup a distribution build so we can ship production code when we are need to release. The distribution build minimizes the IIFE and CSS as well as version the files, so when we make updates to our application in the future, the browser is forced to download our new version, instead of serving the old version from it's cache.

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
We will start with our *index.html* which serves up our application. The entry point to our SPA is: ``` <script src="js/app/app.js">```. 

We also reference the application CSS: ```<link rel="stylesheet" type="text/css" href="css/site.css" />```.

```html
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">        
        <title>My App</title>
        <link rel="stylesheet" type="text/css" href="css/site.css" />
    
    </head>
    <body>
        
        <div id="menu">
            <nav class="navbar navbar-default"></nav> <!-- A menu bar -->
        </div>
       
        <div id="container"></div> <!-- Our views will be rendered here -->
    </body>
        
    <script src="js/app/app.js" defer nomodule></script>
</html>
```

### dev.js
We will use two separate Node scripts for our project, one to run an development environment, *dev.js*, and one to create a distribution with, *dist.js*. You can combine these two scripts into one script if you like.

**Note:** you can also use Grunt/Gulp/somethingElse to setup a dev and build environment.

*dev.js* is the script we use to start our development environment. We will setup the minimum we need to get the job done and not necessarily best practices.

Our project structure has a *src* folder where we will develop our application and a *build* folder where our *src* code is *compiled*  to (or transpiled to if you prefer the term). Our *src* folder should be under source control (git, svn etc).

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

### dist.js
Once we have built our application we want to create a production ready distribution.

 See the [Distribution Setup Guide](dist-setup.md) for details.

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

The following commands are made available by *package.json*:

- start a development environment for the application:
> npm run dev

- create a distribution of the application:
> npm run dist

