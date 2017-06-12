var buble = require( 'rollup-plugin-buble' );
var uglify = require( 'rollup-plugin-uglify' );
var uglifyEs = require ( 'uglify-es' );

//console.log('-=---------------', yglifyEs.minify)

const pkg = require( './package.json' );

module.exports = {
	entry: 'src/js/lib/journey/journey.js',
	plugins: [
		buble(	),
		process.env.mode == "prod" ? uglify( { }, uglifyEs.minify ) : { }
	],
	moduleName: 'journey',
	targets: [
		{
			dest: pkg.main,
			format: 'iife',
			banner: '/* journey version ' + pkg.version + ' */',
			sourceMap: true
		},

		{
			dest: pkg.module,
			banner: '/* journey version ' + pkg.version + ' */',
			format: 'es',
			sourceMap: true
		}
		//{ dest: pkg.module, format: 'es' }
	]
};
