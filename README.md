# journey
Javascript router.

This router is based on [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some added features such as routing events and hash support.

Note: Journey does not support [Nested Routes](). If you need a more sopysticated router checkout [https://github.com/tildeio/router.js/](https://github.com/tildeio/router.js/).

A live demo can be viewed at [https://journey-js.github.io/journey-examples/](https://journey-js.github.io/journey-examples/).

# Introduction

Tirst things first, you are only going to use a Client-side router when building a [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application).

# Developing a Single Page Application (SPA)
If you are new to SPA development here is a quick overview.

Nowadays there are multiple ways to construct SPA, but the oldest, andarguably most popular, is the MVC (Model, View, Controller) pattern. To implement this pattern we split code into separate files, the View file is an HTMLfile for the template, a Controller which we place in a JavaScript file and an optional Model which is also in a JavaScript file. You can generally get away without a Model because of libraries such as [Ractive](TODO), which holds the data (Model) and binds the View template to the Conroller.

To load these separate files into a functional unit we need a moduling system.

There  are a couple of technologies to write Modules with. The most popular ways right now is [ES6 Modules](TODO) and [AMD](TODO).

# ES6 Modules

ES6 Modules is the standard moduling system that will be implemented in browsers, but currently no browwser supports it yet. Which means in order to run our ES6 Modules in a browser, we have to convert it into code the browser can understand. We use Module Bundlers to perform this task. [Rollup](TODO) and [WebPack](TODO) are common bundlers that converts all our ES6 Modules into ES5 code that the browser can understand.

That means we will have a "source" folder where we make changes to our code and a "build" folder where the bundler will output our ES5 code.

While coding our web app, we need to constantly test our code, but since we are using ES6 Modules, we cannot simply refresh the browser and see the changes without bundling the code first.  Fortunately WebPack and Rollup supports file watches that monitors changes to files. When a change is made to a file, the bundler will fire and create a new bundle to test with in the build folder.

Bundlers support various output formats, including [IIFE]() and [AMD](). The bundler can also compress and obfuscate the output. This is great for production environments where smaller files is quicker to transfer over the network and load in the browser. 

However, when developing, especially when we debug in the browser, we want to view the source code as we edited it, not a single bundle containing all our code, especially if that code is compressed or obfuscated.

That is where source maps come in. Bundlers have options to generate a source map in addition to the bundle. When our bundle is loaded by the browser, the source map (if present) is also loaded, and provides the browser with a map of how to translate the bundle back ot it's original ES6 source code. So when we debug our code, it looks exactly like the code we edited.

But what about our CSS, images and other artifacts we use to build our web app with? Bundlers whoule be able to take care of this for us as well. But if not there is not we can always fallback to [Chokidar](TODO) a [Node](TODO) based file monitor. Chokidar can be setup to monitor css, image and other files in the web app and when a change is made, copy the file over to the build folder.

# AMD
AMD is a popular moduling system to load Javascript or HTML files. That great thing about AMD is we don't need an intermediate build/transpilaton step. We can simply start coding and refresh the browser to view the changes.

However, AMD is not a standard and once ES6 Modules is implemented in browsers, we will likely have to convert our code base from AMD to ES6 Modules. There are automated ways to convert AMD to ES6 though.

Because ES6 Modules is the standard and easy to write and understand, we will use ES6 Modules for our examples. The [journey-examples](TODO) also uses ES6 Modules, with the Buble transpiler.

[Rollup](Rollup) is another useful library we can use when developing with ES6 Modules. Rollup will take all our ES6 Module files and merge them into a single file that the browser can load. has a built in file watcher

Besides ES6 Modules, there are other ES6 features we might want to take advantage of, such as Classes and arrow functions. To use these features we also need to convert them into ES5 code. We call this conversion process [transpiling](TODO). [Babel](TODO) is the most common and feature rich transpiler. Another simpler transpiler is [[Buble](TODO).
