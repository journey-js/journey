// 
// // Place third party dependencies in the lib folder
//
// Configure loading modules from the lib directory,
// except 'app' ones, 
requirejs.config({
	"baseUrl": "js/lib", // root folder where all our libraries are located

	"paths": {
		"app": "../app", // path to our application
		//"moment": "moment",
		//"numeral": "numeral",
		//"bootstrap": '../app/plugins/bootstrap',
		//'select2': '../app/plugins/select2',
		"jquery": 'jquery-2.1.4'
				//'ractive': 'http://cdn.ractivejs.org/edge/ractive',
				//@,'jquery': 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min'
	},

	
	"shim": {
		//'bootstrap': {
		//deps: ['jquery']
		//},
		/*
		 'select2': {
		 deps: ['jquery'],
		 exports: 'Select2'
		 },*/
	}
});

// onResourceLoad is a requirejs extension to manipulate modules being loaded.
// Here we add a the module ID (which is also the path to the module location)
// as an attribute on the module itself
requirejs.onResourceLoad = function (context, map, depArray) {
	var obj = context.defined[map.name];

	if (obj) {
		if (obj.prototype) {
			setId(obj.prototype, map.id);
			setId(obj, map.id);
		} else {
			setId(obj, map.id);
		}
	}
};

function setId(obj, id) {
	// Create an ID property which isn't writable or iteratable through for in loops.
	if (!obj.id) {
		Object.defineProperty(obj, "id", {
			enumerable: false,
			writable: false,
			value: id
		});
	}
}

/*
 requirejs.onError = function (err) {
 if (err.requireType === 'timeout') {
 // tell user
 alert("error: "+err);
 } else {
 throw err;
 }
 };*/

// Load the start module to start the application
//requirejs(["app/start"]);
requirejs(["app/roadtrip"]);
	