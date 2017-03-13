define( function ( require ) {
	var Router = require( "router" );
	var ractive = require( "ractive" );
	var RouteRecognizer = require( "route-recognizer" );
	var router = new RouteRecognizer["default"]();

	var router = new Router["default"]();

	router.map( function ( match ) {
		match( "/posts/:id" ).to( "posts", function ( match ) {
			match( "/a" ).to( "postIndex" ),
			match( "/:id?query" ).to( "showPost" );
		} );
	} );
	
	var res = {x: 1};

	var myHandlers = { };
	myHandlers.posts = {
		model: function (params) {
			console.log("posts.model");
			  return {id: 1};
			  //return res;
		},
		setup: function () {
			console.log("posts.setup");
		},
		serialize: function () {
			console.log("posts.serialize");
		},
	};
	myHandlers.postIndex = {
		model: function () {
			console.log("postIndex.model");
		},
		serialize: function () {
			console.log("postIndex.serialize");
		},
		setup: function () {
			console.log("postIndex.setup");
		}
	};

	myHandlers.showPost = {
		model: function ( params ) {
			console.log( "showPost model", params );
			return { a: params };
		},

		setup: function ( post ) {
			console.log( "showPost setup", post );
		},

		serialize: function ( post ) {
			console.log( "showPost serialise", post );
			return { id: 4 };
		}

	};


	router.getHandler = function ( name ) {
		return myHandlers[name];
	};

	//router.handleURL( '/posts/a' );
	router.handleURL( '/posts/1/b?a=b' ).then(function() {
	router.handleURL( '/posts/2/a' );
		
	});

	//router.transitionTo( 'showPost', {a:1} );
} );
