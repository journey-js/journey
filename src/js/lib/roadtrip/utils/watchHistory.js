setupLegacyEventUrls();

let listener;

let watchHistory = {
	
	_ignoreHashChange: false,

	useHash: false,
	
	useOnHashChange: false,

	hash: '#',
	
	supportHistory:   !!(window.history && window.history.pushState),

	noop() {},

	start( options = {} ) {

		watchHistory.useHash = options.useHash || watchHistory.useHash;
		watchHistory.hash = options.hash || watchHistory.hash;
		watchHistory.useOnHashChange = watchHistory.shouldUseOnHashChange(options.useOnHashChange || false);
		watchHistory.listener = options.listener || watchHistory.noop;

		watchHistory.startListening();
	},

	startListening() {

		if (watchHistory.useOnHashChange) {
			window.addEventListener( 'hashchange', watchHistory.hashchangeEventLisener, false );

		} else {
			window.addEventListener( 'popstate', watchHistory.popstateEventLisener, false );
		}
	},
	
	shouldUseOnHashChange(value) {
		// Use override if present
		if (value) {
			return true;
		}

		 if (watchHistory.supportHistory) {
			 return false;
		 }
		 return true;
	},

	popstateEventLisener( e ) {
		if ( e.state == null ) return; // hashchange, or otherwise outside roadtrip's control

		//let url = location.pathname;
		let url = watchHistory.useHash ? location.hash : location.pathname;
		let options = {
			url: url,
			popEvent: e,
			popState: true // so we know not to update the url and create another history entry
		};
		listener(options);
	},

	hashchangeEventLisener( e ) {
		if (watchHistory._ignoreHashChange) {
			watchHistory._ignoreHashChange = false;
			return;
		}

		let url = location.hash;
		
		let options = {
			url: url,
			hashEvent: e,
			hashChange: true // so we know not to update the url and create another history entry
		};
		
		listener(options);
	},

	setListener( callback ) {
		listener = callback;
	},
	
	setHash(hash, replace = false) {

		if (replace) {
			location.replace(hash);

		} else {
			// updating the hash will fire a hashchange event but we only want to respond to hashchange events when the history pops, not pushed
			watchHistory._ignoreHashChange = true;
			location.hash = hash;
		}
	}
};

function setupLegacyEventUrls( ) {
	// from https://developer.mozilla.org/en/docs/Web/API/WindowEventHandlers/onhashchange

	if ( ! window.HashChangeEvent )
		( function () {

			var lastURL = document.URL;

			window.addEventListener( "hashchange", function ( event ) {
				Object.defineProperty( event, "oldURL", { enumerable: true, configurable: true, value: lastURL } );
				Object.defineProperty( event, "newURL", { enumerable: true, configurable: true, value: document.URL } );

				lastURL = document.URL;
			} );
		}() );
}

export default watchHistory;
