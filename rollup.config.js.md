# rollup.config.js

Below is the complete rollup.config.js.

```js
var buble = require( 'rollup-plugin-buble' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );
var includePaths = require( 'rollup-plugin-includepaths' );
var pkg = require( './package.json' );

// Set './src/js' as a relative path for imports in modules
// so we can do: import journey from 'lib/mylib.js';
let includePathOptions = {
    paths: [ '../journey/src/js', './src/js', '../../ractive/src' ]
};

module.exports = {
    entry: 'src/js/app/app.js',

    // Ractive.js is loaded as an external library through index.html <script> tag. However
    // we want to import Ractive in our modules with: import Ractive fcrom 'Ractibe.js'.
    // So we inform Rollup that the 'Ractive.js' import is for an external library
	 external: [
		'Ractive.js'
	],

    plugins: [

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
    moduleName: 'journey',

    targets: [
        {
            dest: pkg.main,
            format: 'iife',
            banner: '/* myApp version ' + pkg.version + ' */',
            sourceMap: true
        }
    ]
};
```
