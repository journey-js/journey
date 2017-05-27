# Development Setup

In this section e will look at setting up a development environment for writing Single Page Applications with ES6 Modules. 

If you would like an overview of Single Page Applications and ES6 Modules see [Overview[(#overview.md).

There are a variety of solutions available such as [Rolleup](), [Webpack](), [Browserify[() etc. Here we will look at Rollup as I've found it the easiest to get started with.

## The Problem
The problem we face is that not all browsers support all ES features, especially ES6 Modules. So when developing with ES6 features such as the new moduling system, browsers won't be able to interpret the new syntax and the code won't be executed.

## The Goal
We are trying to achieve the following development environment.

* write code using ES6 modules and possibly other ES6 language features such as classes and arrow functions.
* refreshing the browser should show the result of the code we just wrote in the step above
* Code should run in all modern browsers, Chrome, Firefo, Safari, IE9 and up

In other words, we want to use ES6 features and they must be just as easy to develop with as if we were using ES5.

## The Solution
We need to convert (transpile) the ES6 features into ES5 features that browsers understand.

We will use [Rollup]() to convert the ES6 Modules into ES5 code. Rollup has a couple output format options available, including [IIFE]() and [AMD](). IIFE is what we will setup here, because it is self contained (it does not need an library like [RequireJS]() to run) but you can use AMD if you want. 

We will  also use RollUp' watcher to automaticaly bundle the source when we make changes to files.

We will also setup a distribution build so we can ship production code when we are need to release. The distribution build minimizes the IIFE and CSS as well as version the files, so when we make updates to our application in the future, the browser is forced to download our new version, instead of serving the old version from it's cache.

## Project structure

Here is the layout we will use for our web app:

```
-- build
-- dist
-- src
    |-- css
    |-- js
         |-- app // our web application
              |-- myapp.js // our application entry point that is referenced 
              			   // from index.html: <script src="js/app/myapp.js">
         |-- lib // Racive, jQuery etc.
    |-- fonts
    |-- images
    index.html
```

## build.js

build.js is our build script that we use to start our development environment and build distributions with. We will setup the minimum
we need to get the job done, not neccessarily best practices.

We have a *src* folder where we will develop our application and a *build* folder where our *src* code is *compiled*  to (or transpiled to if you prefer the term). Our *src* folder should be under source control (git, svn etc).

Our web server must be setup to serve content from our *build* folder. We will show how to setup an Express server later on.

We need a way to keep the *src* and *build* folder in sync, so whenever files are changed in the *src* folder they must be copied to the *build* folder.

First we create a function, **watchAssets** to watch the *src* folder for files that are updated, and copy those files to the *build* folder. When this function is called upon startup, all files will be copied to the *build* folder.




```js
let fsPath = require( 'path' );

// Define variables for src and build folders
const buildFolder = 'build';
const srcFolder = 'src';

// Watch files for changes and copy changed files to the build folder
watchAssets();

// Setup a watcher to copy changed files to the biuld folder
function watchAssets() {

	chokidar.watch( srcFolder + '/**/*', { ignored: [ '' ] } ).on( 'all', ( event, path ) => {

		if ( ! fs.lstatSync( path ).isDirectory() ) {

			writeToDest( path );
		}
	} );
}

// Function to write given path to the build folder
function writeToDest( path ) {

	let srcStr = fsPath.normalize( srcFolder );
	let buildStr = fsPath.normalize( buildFolder );
	let buildPath = path.replace( srcStr, buildStr );

	let buildDir = fsPath.dirname( buildPath );
	
	// Ensure the build folder exists
	fs.makeTreeSync( buildDir );

	var content = fs.readFileSync( path, 'binary' );
	fs.writeFileSync( buildPath, content, 'binary' );
}

```

## package.json

npm i

## rollup.config.js

We use Rollup to bundle our application ES6 Modules into an output format that the browser can understand. We will use [iife]() as the output format.

```js
var buble = require( 'rollup-plugin-buble' );
const pkg = require( './package.json' );

module.exports = {
	entry: 'src/js/app.js', // myApp.js is where we bootstrap our application. app.js will be referenced 
				// from an index.html <script> tag
	plugins: [

		buble( {
			exclude: [ '**/*.html' ],
			transforms: {
				dangerousForOf: true
			}
		} ),
	],
	
	moduleName: 'myApp',

	targets: [
		{
			dest: pkg.module,
			format: 'iife',
			sourceMap: true
		}
	]
};


```

