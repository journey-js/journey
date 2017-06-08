# rollup.config.js

Below is the complete rollup.config.js.

```js
var buble = require( 'rollup-plugin-buble' );
var replacePathComment = require( './rollup-plugin-replacetPath' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );
var includePaths = require( 'rollup-plugin-includepaths' );

const pkg = require( './package.json' );

let includePathOptions = {
    include: { },
    paths: [ '../journey/src/js', './src/js', '../../ractive/src' ],
    external: [ ],
    extensions: [ '.js', '.json', '.html' ]
};

module.exports = {
    entry: 'src/js/app/start.js',
    plugins: [

        ractiveCompiler( {
            include: [ '**/*.html' ],

            compile: false,
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

        replacePathComment( {
            include: '**/*.js'
        } ),

        includePaths( includePathOptions )
    ],
    moduleName: 'journey',

    targets: [
        {
            dest: pkg.main,
            format: 'iife',
            sourceMap: true
        }
    ]
};
```
