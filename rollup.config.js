//import buble from 'rollup-plugin-buble';
//import string from 'rollup-plugin-string';
var buble = require( 'rollup-plugin-buble' );
var string = require( 'rollup-plugin-string' );

const pkg = require( './package.json' );

module.exports = {
	entry: 'src/js/lib/journey/journey.js',
	plugins: [
		buble(	)
	],
	moduleName: 'journey',
	targets: [
		{
			dest: pkg.main,
			format: 'iife',
			sourceMap: true
		}
		//{ dest: pkg.module, format: 'es' }
	]
};