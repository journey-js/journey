var rollup = require( 'rollup' );
var buble = require( 'rollup-plugin-buble' );
var rollupConfig = require( './rollup.config.js' );
var bestzip = require( 'bestzip' );
var pkg = require( './package.json' );
var fs = require( 'fs-extra' );

// Define variables for src and distribution folders
const distDir = 'dist';
const releaseDir = 'release';

function dist() {

	clean();

	compileJs().then( () => {
		console.log( 'JS compiled successfully!' );
		
		if (process.env.mode == "prod") {
			zip();
		} else {
			console.log( 'all done!' );
		}

	} ).catch( ( err ) => {
		console.error( err );
	} );
}

function clean() {
	fs.removeSync( distDir );
	
	if (process.env.mode == "prod") {
		fs.removeSync(releaseDir);
		fs.mkdirSync(releaseDir);
	}
	return Promise.resolve(); // This function is synchronous so we return a resolved promise
}

function compileJs() {
	let promise = new Promise( function ( resolve, reject ) {

		rollup.rollup( rollupConfig )

				.then( function ( bundle ) {

					Promise.all( [
						bundle.write( rollupConfig.targets[0] ),
						bundle.write( rollupConfig.targets[1] ) ] )

							.then( function () {
								resolve();
							} ).catch( reject );
				} ).catch( reject );
	} );

	return promise;
}


function zip() {
	bestzip( releaseDir + '/journey-' + pkg.version + '.zip', [ 'src/', 'test/', 'dist/', 'LICENSE', 'README.md', 'package.json', 'rollup.config.js', 'build.js' ], function ( err ) {
		if ( err ) {
			console.error( err.stack );
			process.exit( 1 );
		} else {
			console.log( 'all done!' );
		}
	} );
}

dist();