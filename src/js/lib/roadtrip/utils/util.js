var util = {

	stripSearch: str => {
		let start = str.indexOf( '?' );

		if ( start >= 0 ) {
			str = str.substring( 0, start );
		}
		return str;
	},

	isUrl: ( str ) => {
		if ( str.indexOf( "://" ) >= 0 ) {
			return true;
		}
	},

	prefixWithBase: ( str, base ) => {

		// Cannot prefix a url with the base value: http://moo will become refixhttp://moo
		if ( util.isUrl( str ) ) {
			return str;
		}

		let index = str.indexOf( base );
		if ( index === 0 ) {
			return str;
		}

		// Guard against double '/' when base ends with '/' and str starts with '/'
		if ( base[base.length - 1] === '/' && str[0] === '/' ) {
			str = str.slice( 1 );
		}

		str = base + str;
		return str;
	},

	stripBase: ( str, base ) => {
		if ( str.indexOf( base ) === 0 ) {
			str = str.substr( base.length );
		}

		if ( str === '' ) {
			// Don't return an empty str, return '/' which is generally mapped
			return '/';
		}
		return str;
	},

	getLocationAsRelativeUrl: () => {
		let relUrl = location.pathname + location.search + location.hash || '';
		return relUrl;
	},

	useDefaultRoute: ( path ) => {
		if ( path == null )
			return true;

		if ( path.length == 1 ) {

			if ( path[0] == '/' || path[0] == '#' ) {
				return true;
			}
		}

		return false;
	},

	extend: function ( out ) {
		out = out || { };
		for ( var i = 1; i < arguments.length; i ++ ) {
			if ( ! arguments[i] )
				continue;
			for ( var key in arguments[i] ) {
				if ( arguments[i].hasOwnProperty( key ) )
					out[key] = arguments[i][key];
			}
		}

		return out;
	}
};

export default util;