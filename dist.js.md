# dist.js

Below is the complete **dist.js**.

```js
var rollup = require( 'rollup' );
var buble = require( 'rollup-plugin-buble' );
var rollupConfig = require( './rollup.config.js' );
var path = require( 'path' );
var uglify = require( 'rollup-plugin-uglify' );
var CleanCSS = require( 'clean-css' );
var fs = require( 'fs-extra' );
var glob = require( 'glob' );
var replaceInFile = require( 'replace-in-file' );
var versioning = require( 'node-version-assets' );

// Set source/build folders
const distFolder = 'dist';
const srcFolder = 'src';

// start() drives all the logic
function start( ) {

    clean();

    copyAssets();

    compileJS( ).    
        then( compileCss ).
        then( uncommentCDN ).
        then( versionAssets ).
        catch( ( e ) => {
            console.log( e );
        } );
}

// Remove the previous distribution folder
function clean() {
    fs.removeSync( distFolder );

    // Ensure the build folder exists
    fs.ensureDirSync( distFolder );
}

// Copy all the assets to the distribution folder
function copyAssets( ) {
    fs.copySync( srcFolder, distFolder );
}

// When building for production we want to change some of the plugin options, eg. precompile
// templates, uglify etc. This function allow us to return plugins based on their names, so
// we can futher configure them before running rollup
function findPlugin( name ) {

    for ( let i = 0; i < rollupConfig.plugins.length; i ++ ) {

        let plugin = rollupConfig.plugins[i];
        if ( plugin.name === name ) {
            return plugin;
        }

        return null;
	}
}

// Compile, bundle and uglify the JS to the distribution folder
function compileJS( ) {

	let p = new Promise( function ( resolve, reject ) {

        let ractiveCompiler = findPlugin( 'ractive-compiler' );
        ractiveCompiler.compile = true;
        rollupConfig.plugins.push( uglify( ) );

        rollup.rollup( rollupConfig ).then( function ( bundle ) {

            // Generate bundle + sourcemap
            bundle.write( {

                dest: distFolder + '/js/app/app.js',
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

// Bundle and uglify the CSS to the dsitrbution folder
function compileCss( ) {    
	let source = path.join( srcFolder, 'css', 'site.css' );
	let result = new CleanCSS( { rebaseTo: path.join( srcFolder, 'css' ) } ).minify( [ source ] );

	let compiledCss = result.styles;

	let cssFolder = path.join( distFolder, 'css' );
	fs.ensureDirSync( cssFolder );

	let target = path.join( cssFolder, 'site.css' );
	fs.writeFileSync( target, compiledCss, 'utf-8' );
	return Promise.resolve();
}

// Replace comments in index.html so that external libraries are served from CDN
function uncommentCDN( ) {

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

// Version the JS and CSS so that future updates won't be cached by browser
function versionAssets( ) {

    let htmlPath = path.join( distFolder, 'index.html' );

    var version = new versioning( {
        assets: [ distFolder + '/css/site.css', distFolder + '/js/app/app.js' ],
        grepFiles: [ htmlPath ]
    } );

    var promise = new Promise( function ( resolve, reject ) {

        version.run( function () {
            resolve();
        } );
    } );

    return promise;
}

// Start the distribution
start( );
```
