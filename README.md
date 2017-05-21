# journey
Javascript router.

This router is based on [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some added features such as routing events and hash support.

Note: Journey does not support [Nested Routes](). If you need a more sopysticated router checkout [https://github.com/tildeio/router.js/](https://github.com/tildeio/router.js/).

A live demo can be viewed at [https://journey-js.github.io/journey-examples/](https://journey-js.github.io/journey-examples/).

If you are new to developing Single Page Applications you can read through the [Overview](overview.md) section.

### Setup
Download a [Journey release](https://github.com/journey-js/journey/releases) and include the file *journey.js* in your application.

To kickstart a project use [Journey Template](TODO) which provides a build environment for Journey.

### Basic Usage
Journey has the same API as  [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some extras.

Let's define a minimal route for our application:

```js
import journey from "journey.js";

journey.add( '/home', {

    enter: function ( route, previousRoute ) {
        // enter() is invoked when the URL becomes http://hostname/home

        // Render some text in the body
        document.body.innerHTML = "Hello World!" // Print Hello in the body

        // Practically speaking we will offload the DOM rendering to a View Library such as Ractive, Vue etc.
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
 
### Example

With a basic understanding of Journey under our belts, let's look at a more practical example where we display a list of clients.

We need a base HTML page to hold a menu at the top and a container where we render our views. Below is *base.html*

```html
<html>
<head>
    <script src="start.js"></script>
</head>
    <body>
    
        <nav> Menus goes here </nav>
    
        <main> Views are rendered here </main>

    </body>
</html>
```

Our base page referes to a script **start.js** which is the startup script for our web application. **start.js** is defined further below.

**Note:** This example below is based very loosely on the [MVC](TODO) UI pattern where *View* is represented by an HTML template, *Controller* is a Javascript file and *Model* is the Client data.

For our client page, we create a template that iterates over the a list of clients and render each client as a row in a table. Below is our **View**, *Clients.html* template. Here we use Ractive' mustache based templates:

```html
<table>
    <tr>
        <th>Name</th>
        <th>Date of birth</th>
        <th>Telephone</th>
    </tr>
    {{#clients}}
    <tr>
        <td>{{name}}</td>
        <td>{{date}}</td>
        <td>{{telephone}}</td>
    </tr>
{{/}}
</table>
```

Next is the** Controller**, *Clients.js*, that provides an *enter* method:

```js
import Ractive from "Ractive.js";
import template from "./Clients.html";

let Clients = {
    
    enter: function(route, prevRoute) {
        route.view = new Ractive({

            el: 'main',
            template: template,
            data: clientData
        });
    }
}

// Dummy client data

let clientData = [
    {
        name: "Steve", 
        date: "11990-01-01",
        telephone: 08601102321
     },{
        name: "Steve", 
        date: "11990-01-01",
        telephone: 08601102321
    },{
        name: "Steve", 
        date: "11990-01-01",
        telephone: 08601102321}
    ]

return default Clients;
```

We don't need to implement a *leave* method to remove the Client view, because Ractive, by default, tears down existing nodes when it renders a new view.

With our Client view implemented we can register a new route for a our application. We will place all our route mapping in a central file called *routes.js*:

```js
import journey from "lib/journey.js";
import Clients from "views/Client.js";

journey.add("/clients", Clients); // Map clients path tothe  Clients view
// As more routesare developed, they will be added in this script
```

With our Client view and routes implemented, we need to wire everything togetther into a *startup* script which we will call *start.js*.
Recall in *base.mtml* we specified the script <script src="start.js"></script>? Here is *start.js*:

```js
import journey from "journey.js";
import Clients from "views/Clients.js";
import "./routes.js"; // We don't need to reference routes anywhere, so we simply import the module

journey.start( {
} );

```

Navigating to the url: *http:localhost/clients will load our route

### asynrcronous route transitions through promises
    

### Beforeenter
Great work so far!

However, in our **Clients.js** script we have hardcoded a list of clients to display. In practice we will most likely load the clients from a server with a database storing the clients.

We will use an Ajax request to load the clients from the server. We could place the Ajax call in the *enter* method. Here is an  updated **Clients.js**:

```js
import xhr from "xhr.js";
import Ractive from "Ractive.js";
import template from "./Clients.html";

let Clients = {

    enter: function(route, prevRoute) {
        // Fetch the clients from the service asynchronously. When the promise resolves with the clients, we 
        // create the view for thse clients.
        xhr.get("/data/clients").then( function( clients ) {

            // We moved the view creation code to it's own method, createView.
            route.view = createView(clients);
        });
    }
}

function createView( clients ) {
    let view = new Ractive({
        el: 'main',
        template: template,
        data: clients
    });
    
    return view;
}
```

### Goto

### Events

### Error

### Options
