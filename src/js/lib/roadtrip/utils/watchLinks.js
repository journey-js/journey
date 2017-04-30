import window from './window.js';
import roadtrip from '../roadtrip.js';
import routes from '../routes.js';
import util from './util.js';
import watchHistory from './watchHistory.js';

// Adapted from https://github.com/visionmedia/page.js
// MIT license https://github.com/visionmedia/page.js#license

export default function watchLinks ( callback ) {
	window.addEventListener( 'click', handler, false );
	window.addEventListener( 'touchstart', handler, false );

	function handler ( event ) {
		if ( which( event ) !== 1 ) return;
		if ( event.metaKey || event.ctrlKey || event.shiftKey ) return;
		if ( event.defaultPrevented ) return;

		// ensure target is a link
		let el = event.target;
		while ( el && el.nodeName !== 'A' ) {
			el = el.parentNode;
		}

		if ( !el || el.nodeName !== 'A' ) return;

		// Ignore if tag has
		// 1. 'download' attribute
		// 2. rel='external' attribute
		if ( el.hasAttribute( 'download' ) || el.getAttribute( 'rel' ) === 'external' ) return;

		// ensure non-hash for the same path

		// Check for mailto: in the href
		if ( ~el.href.indexOf( 'mailto:' ) ) return;

		// check target
		if ( el.target ) return;

		// x-origin
		if ( !sameOrigin( el.href ) ) return;

		let path;

		if (watchHistory.useHash) {
			path = toHash(el);

		} else {
		path = el.getAttribute('href');
		//path = util.prefixWithSlash(path);
		
		// TODO below is original code which builds up path from the a.href property. Above we instead simply use the <a href> attribute
		//path = el.pathname + el.search + ( el.hash || '' );
		}

		// strip leading '/[drive letter]:' on NW.js on Windows
		if ( typeof process !== 'undefined' && path.match( /^\/[a-zA-Z]:\// ) ) {
			path = path.replace( /^\/[a-zA-Z]:\//, '/' );
		}

		// same page
		//const orig = path;

		/*
		if ( roadtrip.base && orig === path ) {
			return;
		}*/

		path = util.stripBase(path, roadtrip.base);

		// no match? allow navigation
		let matchFound = routes.some( route => route.matches( path ) );

		if ( matchFound ) {
			event.preventDefault();

			//path = util.prefixWithBase(path, roadtrip.base);
			callback( path );
		}

		return;
	}
}

function toHash(link) {
	let href = link.getAttribute('href');
	href = util.prefixWithHash(href);
	return href;

	// TODO below code probably unnessasary
	if (href[0] === '#') {
		return href;
	}

	let relPath = util.stripSlashOrHashPrefix(href);
	relPath = util.prefixWithHash(relPath);

	relPath = util.stripSearch(relPath);

	let path = location.pathname + relPath + link.search;
	path = util.stripSlashOrHashPrefix(path);

	if (link.hash != href) {
		let hash = link.hash || '';
		hash = hash.replace('#', "/");
		path = path + ( hash );
	}

	return path;
}

function which ( event ) {
	event = event || window.event;
	return event.which === null ? event.button : event.which;
}

function sameOrigin ( href ) {
	let origin = location.protocol + '//' + location.hostname;
	if ( location.port ) origin += ':' + location.port;

	return ( href && ( href.indexOf( origin ) === 0 ) );
}
