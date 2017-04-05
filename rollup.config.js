//import buble from 'rollup-plugin-buble';
//import string from 'rollup-plugin-string';
var buble = require( 'rollup-plugin-buble' );
var string = require( 'rollup-plugin-string' );

const pkg = require( './package.json' );

module.exports = {
//export default {
	//entry: 'src/test.es.js',
	entry: 'src/js/app/test.js',
	plugins: [
		buble( {
			exclude: [ '**/*.html']
		}),

		string( {
			// Required to be specified
			include: '**/*.html',

			// Undefined by default
			exclude: [ '**/index.html' ]
		} )

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