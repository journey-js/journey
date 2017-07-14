import config from "./config.js";
import window from './window.js';

let listener;

let watchHistory = {

	_ignoreHashChange: false,

	useOnHashChange: false,

	supportHistory:   !!(window.history && window.history.pushState),

	noop() {},

	start( options = {} ) {

		watchHistory.useOnHashChange = watchHistory.shouldUseOnHashChange(options.useOnHashChange || false);
		watchHistory.listener = watchHistory.noop;

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
		if ( e.state == null ) return; // hashchange, or otherwise outside journey's control

		//let url = location.pathname;
		let url = config.useHash ? window.location.hash : window.location.pathname;
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
	
	setHash(hash, options) {

		hash = options.invisible ? window.location.hash : hash;

		if (options.replaceState) {
			location.replace(hash);

		} else {
			// updating the hash will fire a hashchange event but we only want to respond to hashchange events when the history pops, not pushed
			watchHistory._ignoreHashChange = true;
			window.location.hash = hash;
		}
	}
}

export default watchHistory;
