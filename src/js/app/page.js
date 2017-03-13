define( function ( require ) {
	var page = require( "page" );
	var ractive = require( "ractive" );
	
	  //page.base('/');
	//page({ dispatch: false })
	//page({ hasbang: true });
	//page({ popstate: true });
	page( '/admin/*',  loadAdmin, showAdmin);
	page.exit( '/admin/*',  leave);
	page( '/user/*',  loadUser, showUser);
	//page( '/user/:user', load )
	
	function loadAdmin(ctx, next) {
		console.log("loadAdmin", ctx);
		next();
	}
	
	function showAdmin(ctx, next) {
		console.log("showAdmin", ctx);
		next();
	}
	
	function leave(ctx, next) {
		console.log("leave", ctx);
		setTimeout(function() {
			//window.location.hash = '!/admin/user/1?x=y';
		}, 2000);
		next();
	}
	
	function loadUser(ctx, next) {
		console.log("loadUser", ctx);
		next();
	}
	
	function showUser(ctx, next) {
		console.log("showUser", ctx);
		next(false);
	}
setTimeout(function() {
page( '/admin/user/1?x=y');
	
}, 500)
	//router.transitionTo( 'showPost', {a:1} );
} );
