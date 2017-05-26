# Development Setup

In this section e will look at setting up a development environment for writing Single Page Applications with ES6 Modules. 

If you would like an overview of Single Page Applications and ES6 Modules see [Overview[(#overview.md).

There are a variety of solutions available such as [Rolleup](), [Webpack](), [Browserify[() etc. Here we will look at Rollup as I've found it the easiest to get started.

## The Goal
We are trying to achieve the following development environment.

* write code using ES6 modules and possibly other ES6 language features such as classes and arrow functions.
* refreshing the browser should show the result of the code we just wrote in the step above
* Code should run in all modern browsers, Chrome, Firefo, Safari, IE9 and up

In other words, we want to use ES6 features and they must be just as easy to develop with as if we were using ES5.

## The Problem
The problem we face is that not all browsers support all ES features, especially ES6 Modules.

## The Solution
We need to convert (transpile) the ES6 features into ES5 features that browsers understand.

We will use [Rollup]() to convert the ES6 Modules into ES5 code. Rollup has a couple output format options available, including [IIFE]() and [AMD](). IIFE is what we will setup here, because it is self contained (it does not need an library like [RequireJS]() to run) but you can use AMD if you want. 

We will  also use RollUp' watcher to automaticaly bundle the source when we make changes to files.

We will also setup a distribution build so we can ship production code when we are ready. The distribution build essentially minimizes the IIFE and CSS as well as version the files, so when we make updates to our application in the future, the browser is forced to download our new version, instead of serving the old version from it's cache.


