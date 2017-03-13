define( function ( require ) {
	var Ractive = require( "ractive" );
	var roadtrip = require( "roadtrip" );
	var journey = require( "journey/journey" );


	Ractive.transitions.fade = require( 'ractive-transitions-fade' );

	window.onerror = function ( e ) {
		console.log( "global bug", e );
	}

	var a = Ractive.extend( {
		// The `el` option can be a node, an ID, or a CSS selector.
		el: '#container',

		// We could pass in a string, but for the sake of convenience
		// we're passing the ID of the <script> tag above.
		template: "<div fade-in-out={duration:1500}>blah A</div>",

		// Here, we're passing in some initial data
		data: { name: 'world' },
		test: function ( e ) {
			return false;
		}
	} );

	var b = Ractive.extend( {
		// The `el` option can be a node, an ID, or a CSS selector.
		el: '#container',

		// We could pass in a string, but for the sake of convenience
		// we're passing the ID of the <script> tag above.
		template: '<div fade-in-out={duration:1500}>blah B</div>',

		// Here, we're passing in some initial data
		data: { name: 'world' }
	} );

	var enterA = {
		enter: function ( route, previousRoute ) {
			//throw new Error("enterA");

			// roadtrip captures scroll position on every navigation, 
			// so that you can programmatically scroll to the right
			// part of the page if the user navigates back/forwards
			//window.scrollTo( route.scrollX, route.scrollY );

			route.view = new a( {
				// if this is the first route we visit (i.e. it's the
				// page the user lands on), `route.isInitial === true`
				slideInFrom: route.isInitial ? null : 'left',
				oncomplete: function () {
				}

			} );
		},

		leave: function ( route, nextRoute ) {

			var promise = new Promise( function ( resolve, reject ) {

				var random = Math.random() >= 0.5;
				random = true;
				if ( random ) {
					var orig = route.view.teardown( {
						slideOutTo: 'left'
					} );

					orig.then( function () {
						resolve.apply( this, arguments );
					} ).catch( function ( e ) {
						debugger;
						reject( e );
					} );

				} else {
					console.log("going SERIOUS", random);
					reject( "serious" );
				}
			} );

			return promise;
		}
	};

	//roadtrip
	journey
			// the home screen of our contacts app
			.add( '/a', enterA )
			.add( '/', enterA )
			.add( '/b', {
				beforeenter: function ( route, previousRoute ) {
			//throw new Error("beforeenterB");

					
				},
				
				enter: function ( route, previousRoute ) {
					throw new Error("enterB");

					route.view = new b( {
						// if this is the first route we visit (i.e. it's the
						// page the user lands on), `route.isInitial === true`
						slideInFrom: route.isInitial ? null : 'left'
					} );

					// roadtrip captures scroll position on every navigation,
					// so that you can programmatically scroll to the right
					// part of the page if the user navigates back/forwards
					window.scrollTo( route.scrollX, route.scrollY );
				},

				leave: function ( route, nextRoute ) {
					throw new Error("leaveB");
					
					//throw new Error("moo");
					var promise = route.view.teardown( {
						slideOutTo: 'left'
					} );
					
					var promise = new Promise(function(resolve, reject) {
						reject("sorry");
					});
					
					promise.then(function() {
						debugger;
						console.log("TRHEN")
					}).catch(function(e) {
						debugger;
						console.log(e)
					});
					
					promise.then(function() {
						debugger;
						
					}).catch(function(e) {
						debugger;
						console.log(e)
					});

					return promise;
				}
			} )
			.start( {
				fallback: '/' // if the current URL matches no route, use this one
			} );


} );
