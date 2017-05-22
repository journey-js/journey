//import buble from 'rollup-plugin-buble';
//import string from 'rollup-plugin-string';
var buble = require( 'rollup-plugin-buble' );
var uglify = require('rollup-plugin-uglify');

const pkg = require( './package.json' );

module.exports = {
	entry: 'src/js/lib/journey/journey.js',
	plugins: [
		buble(	),
		process.env.mode == "prod" ? uglify() : {}
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