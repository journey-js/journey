import roadtrip from './roadtrip.js';
import pathHelper from "./utils/pathHelper.js";
import watchHistory from "./utils/watchHistory.js";


const a = typeof document !== 'undefined' && document.createElement( 'a' );
const QUERYPAIR_REGEX = /^([\w\-]+)(?:=([^&]*))?$/;
const HANDLERS = [ 'beforeleave', 'beforeenter', 'enter', 'leave', 'update' ];

let isInitial = true;

function RouteData( { route, pathname, params, query, hash, scrollX, scrollY } ) {
	this.pathname = pathname;
	this.params = params;
	this.query = query;
	this.hash = hash;
	this.isInitial = isInitial;
	this.scrollX = scrollX;
	this.scrollY = scrollY;

	this._route = route;

	isInitial = false;
}

RouteData.prototype = {
	matches( href ) {
		return this._route.matches( href );
	}
};

export default function Route( path, options ) {
	path = pathHelper.stripSlashOrHashPrefix(path);	

	this.path = path;
	this.segments = path.split( '/' );

	if ( typeof options === 'function' ) {
		options = {
			enter: options
		};
	}

	this.updateable = typeof options.update === 'function';

	HANDLERS.forEach( handler => {
		this[ handler ] = ( route, other, opts ) => {
			let value;

			if ( options[ handler ] ) {
				value = options[ handler ]( route, other, opts );
			}

			return roadtrip.Promise.resolve( value );
		};
	} );
}

Route.prototype = {
	matches( href ) {
		a.href = pathHelper.prefixWithSlash(href); // This works for the options useHash: false + contextPath: true

		const pathname = a.pathname.slice( 1 );
		const segments = pathname.split( '/' );

		return segmentsMatch( segments, this.segments );
	},

	exec( target ) {
		a.href = target.href;

		let pathname = a.pathname;
		pathname = pathHelper.stripSlashOrHashPrefix(pathname);
		const search = a.search.slice( 1 );

		const segments = pathname.split( '/' );

		if ( segments.length !== this.segments.length ) {
			return false;
		}

		const params = { };

		for ( let i = 0; i < segments.length; i += 1 ) {
			const segment = segments[i];
			const toMatch = this.segments[i];

			if ( toMatch[0] === ':' ) {
				params[ toMatch.slice( 1 ) ] = segment;
			} else if ( segment !== toMatch ) {
				return false;
			}
		}

		const query = { };
		const queryPairs = search.split( '&' );

		for ( let i = 0; i < queryPairs.length; i += 1 ) {
			const match = QUERYPAIR_REGEX.exec( queryPairs[i] );

			if ( match ) {
				const key = match[1];
				const value = decodeURIComponent( match[2] );

				if ( query.hasOwnProperty( key ) ) {
					if ( typeof query[ key ] !== 'object' ) {
						query[ key ] = [ query[ key ] ];
					}

					query[ key ].push( value );
				} else {
					query[ key ] = value;
				}
			}
		}

		return new RouteData( {
			route: this,
			pathname,
			params,
			query,
			hash: a.hash.slice( 1 ),
			scrollX: target.scrollX,
			scrollY: target.scrollY
		} );
	}
};

function segmentsMatch( a, b ) {
	if ( a.length !== b.length )
		return;

	let i = a.length;
	while ( i -- ) {
		if ( ( a[i] !== b[i] ) && ( b[i][0] !== ':' ) ) {
			return false;
		}
	}

	return true;
}

//
//const skip = [ "isInitial", "_route", "pathname", "params", "query", "hash" ];
//
//RouteData.prototype.extend = function ( src ) {
//	for ( var nextKey in src ) {
//		if ( src.hasOwnProperty( nextKey ) ) {
//
//			if ( skip.indexOf( nextKey ) < 0 ) {
//				this[nextKey] = src[nextKey];
//			}
//		}
//	}
//	return this;
//};


RouteData.prototype.extend = function( target ) {
	var output = Object( target );

	for ( var i = 1; i < arguments.length; i++ ) {
		var src = arguments[i];
		if ( src === undefined || src === null )
			continue;
		for ( var nextKey in src ) {
			if ( src.hasOwnProperty( nextKey ) ) {
				output[nextKey] = src[nextKey];
			}
		}
	}
	return output;
};