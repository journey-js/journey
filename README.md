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
        document.body.innerHTML = "Hello" // Print Hello in the body

        // Practically speaking we will offload the DOM rendering to a View Library such as Ractive.js, Vue.js etc.
    }
});
```

In the snippet above we map the url '/home' to a function, 'enter', that is invoked when the URL becomes http://hostname/home.

Inside the 'enter' method we can then render a view in the browser.

In the sample below we will use Ractive to render the view.

```js
import journey from "journey.js";
import HomeView from "HomeView.js";

journey.add( '/home', {

    enter: function ( route, previousRoute ) {
    
        route.view = new HomeView({                  
            target: '#main',
            template: 'Hello World!'
        });
    })
    ```
    
