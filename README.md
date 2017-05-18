# journey
Javascript router.

This router is based on [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some added features such as routing events and hash support.

Note: Journey does not support [Nested Routes](). If you need a more sopysticated router checkout [https://github.com/tildeio/router.js/](https://github.com/tildeio/router.js/).

A live demo can be viewed at [https://journey-js.github.io/journey-examples/](https://journey-js.github.io/journey-examples/).

# Introduction

Tirst things first, you are only going to use a Client-side router when building a [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application).

# Developing a Single Page Application (SPA)
If you are new to SPA development here is a quick overview.

When developing a SPA you generally want to split your views into modules, where each module is basically an MVC where View is an HTML template, Controller is a JavaScript file andan optional Model also a JavaScript file. You can generally get away without a Model because of libraries such as [Ractive](TODO), which holds the data and binds the View template to the Conroller.

There  are a couple of technologies to write Modules. The most popular ways right now is [ES6 Modules](TODO) and [AMD](TODO).

ES6 Modules is the standard moduling system that will be implemented in browsers, but currently no browwser supports it yet. Which means in order to code your ES6 Modules, 
