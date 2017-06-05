# journey

## Table of Contents
- [Setup](#setup)
  - [Setting up a development environment](dev-setup.md)
  - [Create a distribution](dist-setup.md)
- [Usage](#usage)
- [Asynchronous transitions](#async)
- [Full example](#example)
- [beforeenter](#beforeenter)
- [beforeleave](#beforeleave)
- [Handler Order](#order)
- [Navigate Programmatically](#goto)
- [Events](#events)
- [Error](#error)
- [Base Path](#base)
- [Hash](#hash)
- [API](#api)
  - [journey.add](#journey.add)
  - [journey.enter](#journey.handlers)
  - [journey.leave](#journey.handlers)
  - [journey.beforeenter](#journey.handlers)
  - [journey.beforeleave](#journey.handlers)
  - [journey.start](#journey.start)
  - [journey.goto](#journey.goto)

Journey is a client-side Javascript router, used when building Single Page Applications.

If you are new to developing Single Page Applications (SPA) you can read through the [Overview](overview.md) section.

**Note**: To setup a development environment, see the [Development Setup](dev-setup.md) section.

**Note**: To create a production ready distribution, see the [Distribution Setup](dist-setup.md) section.

When developing a Single Page application, we need to display different views depending on certain criteria. The most common way is to use the URL to determine which view to show.

If the url is 'http://host/clients' we show the *Clients.js* view. If the url is 'http://host/producs' we show the *Products.js* view etc.

Journey is a client-side router that performs the mapping between URL paths and views. Technically Journey maps a URL path to a function which is called when the URL matches the mapped path. whether the invoked function displays a view or perform another operation is up to the developer, but in general we will display a view.

This router is based on [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some added features such as a new handler, *beforeleave*, different semantics/behavior for *beforeenter*, routing events through *journey.on(event, callback)* and hash support.

Note: Journey does not support [Nested Routes](). If you need a more sophisticated router checkout [https://github.com/tildeio/router.js/](https://github.com/tildeio/router.js/).

A live demo can be viewed at [https://journey-js.github.io/journey-examples/](https://journey-js.github.io/journey-examples/).

## <a id="setup"></a>Setup
Download a [Journey release](https://github.com/journey-js/journey/releases) and include the file *journey.js* in your application.

To kickstart a project use [Journey Template](TODO) which provides a build environment based on ES6 modules. Also see [Development Setup Guide](dev-setup.md) and [Distribution Setup Guide](dist-setup.md).

## <a id="usage"></a>Basic Usage
Journey has the same API as  [Roadtrip](https://github.com/Rich-Harris/roadtrip) with some extras.

To define a route, we add a mapping between URL path eg. *'/clients'* and a function that is called when the URL matches the mapping.

Let's define a minimal route for our application:

```js
import journey from "journey.js";

journey.add( '/home', {

    enter: function ( route, previousRoute ) {
        // enter() is invoked when the URL becomes http://hostname/home

        // We can perform any custom logic in this method

    }
});
```

In the above example, we defined a route by mapping the path */home* to an object with a *enter* method that is called when the URL changes to *http://hostname/home*.

Let's print some text in the *enter* method.

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

Below we have the same route, but this time we use a UI library, [Ractive]("TODOO"), to render "Hello World!". Journey also provides a "leave" method that is called when navigating to a different route.

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

## <a id="async"></a>Asynchronous route transitions through promises
If we need to perform asynchronous tasks when entering or leaving a route we can return a promise from the method. If a promise is returned from either *enter* or *leave*, Journey will wait until the promise resolves, before calling the next route.

When navigating to a new route, the URL in the address bar changes to that of the new route immediately, but the new route's *enter* handler is not called until the previous route *leave* promise resolves.

For example, we want to perform a transition when leaving the **Client** route. We can return a promise from Client.js *leave* method, perform the transition and resolve the promise. So if the current route is */client* and we navigate to */products,* Journey will wait for the Client.js *leave* promise to resolve before invoking the *enter* method of the Product route.

We can also return a promise from *enter* and Journey will wait for the promise to resolve. If during this period we navigate to a different route, Journey will wait for the promise to resolve, before continuing to new route.

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

## <a id="example"><a/>Example

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

## <a id="beforeenter"></a>beforeenter
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

When navigating to */clients* we fetch the clients and then display the view. In a real world scenario we will likely display a loading indicator while loading the clients. If an error occurs while loading the clients we won't navigate to the Clients view. Instead we can display an error message on the current view to inform the user about the problem. At this stage we should also hide the loading indicator.

The biggest issue with loading data during *enter* is the view doesn't have the data ready to render it's view. For example, say the view renders a list of clients that must be fetched from the server. We *leave* the first view. which unrenders it's content from the DOM, then we *enter* the client view. But at this stage  there is no client data yet, so we display an empty table and start loading the *client* data and display it once it arrives.

If an error occurs while loading the clients, we are left with an empty view.

A more common approach is to load the client data *before* we navigate to the *client* view. In other words we load the data while still on the current view. That way we already have the data when we render the client view. If an error occurs loading the data, we don't navigate to clients, and instead stay put on the current view. The user can then retry to load the clients or continue with another operation on the current view.

This is where  **beforeenter** comes into play. This handler caters for exactly the above scenario. *beforeenter* is called **before** the current route' *leave* method is called.

Similar to the other methods, *beforeenter* can return a promise (it generally will) and Journey will wait until this promise resolves before invoking *leave*. When *leave* completes the next route' *enter* is called.

**Note:** the *beforeenter* behaves differently in Journey that in Roadtrip, which Journey is based on. In Roadtrip *beforeenter* is called at the same time that the current route' *leave* method is called. The next route *enter* is called once both *beforeenter* and *leave* completes. The problem with Roadtrip' version is that the current route *leave* handler will remove the current view. If the next route *beforeenter*  takes a while to load data from the server, the user will be left with a blank screen because the current view *leave* handler has already completed. If an error occurs loading data the user will be stuck with the blank screen.

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

## <a id="beforeleave"></a>beforeleave

The *beforeleave* handler of the current route is called **before**  the route' *leave* handler is called. *beforeleave* is even called **before** the next route' *beforeenter*.

If *beforeleave* returns a promise, Journey will wait for the promise to resolve before calling the next route' *beforeenter*. Only when the next route *beforeenter* completes will the current route'  *leave* method be called. If the *beforeleave* promise rejects, neither the next route' *beforeenter*  nor the current route' *leave* will be called.

If you need to stop navigation away from a route for some reason (user has unsaved changes or UI is in invalid state) this is the handler to perform these types of operations in. By returning a rejected promise the route navigation will effectively be cancelled.

For example:


```js
let product = {

	let isFormDirty = false; // This could be modified when editing the product form

    beforeleave: function(route) {

		if (isFormDirty) {

			// By returning a rejected promise, Journey won't continue with the navigation. This is one way we can force users to save their forms ;-)			
			return Promise.reject("Product view  contains unsaved data. Please save data before continuing.");
		}

		// otherwise we return and continue with the next handler
    }
}
```

## <a id="order"></a>Handler order
With all the handlers (enter, leave, beoreenter, beforeleave) covered hee is a quick summary of the order in which handlers are called:

Upon launching application the order is:

- there is no current route so we continue
- *beforeenter* for the **new** route (Journey will wait if promise is returned before continuing)
- *enter* for the **new** route

When navigating to a new route the order is:
- *beforeleave* for the **current** route (Journey will wait if promise is returned before continuing)
- *beforeenter* for the **new** route (Journey will wait if promise is returned before continuing)
- *leave* for the **current** route (Journey will wait if promise is returned before continuing)
- *enter* for the **new** route


## <a id="goto"></a>Navigate Programmatically

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

## <a id="events"></a>Events
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

## <a id="error"></a>Error
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

## <a id="base"></a>Base path

Often  multiple applications are hosted on a server where each application is mounted on a different *root* or *context path*.

For example:

	http://host/appOne
    http://host/appTwo

HTML5 PushState allows us to route by changing the url paths.

	given the url
	http://host/appOne

    routing to relative route "clients"
    will result in
    http://host/appOne/clients

    routing to an absolute url "/clients" (absolute paths are prefixed with a '/')
   	results in
   	http://host/clients

If our application is hosted on the context path */appOne*, we should not route beyond that path in the url. Otherwise the url will not refer to our application.

In other words the url

	http://host/appOne/clients

links to clients inside the application *appOne*, while

	http://host/clients

links to a different application called *clients*.

In order to function properly in environments hosting multiple applications on the same host, Journey provides a **base** property that can be set in *journey.start( { base: '/appOne'} )*

With our **base** propety set, Journey will automatically prefix all routes with the **base** value. For example:

```js
// given our application is hosted at: http://host/myapp/

// we set the base path to '/myapp'
journey.start({ base: '/myapp' });

journey.goto( '/clients' ); // note: an absolute path

// becomes: http://host/myapp/clients // client automatically prefixed with /myapp
```

Alternatively we can skip the  **base** property and provide the **base** path in our routes instead.

For eample:
```js
// given our application is hosted at: http://host/myapp/

journey.goto( '/myapp/clients' ); // we specify the base path in the route

// becomes: http://host/myapp/clients
```

This approach requires more boilerplate code, however if for some reason we need to specify routes that execute on different applications (eg one route on '/appone', another route on '/apptwo'), this might be the only option avaialable to us.

**Note:** when using hash based urls, you generally don't have to be concerned with this since the hash routing does not change the url paths.

## <a id="hash"></a>Hash based routing
Journey by default uses [HTML5 PushState](TODO) so performing a route change will alter the URL path:

For example, given our application is hosted at:
```
http://host/
```

executing
```js
journey.goto("/clients");
```

changes the URL to:

```
http://host/clients
```

PushState assumes that the server can handle this url. In other words when a user refreshes the browser the url: http://host/clients should still serve up our application. This is generally done on the server by setting up a mapping so that all requests (/*) returns our application *index.html* page content.

Note: REST requests will have a more specific subpath mapped so that Ajax calls can return our data and not the *index.html* content.

An alternative (and simpler approach) to pushState is to use it's older cousin - *hash based routing*.

With hash based routing, only the hash part of the URL is changed. Browsers do not send the hash part of a URL to the server, so the server only has to be configured to handle a single application URL.

For example, given our application is hosted at:
```
http://host/
```

When navigating to #clients, the URL is updated to:

```
http://host/#clients
```

If the user refreshes the browser, the server will receive the URL:
```
http://host/
```

which is still the original URL our server is configured to serve. With *hash based routing* there is no need to configure the server to handle different URLs.

## <a id="api"></a>API
#### <a id="journey.add"></a>journey.add(path, options)


```js
path (string): the path used to match this route to a given URL.

options: {

	enter: function(route, prevRoute, options) {

	},

	leave: function(route, nextRoute, options) {

	},

	beforeenter: function(route, options) {

	},

	update: function(route, options) {

	}
}
```

```js
// example
journey.add( '/clients', { enter: function(route, prevRoute, options) {
	let target = options.target;
	route.view = document.createElement("div");
    route.view.innerHTML = "Hello world";
}});
```

#### <a id="journey.handlers"></a>enter: function(route, prevRoute, options)
#### leave: function(route, nextRoute, options)
#### update: function(route, options)
#### beforeenter: function(route, prevRoute, options)
#### beforeleave: function(route, nextRoute, options)

Note: Arguments below applies to the methods *enter*, *leave*, *beforeenter*, *beforeleave* and *update*.Also note: *route*, *prevRoute* and *nextRoute* are all route objects.

```
route: {

	params(object): any mapped URL parameters as a object of key/value pairs.
	default: {}

	query(object): the URL query string parsed into an object of key/value pairs.
	default: {}

	hash(string): the URL hash value.
	default: ''

	isInitial(boolean): will be true if this is the first route we visit, false otherwise

	scrollX(number): the scrollX position of the view. We can use this value when navigating back to the view
    to restore the scrollbar.
    default: 0

	scrollY(number): the scrollY position of the view. We can use this value when navigating back to the view
    to restore the scrollbar.
    default: 0

	pathname(string): the path used when mapping this route eg. journey.add("/clients", ....);
};

options: {
	target (string): the target provided through journey.start( { target: '#main' } ).
	default: null

	sartOptions(object): copy of the options given to journey.start( options ).
	default: {
    	debug: true,
        target: null
    }
}
```

```js
// example
journey.add( '/clients', { enter: function(route, prevRoute, options) {

	let target = options.target;

    let id = route.query.id; // journey.add('/clients/:id, ...) -> http://host/clients/3

    let priority = route.params.priority; // journey.add('/clents', ...) -> http://host/clients?priority=3

    // Set a view on the route for reference later on
	route.view = document.createElement("div");

}});
```

#### <a id="journey.start"></a>journey.start(options)

```js
options {

	- debug (boolean): whether to log debug statements to the console. default: true

	- target (string): set a default target (element ID or CSS selector) where views should be rendered to. This
    property is passed to 'enter', 'leave' and 'update' methods to be used during view
    construction.
    default: null

	- fallback (string): use this route if no route is found for a given path. default: null

	- base (string): a path that is prefixed to routes. Useful when using HTML5 pushState and where multiple
    applications are hosted on separate "context paths". default: ''

	- useHash (boolean): specify whether the application should use hash based routing (true) or HTML5
    - pushState (false). Note: HTML5 pushState and onpopstate will still be used as the
    history mechanism (if supported by the browser) and not 'onhashchange'.
    default: false

	- useOnHashChange (boolean): if true, forces Journey to use the browser onhashchange event, even if HTML5 pushState is supported. Mostly used for testing purposes.
	default false

    - hash (string): specifies the value of the hash string eg. '#' or '#!'.
    default:  '#'

	- defaultRoute (string): when the application is started and the url contains no route path or hash value
    (eg. http//:host/ or http://host#) set the url to the defaultRoute, in effect loading
    this route if none is provided. This differs from the 'fallback' option which is used
    if a specific route cannot be found.
    default: null
};
```

```js
// example
journey.start({ target: '#main' });
```

#### <a id="journey.goto"></a>journey.goto( path, options )

```js
path (string): the route to navigate to eg. '/clients' or '/clients/1?limit=20'

options : {
	- invisible (boolean): if true, the URL will not be updated when navigating to the specified route.
   	- forceReload (boolean): by default Journey will only perform a route if the URL change eg navigating
to the current route, wont reload the view. forceReload can override this behavior and
force a route to be loaded again, even if the URL does not change.
}
```

```js
// example
journey.goto( '/clients');

// We don't want to update the url
journey.goto( '/product', { invisible: true });
```
