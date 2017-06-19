var bestzip = require( 'bestzip' );
var pkg = require( './package.json' );

function zip( ) {
	bestzip( './dist/journey-' + pkg.version + '.zip', [ 'src/', 'test/', 'dist/', 'LICENSE', 'README.md' ], function ( err ) {
		if ( err ) {
			console.error( err.stack );
			process.exit( 1 );
		} else {
			console.log( 'all done!' );
		}
	});
}

zip( );