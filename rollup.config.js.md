# rollup.config.js

Below is the complete rollup.config.js.

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
    entry: 'src/js/app/app.js',

    // Ractive.js is loaded as an external library through index.html <script> tag. However
    // we want to import Ractive in our modules with: import Ractive fcrom 'Ractive.js'.
    // So we inform Rollup that the 'Ractive.js' import is for an external library
	 external: [
		'Ractive.js'
	],

    plugins: [
        // Setup relative paths for module imports
        includePaths( includePathOptions ),

        ractiveCompiler( {
            include: [ '**/*.html' ],

            compile: false
        } ),

        stringToModule({
            include: '**/*.text.html'
        }),

        buble( {
            exclude: [ '**/*.html' ],
            transforms: {
                dangerousForOf: true
            }
        } ),

        includePaths( includePathOptions )
    ],
    moduleName: 'myTemplate',

    targets: [
        {
            format: 'iife',
            banner: '/* myApp version ' + pkg.version + ' */',
            sourceMap: true
        }
    ]
};
```
