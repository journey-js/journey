# Distribution Setup

## Table of Contents
- [Setting up a development environment](dev-setup.md)
- [Why do we need a distribution?](#problem)
- [What would we like from a distribution](#goal)
- [How do we get there?](#solution)
- [Project Layout](#layout)
- [index.html](#index.html)
- [dist.js](#dist.js)
- [rollup.config.js](#rollup.config.js)
- [package.json](#package.json)


In this section we will look at setting up a  script to create a distribution for our Single Page Application that relies on ES6 features such as ES6 Modules.

If you would like an overview of Single Page Applications and ES6 Modules see [Overview](overview.md).

**Note**:  before creating a distribution you should read through the [Development Setup Guide](dev-setup.md).

There are a variety of solutions available such as [Rollup](), [Webpack](), [Browserify](), [Grunt](), [Gulp]() etc. Here we will look at Rollup as I've found it the easiest to get started with.


## <a id="problem"></a>The Problem
The problem we face is that not all browsers support all ES features, especially ES6 Modules. So when creating a distribution from sources that contains ES6 features such as ES6 Modules, browsers won't be able to interpret the new syntax and the code won't be executed.

Once we have built our application as set out in the  [Development Setup Guide](dev-setup.md), we need to create a production ready distribution.


## <a id="goal"></a>The Goal
We are trying to reach the following goals from our distribution script *dist.js*:

 1. compile our ES6 source code into an ES5 bundle (his is accomplished with Rollup)
 2. minify our JS code (through the Uglify Rollup plugin)
 3. precompile our View templates (we will use Ractive as our view here)
 4. combine and minify our CSS (we'll use clean-css)
 5. version our assets (js/css). (We use node-version-assets module) Browsers cache js/css files so if we release a new version of our application the browser could continue to serve the previous version causing confusion. By versioning our files each build/release, we will force the browser to download the latest version.
 6. We might also want to load certain assets (js/css) from CDN servers for two reasons:
	 - popular libraries such as jQuery/Bootstrap etc. could already be cached by the browser from previous visits to other sites that served those same libraries. We don't have to bundle those libraries with out application, leading to a smaller bundle that can be downloaded (and thus launch) faster on the client browser.
	 - every time we release a new version of our application, those CDN hosted libraries will now be available in the browser cache (except where we updated a library to a new version as well).
 7. Optionally we can zip up our distribution eg. *app-0.0.1.zip*.


## <a id="solution"></a>The Solution
Let's get down to business.

We need to convert (transpile) the ES6 features into ES5 features that browsers understand.

We will use [Rollup]() to convert the ES6 Modules into ES5 code. Rollup has a couple of output format options available, including [IIFE]() and [AMD](). IIFE is what we will setup here, because it is self contained (it does not need an library like [RequireJS]() to run) but you can use AMD if you want.

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

We will add a function to *dist.js* called **uncommentCDN**, which replaces the HTML comments as follows:

```html
 <!-- start DEV imports
	<script src="lib/jquery3.2.1.js"></script>
end DEV imports -->

<!-- start PROD imports -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<!-- end PROD imports -->
```

Our jQuery script that was served from our local server in development, will be served from a CDN in production. Neat right?

## <a id="dist.js"></a>dist.js
We will use two separate Node scripts for our project, one to run a development environment, *dev.js*, and one to create a distribution with, *dist.js*. You can combine these two scripts into one script if you like.

**Note:** you can also use Grunt/Gulp/somethingElse to setup a dev and dist environment.

*dist.js* is the script we use to create a production ready distribution of our application.

Our project structure has a *src* folder where we will develop our application and a *dist* folder where our distribution will be written to.

We structure *dist.js* into logical parts (functions) that match our [Goals Section](). All these parts will return a promise so we don't have to worry about which part performs asynchronous work.  

First we create a **start** function that assembles (calls) all these parts into our final distribution. Once we have **start** defined we will add all the individual parts to our script.

```js
let fsPath = require( 'path' );
var fs = require( 'fs-extra' );
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' ); // Rollup config is covered in the next section

// Define variables for src and build folders
const distFolder = 'dist';
const srcFolder = 'src';

// Starts the distribution
start();

// The distribution is handled in the start function(). The process is broken
// into logical parts (functions) all of which returns a promise.
function start() {

	clean().    	           // Remove the previous build
		then( copyAssets ).    // Copy assets from 'src' to 'dist' folder
		then( compileJS ).     // Copy assets from 'src' to 'dist' folder
		then( compileCss ).    //
		then( uncommentCDN ).  // serve libraries from CDN in production
		then( versionAssets ). // version assets to ensure browser won't cache old
							   // assets when making new releases.
		catch( ( e ) => {      // catch any error and log to console
			console.log( e );
		} );
}
```

We can already see how all the distribution parts fit together. Next we start adding the individual parts.

Below we have **clean()**, to remove the previous distribution, and **copyAssets()** to copy all the assets (JS/CSS/images etc) from the *src* to the *dist* folder.

```js
function clean() {
	fs.removeSync( docsFolder );

	// Ensure the build folder exists
	fs.ensureDirSync( docsFolder );
return Promise.resolve(); // This function is synchronous so we return a resolved promise
}

function copyAssets( ) {
	fs.copySync( srcFolder, docsFolder );
	return Promise.resolve(); // This function is synchronous so we return a resolved promise
}
```

Next up is **compileJS()** which transforms ES6 into ES5 and bundles ES6 modules into IIFE format.

**Note**: *dist.js* use the same **rollup.config.js** file that is used in *dev.js*.

```js
// Setup Rollup to transpile and bundle our ES6 JS into ES5 JS.
function compileJS( ) {
	let p = new Promise( function ( resolve, reject ) {

		// Note that findRollupPlugin looks up a Rollup plugin with the same name in order
		// for us to further configure it before running the production build.
		let ractiveCompiler = findRollupPlugin( "ractive-compiler" );

		ractiveCompiler.compile = true; // We want to precompile Ractive templates

		rollupConfig.plugins.push( uglify( ) ); // Add uglify plugin to minimize the JS

		rollup.rollup( rollupConfig )
				.then( function ( bundle ) {
					// Generate bundle + sourcemap

					bundle.write( {
						dest: 'dist/js/app/app.js',
						format: rollupConfig.targets[0].format,
						sourceMap: true
					} ).then( function ( ) {
						resolve();

					} ).catch( function ( e ) {
						reject( e );
					} );

				} ).catch( function ( e ) {
			reject( e );
		} );
	} );

	return p;
}

// When building for production we want to change some of the plugin options, eg. precompile templates, uglify etc.
// This function allow us to return plugins based on their names, so we can further configure them before running rollup
function findRollupPlugin( name ) {
	for ( let i = 0; i < rollupConfig.plugins.length; i ++ ) {
		let plugin = rollupConfig.plugins[i];
		if ( plugin.name === name ) {
			return plugin;
		}
		return null;
	}
}
```

**Note**: we lookup the plugin  **ractive-compiler**, which is a plugin to *import* and *compile* Ractive templates. We only want to compile Ractive templates in production so we set the plugin *compile* property to true. In development we don't want to compile the templates beforehand, so this option is set to false in [rollup.config.js](#rollup.config.js).

See [rollup-plugin-ractive-compiler](https://www.npmjs.com/package/rollup-plugin-ractive-compiler) for details on the **ractive-compiler** plugin.

Hopefully things aren't too daunting at this stage? That covers our *dev.js* script.

The last piece of the puzzle is the Rollup configuration. Let's cover that next.

### <a id="rollup.config.js"></a>rollup.config.js

Below is our Rollup configuration to bundle our ES6 Modules into an output format that the browser can understand. We will use [iife]() as the output format. We also setup the [Buble]() plugin to convert ES6 syntax (classes, arrow functions) into ES5 syntax.

*Note:* the rollup.config.js script is shared between the production and [development](#dev-setup.md) environments.

```js
var buble = require( 'rollup-plugin-buble' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );

module.exports = {

	 entry: 'src/js/app.js', // app.js bootstraps our application.
                            // app.js is referenced from index.html <script> tag

	plugins: [

		// this plugin allows us to import Ractive templates and optionally compile them
		// for production use. We disable compile by default and switch it back on for
		// production in dist.js
		ractiveCompiler( {
			include: [ '**/*.html' ],

			compile: false,
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
			dest: 'build/js/app/myapp.js', // Rollup output during development, ignored in dist
			format: 'iife',
			 sourceMap: true // NB: generating a SourceMap allows us to debug
                            // our code in the browser in it's original ES6 format.
		}
	]
};

```
Now we have a Node environment setup that transpiles and bundles our ES6 source into an ES5 bundle that we can serve to the browser. Changes to JS will automatically be re-bundled/re-transpiled, including a sourcemap for easy debugging.

This cannot get any better!

### <a id="package.json"></a>package.json
The ```package.json``` below lists all the node modules required to setup a *dev* and *production* environment.

```json
{
  "name": "journeyExmples",
  "description": "Journey examples",
  "version": "0.0.1",
  "main": "build/js/app/app.js",
  "module": "dist/js/app/app.mjs.js",
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
