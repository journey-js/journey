# Distribution Setup

## Table of Contents
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

<!-- If we want to use external libraries such as jQuery/Ractive and load them from our localhost in DEV and CDN in PROD,
we can place them in comments as shown below. In our dist.js script we will create a function to comment the
local jQuery/Ractive scripts and uncomment the CDN scripts. We can place as many external libraries in the comments
as we like. -->

	<!-- start DEV imports -->
	<script src="js/lib/jquery-3.2.1.js"></script>
	<script src="js/lib/polyfills.js"></script>
    	<script src="js/lib/ractive.js"></script>
    <!-- end DEV imports -->

    <!-- start PROD imports
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/polyfills.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/runtime.min.js"></script>
end PROD imports -->

    <script src="js/app/app.js" defer nomodule></script> <!-- Entry point to our app -->

</html>
```

We will start with our *index.html* which serves up our application. The entry point to our SPA is: ``` <script src="js/app/app.js">```.

We also use external libraries, jQuery and Ractive. The surrounding comments of our external libraries is important.
When we develop our application, we want to load the jQuery and Ractive libs from our local server. But in production
we wan to serve them from CDN, so that we can independently upgrade our application or external libraries without having
to re-download the other.

We wrap our DEV libraries with the comment:

```html
 <!-- start DEV imports -->
	<script src="lib/jquery3.2.1.js"></script>
	<script src="js/lib/polyfills.js"></script>
    	<script src="js/lib/ractive.js"></script>
 <!-- end DEV imports -->
```

Then we comment our PROD libraries with:

```html
<!-- start PROD imports
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/polyfills.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/runtime.min.js"></script>
end PROD imports -->
```

We will add a function to *dist.js* called **uncommentCDN**, which replaces the HTML comments as follows:

```html
 <!-- start DEV imports
	<script src="lib/jquery3.2.1.js"></script>
	<script src="js/lib/polyfills.js"></script>
    	<script src="js/lib/ractive.js"></script>
end DEV imports -->

<!-- start PROD imports -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/polyfills.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/runtime.min.js"></script>
<!-- end PROD imports -->
```

Our jQuery script that was served from our local server in development, will be served from a CDN in production. Neat right?

## <a id="dist.js"></a>dist.js
We will use two separate build scripts for our project, one to start a development environment, *dev.js*, and one to create a distribution with, *dist.js*. You can combine these two scripts into one if you like.

*dist.js* is the script we use to create a production ready distribution of our application.

You can find the complete *dist.js* source [here](dist.js.md).

Our project structure has a *src* folder where we will develop our application and a *dist* folder where our distribution will be written to.

We structure *dist.js* into sections (JS functions) that match our [Goals](#goal). The functions will return a promise so we don't have to worry about which section performs asynchronous work.  

First we create a **start** function that assembles all the various sections into a distribution. Once we have **start** defined we will add the different sections to our script.

```js
var rollup = require( 'rollup' );
var buble = require( 'rollup-plugin-buble' );
var rollupConfig = require( './rollup.config.js' );
var path = require( 'path' );
var uglify = require( 'rollup-plugin-uglify' );
var CleanCSS = require( 'clean-css' );
var fs = require( 'fs-extra' );
var replaceInFile = require( 'replace-in-file' );
var versioning = require( 'node-version-assets' );
var jetpack = require('fs-jetpack');
var pkg = require( './package.json' );

// Define variables for src and distribution folders
const distFolder = 'dist';
const srcFolder = 'src';

// Starts the distribution
start();

// The distribution is handled in the start function(). The process is broken
// into logical sections (functions) all of which returns a promise.
function start() {

    clean()    	               // remove the previous distribution
        .then( copyAssets )    // copy assets from 'src' to 'dist' folder
        .then( compileJS )     // compile/bundle/uglify the JS from 'src' to 'dist' folder
        .then( compileCss )    // bundle/minimize the CSS from 'src' to 'dist' folder
        .then( uncommentCDN )  // serve libraries from CDN in production
        .then( versionAssets ) // version assets to ensure browser won't cache old
                               // assets when making new releases.
        .catch( ( e ) => {      // catch any error and log to console
            console.log( e );
        } );
}
```

We can already see how all the sections fit together to form a distribution. Next we start adding the individual sections.

Below we show the **clean()** function to remove the previous distribution:

```js
function clean() {
    fs.removeSync( distFolder );
    return Promise.resolve(); // This function is synchronous so we return a resolved promise
}
```

Next up is **copyAssets()** which copies assets ( images/index.html but not CSS or JS files) from *src* to the *dist* folder:
```js
function copyAssets( ) {
    
    // Copy src to dist but exclude *.css and *.js files
    jetpack.copy(srcFolder, distFolder, { matching: [ '!**/*.css', '!**/*.js' ] });
    
    return Promise.resolve(); // This function is synchronous so we return a resolved promise
}
```

Below is **compileJS()** which transforms ES6 into ES5 and bundles ES6 modules into IIFE format.

**Note**: *dist.js* share the same **rollup.config.js** file that is used in *dev.js*. Because of that we will modify 'rollup.config.js' when building a distribution, for example *minimize* Javascript and *compiling* templates.

```js
// Setup Rollup to transpile and bundle our ES6 JS into ES5 JS.
function compileJS( ) {
    let p = new Promise( function ( resolve, reject ) {

        // Note that findRollupPlugin looks up a Rollup plugin with the same name in order
        // for us to further configure the plugin before running the production build.
        let ractiveCompiler = findRollupPlugin( "ractive-compiler" );

        ractiveCompiler.compile = true; // We want to precompile Ractive templates

        rollupConfig.plugins.push( uglify( ) ); // Add uglify plugin to minimize JS

        rollup.rollup( rollupConfig )
            .then( function ( bundle ) {
                // Generate bundle + sourcemap

                bundle.write( {
                    dest: distFolder + '/js/app/app.js', // Output file
                    format: rollupConfig.targets[0].format, // output format IIFE, CJS etc.
		    banner: '/* myApp version ' + pkg.version + ' */',
                    sourceMap: true // Yes we want a sourcemap

                } ).then( function ( ) {
                    // JS compilation step completed, so we continue to the next section.
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
```

First we modify the rollConfig object for a production build by switching on the *compile* property for templates and adding the *uglify()* plugin to minimize our Javascript. *uglify* is a node module that will *minimize* the JS code.

Then we pass the rollupConfig instance to rollup to bundle the our JS to 'dist/js/app/app.js'. We also set  the output format to the format specified in rollupConfig and that a sourcemap be generated.

**Note**: we lookup the plugin  **ractive-compiler**, which is a plugin to *import* and *compile* Ractive templates. We only want to compile Ractive templates in production so we set the plugin *compile* property to true. In development we don't want to compile the templates beforehand, so this option is defaulted to false in [rollup.config.js](#rollup.config.js).

See [rollup-plugin-ractive-compiler](https://www.npmjs.com/package/rollup-plugin-ractive-compiler) for details on the **ractive-compiler** plugin.

Here is the function to find the Rollup plugin:

```js
// When building for production we want to change some of the plugin options, eg. precompile
// templates,  uglify etc. This function allow us to return plugins based on their names,
// so we can further configure them before running Rollup
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

Time to look at **compileCss**:

```js
// Bundle and minimize the CSS to the distribution folder
function compileCss( ) {

    let source = path.join( srcFolder, 'css', 'site.css' );

    // We use cleanCSS node module to bundle and minimize the CSS
    let result = new CleanCSS( { rebaseTo: path.join( srcFolder, 'css' ) } ).minify( [ source ] );

    let compiledCss = result.styles;

    let cssFolder = path.join( distFolder, 'css' );
    fs.ensureDirSync( cssFolder );

    let target = path.join( cssFolder, 'site.css' );
    fs.writeFileSync( target, compiledCss, 'utf-8' );
    return Promise.resolve();
}
```

We use the node module *cleanCSS* to bundle and minimize our CSS. We pass our main CSS file, *src/css/site.css*, to *cleanCSS* which bundles all the css files referenced through *@import* statements into a single file, minimizes the bundle and writes the output to  *dist/css/site.css*.

Simple enough.

Below we will cover **uncommentCDN** which allows us to load third-party libraries from our local server during development and [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) networks in production.

As the name suggests *uncommentCDN* is a simple *find/replace* utility to add/remove comments in our *index.html* file.

Recall from [index.html](#index.html) we had these comments:
```html
<!-- start DEV imports -->
<script src="js/lib/jquery-3.2.1.js"></script>
<script src="js/lib/polyfills.js"></script>
<script src="js/lib/ractive.js"></script>
<!-- end DEV imports -->

<!-- start PROD imports
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/polyfills.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/runtime.min.js"></script>
end PROD imports -->
```

We can see above that *jquery-3.2.1* is loaded from the local folder *js/lib* during development. In production we want to serve jquery from the CDN *https://ajax.googleapis.com/...*.

To do that **uncommentCDN** replaces the comments

''``` <!-- start DEV imports -->```
with
 ``` <!-- start DEV imports```

 and

  ``` <!-- end DEV imports-->```
   with
    ``` end DEV imports -->```

which effectively comments out the jQuery script:

```html
<!-- start DEV imports
<script src="js/lib/jquery-3.2.1.js"></script>
<script src="js/lib/polyfills.js"></script>
    <script src="js/lib/ractive.js"></script>
end DEV imports -->
```

Similarly it replaces the comments

```<!-- start PROD imports```
with
```<!-- start PROD imports --> ```

and
```end PROD imports -->```
with
```<!-- end PROD imports -->```

which gives us the uncommented CDN script:
```html
<!-- start PROD imports-->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/polyfills.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ractive@0.9.0/runtime.min.js"></script>
<!-- end PROD imports -->
```

We can add as many third-party libraries inside the DEV/PROD scripts as we like and they will be served from CDN in production.

Below is **uncommentCDN**:

```js
// Replace comments in index.html so that external libraries are served from CDN
function uncommentCDN( ) {

    // Set path to dist/index.html where replaceInFile module must find and replace strings.
    // replaceInFile will update the file in place, hence we refer to index.html in 'dist'
    // instead of 'src'.
    let pathToHtml = path.join( distFolder, 'index.html' );

    let options = {

        files: pathToHtml,

        from: [
            /<!-- start PROD imports/g, // 1
            /end PROD imports -->/g, // 2
            /<!-- start DEV imports -->/g, // 3
            /<!-- end DEV imports -->/g ], // 4

        to: [
            '<!-- start PROD imports -->', // 1
            '<!-- end PROD imports -->', // 2
            '<!-- start DEV imports', // 3
            'end DEV imports -->'          // 4
        ]
    };

    try {
        replaceInFile.sync( options );
        console.log( 'Updated CDN path for ', pathToHtml );

    } catch ( error ) {
        console.error( 'Error occurred while updating CDN path for ', pathToHtml, error );
        return Promise.reject( error );
    }

    return Promise.resolve();
}
```

Finally we need a way to version our JS and CSS files. By versioning our files we ensure that when we perform updates to our software the browser won't cache and serve previous versions of the files.

Versioninig is performed by renaming the CSS and JS files and updating their references in *index.html*.

For example given a Javascript file, *js/myapp.js*, and *index.html*:

```html
<script src="js/myapp.js"></script>
```
we can version the JS by taking an MD5 hash of the content of *js/myapp.js*, append the hash value to the filename and finally update *index.html* to point to the new filename.

So if the content of *js/myapp.js* hashes to the value: *5703e47c6c8e57392591be0dbbae506c*, we rename:
 ```js/myapp.js```
 to:
 ```js/myapp.5703e47c6c8e57392591be0dbbae506c.js```

and update *index.html* as follows:

```html
<script src="js/myapp.5703e47c6c8e57392591be0dbbae506c.js"></script>
```

We version our assets with the function **versionAssets**:

```js
// Version the JS and CSS so that future updates won't be cached by browser
function versionAssets( ) {

    let htmlPath = path.join( distFolder, 'index.html' );

    let version = new versioning( {

        assets: [
            distFolder + '/css/site.css',
            distFolder + '/js/app/app.js'
        ],

        grepFiles: [ htmlPath ]
    } );

    let promise = new Promise( function ( resolve, reject ) {

        version.run( function () {
            resolve();
        } );
    } );

    return promise;
}
```

That covers our *dist.js* script. Hopefully not too daunting?

**Note:** you can also use Webpack/Grunt/Gulp/somethingElse to develop and create a distribution with.

The last piece of the puzzle is the Rollup configuration. Let's cover that next.

### <a id="rollup.config.js"></a>rollup.config.js

Below is our Rollup configuration to bundle our ES6 Modules into an output format that the browser can understand. We will use [iife]() as the output format. We also setup the [Buble]() plugin to convert ES6 syntax (classes, arrow functions) into ES5 syntax.

*Note:* the rollup.config.js script is shared between the production and [development](#dev-setup.md) environments.

```js
var buble = require( 'rollup-plugin-buble' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );
var includePaths = require( 'rollup-plugin-includepaths' );
var pkg = require( './package.json' );

// Set './src/js' as a relative path for imports in modules so we can do: 
// import myLib from 'lib/myLib.js' 
// where 'src/js/lib/myLib.js' is a valid entry
let includePathOptions = {
    paths: [ './src/js' ]
};

module.exports = {

    entry: 'src/js/app.js', // app.js is referenced from index.html <script> tag

    // Ractive.js is loaded as an external library through index.html <script> tag. However
    // we want to import Ractive in our modules with: import Ractive fcrom 'Ractive.js'.
    // So we inform Rollup that the 'Ractive.js' import is for an external library
    external: [
        'Ractive.js'
    ],

    plugins: [
        // Setup relative paths for module imports
        includePaths( includePathOptions ),

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
            format: 'iife',
            banner: '/* myApp version ' + pkg.version + ' */',
            sourceMap: true // NB: generating a SourceMap allows us to debug
                            // our code in the browser in it's original ES6 format.
        }
    ]
};
```
Now we have a Node based build system to create a production ready distribution of our application. Our JS and CSS is bundled and transpiled from ES6 to ES5, minimized so that our application can transfer over the network as quickly as possible and versioned so future releases won't have browsers serve up files from previous versions.

This cannot get any better!

### <a id="package.json"></a>package.json
The ```package.json``` below lists all the node modules required to setup a *dev* and *production* environment.

```json
{
  "name": "myApp",
  "description": "My Application",
  "version": "0.0.1",
  "main": "build/js/app/app.js",
  "module": "dist/js/app/app.mjs.js",
  "devDependencies": {
    "chokidar": "1.6.1",
    "clean-css": "4.1.2",
    "express": "4.13.3",
    "fs-extra": "3.0.1",
    "fs-jetpack": "^1.0.0",
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
    "rollup-plugin-uglify": "2.0.1",
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
