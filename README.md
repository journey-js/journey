# journey
Javascript router.

This router is based on [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some added features such as routing events and hash support.

Note: Journey does not support [Nested Routes](). If you need a more sopysticated router checkout [https://github.com/tildeio/router.js/](https://github.com/tildeio/router.js/).

A live demo can be viewed at [https://journey-js.github.io/journey-examples/](https://journey-js.github.io/journey-examples/).

If you are new to developing Single Page Applications you can read through the [Overview](overview.md) section.

## Setup
Download a [Journey release](https://github.com/journey-js/journey/releases) and include the file *journey.js* in your application.

To kickstart a project use [Journey Template](TODO) which provides a build environment for Journey.

## Basic Usage
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
  
## Asynrcronous route transitions through promises
If we need to perform asynchrounous tasks when entering or leaving a route we can return a promise from the method. If a promise is returned from either *enter* or *leave*, Journey will wait until the promise resolves, before calling the next route.

When navigating to a new route, the URL in the address bar changes to that of the new route immediately, but the new route's *enter* handler is not called until the previous route *leave* promise resolves.

For example, we want to perform a transition when leaving the **Client** route. We can return a promise from Client.js *leave* method, perform the transition and resolve the promise. So if the current route is */client* and we navigate to */products,* Journey will wait for the Client.js *leave* promise to resolve before invoking the *enter* method of the Product route. 

We can also return a promise from *enter* and Journey will wait for the promise to resolve. If during this period we navigate to a different route, Journey will wait for the promise to resolve, befofe continuing to new route.

If we want to have a transition when moving away from a route eg. a fading out effect, we will return a promise from the *leave* method. 

For example:

```js
let async {

    leave: function(route, prevRoute) {
        let promise = view.teardown(); // Assuming teardown returns a promise which resolves once the fade out 
				       // effect is completed.
        return promise;
    }
}
```

Note: it isn't very common to return a promise from the *enter* method.
 
## Example

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

## Beforeenter
Great work so far!

However, in our **Clients.js** script we have hardcoded a list of clients to display. In practice we will most likely load the clients from a server with a database storing the clients.

We will use an Ajax request to load the clients from the server. We could place the Ajax call in the *enter* method. Remember from the previous section we can return a Promise from *enter* and *leave*. Here is an  updated **Clients.js**:

```js
import xhr from "xhr.js";
import Ractive from "Ractive.js";
import template from "./Clients.html";

let Clients = {

    enter: function(route, prevRoute) {
        // Fetch the clients from the service asynchronously. When the promise resolves with the clients, we 
        // create the view for thse clients.
        let promise = xhr.get("/data/clients").then( function( clients ) {

            // We moved the view creation code to it's own method, createView.
            route.view = createView(clients);
        });

        return promise;
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

When navigating to */clients* we fetch the clients and then display the view. In a real world scenario we will likely display a loading indicator while loading the clients. If an error occurs while loading the clients we won't navigate to the Clients view. Instead we can display an merror message on the current view to inform the user about the problem. At this stage we should also hide the loading indicator.

One issue with loading data in the *enter* metehod is that Journey will not invoke enter of the next route until the *leave* method of the previous route completes. So if the previous route returns a promise in *leave* that performs some asynchronous work, the Ajax call in the next route will not start until the previous route completes it's work. Ideally the Ajax call should start the moment we navigate to a new route, regardless if *leave* has work to perform.

Enter the method **beforeenter**. This method caters for exactly the above scenario. *beforeenter* is called immediately after the previous route *leave* method is called, regardless if a promise is returned or not.

Like the other methods, *beforeenter* can return a promise (generally it  will) and Journey will wait until this promise resolves before invoking *enter*.

The data we load in the *beforeenter* method must be passed to *enter* in order to use in our view. We can pass the data as a property on the *route* argument. For example:

```js
let clients = {
    
    beforeenter: function(route) {
        let promise = xhr.get("/data/clients").then( function( clients ) {
        
            promise.then(function(clients) {
                // Assign the clients to a property on the route argument
                // In example we use a property named 'data'.
                route.data = clients;
            });
        });

        return promise;
    }
    
    enter: function(route, prevRoute) {
    
        route.view = createView(route.data);
    }
}
```

## Navigate Programmatically

We can navigate to another route programmatically with the method *journey.goto( path, options );*

For example:
```js
import journey from "journey.js";
...

let clients {

    enter: function(route) {
        route.view = new Ractive({
            el: 'main',
            template: template,
            data: clientData,
            
            showProducts: function() {
                
                // Journey will load the "product" route.
                journey.goto("/product");
            }
        });
  }
}
```

## Events
Journey fires the following events when changing routes:
* **beforeenter** - event fired _before_ the *beforeenter* method is called
* **beforeenterComplete** - event fired *after* the *beforeenter* method is called
* **enter** - event fired *before* the *enter* method is called
* **entered** - event fired *after* the *enter* method is called
* **update** - event fired *before* the *update* method is called
* **updated** - event fired *after* the *update* method is called
* **leave** - event fired *before* the *leave* method is called
* **left** - event fired *after* the *leave* method is called
* * **error** - whenever journey throws an error the "error" event is raised

We can listen to the events through the *journey.on( eventName, callback )* method.

For example:
import journey from "lib/journey.js";
import loadIndicator from "lib/loadIndicator.js";

```js
journey.on("enter", function(event) {
	// event.from 	              : the route we are leaving
    // event.to   	              : the route we are entering
    // event.options              : the same options that was passed to the enter function
    // event.options.startOptions : the options that was passed to journey.start(options);
    
	//When entering a route, let's show  a loading indicator 
	loadIndicator.show();
});

journey.on("entered", function(event) {
	// After we entered we hide the loading indicator
	loadIndicator.hide();
});

```

## Error
Journey raises an *error* event if something goes wrong navigating to a route, wether the error occurs in Journey itself or the route.

Here is an example:

var options = { error: err, event: event, from: from, to: to, route: route };

```js
journey.on("error", function(event) {

	// event.event 	              : the name of the event when the rror occurred eg. "enter", "entered", 
	// 				"leave" etc.
	// event.from 	              : the route we are leaving
	// event.to   	              : the route we are entering
	// event.route   	      : the current route, which is either event.to or event.from depending
	//				on the type of event during which the error occurred
	// event.error		      : the Javascript error object

});
```

## API
#### journey.add(route, options)
	route: string
	options: {
		enter: function() {
        	
        },
        
       leave: function() {
       }
    }

#### journey.start(options)

	journey.start({

		fallback: - use this route if no route is found for a given path. default: null
    
    	base: a path that is added to the url to which all routes are appended. Needed when using HTML pushState on a server where multiple applications are hosted on separate "context paths". Given the url: http://host/, our application could be hosted on the base path"/myapp". Our application will be available at http://host/myapp/.  When routing to for example "/clients", an absolute path, the browser will change the url to http://host/clients. Our application base path (or contextPath) has been removed. So if we refresh the browser at this stage we would end up loading the application mounted at http:host/clients, which is not our app. When using "hash" routing, instead of of pushState, this problem doesn't exist, since the hash does not interfere with the url paths.
        
        By setting the base path option to 'myapp', Journey will ensure all routes will be prefixed with the base path value, so absolute paths in routes won't remove the context path in the url. So routing to '/clients' will become http://host:/myapp/clients. default: ''

		useHash: default: false
	
		useOnHashChange: false,

		hash: '#',
	
		defaultRoute: null
    
});

journey.add(path, options);

journey.add("/clients", {enter() {}};

journey.goto(path, options);

- path "string": the route to navigate to eg "/clients"
- options {
    invisible: true/false,
    forceReload: true/false // We Journey won't reload the current view, but forceReload can override this behavior
}
