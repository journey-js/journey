# journey
Javascript router.

This router is based on [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some added features such as routing events and hash support.

Note: Journey does not support [Nested Routes](). If you need a more sopysticated router checkout [https://github.com/tildeio/router.js/](https://github.com/tildeio/router.js/).

A live demo can be viewed at [https://journey-js.github.io/journey-examples/](https://journey-js.github.io/journey-examples/).

If you are new to developing Single Page Applications you can read through the [Overview](overview.md) section.

# Setup
Download a [Journey release](https://github.com/journey-js/journey/releases) and include the file *journey.js* in your application.

To kickstart a project use [Journey Template](TODO) which provides a build environment for Journey.

# Basic Usage
Journey has the same API as  [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some extras.

Let's define a minimal route for our application:

```js
import journey from "journey.js";

journey.add( '/home', {

    enter: function ( route, previousRoute ) {
        // enter() is invoked when the URL becomes http://hostname/home

        // Render some text in the body
        document.body.innerHTML = "Hello World!" // Print Hello in the body

        // Practically speaking we will offload the DOM rendering to a View Library such as Ractive.js, Vue.js etc.
    }
});
```

In the snippet above we map the url '/home' to a function, 'enter', that is invoked when the URL becomes http://hostname/home.

Inside the 'enter' method we then render a view (just a string "Hello World!") in the browser.

Below we use Ractive to render "Hello World!". Journey also provides the "leave" method which is called when navigating to a different route.

```js
import journey from "journey.js";
import Home from "Home.js";

journey.add( '/home', {

    enter: function ( route, previousRoute ) {
    
        // We add a view property on the route object and assign it to our newly created view.
        // In the "leave" method we can reference the route.view object to remove it from the DOM.
        route.view = new Home({                  
            target: 'body',
            template: 'Hello World!'
        });
    }),
    
    leave: function(route, nextRoute) {
        // Remove the view
        route.view.teardown();
    }
    ```
# Example

With a basic understanding of Journey under our belts, let's look at a more practical example where we display a list of clients.

We need a base HTML page to hold a menu at the top and a container where we render our views. Below is *base.html*

```html
<html>
    <body>
    
    <nav> Menus goes here </nav>    
    
    <main> Views are rendered here </main>

    </body>
</html>
```

First we create a template that iterates over the a list of clients and render each client as a row in a table.

```html

```

# Beforeenter

# Goto

# Events

# Error

# Options
