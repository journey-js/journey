var util = {

	stripSlashOrHashPrefix: str => {
		if ( str[0] === '/' || str[0] === '#' ) {
			str = str.slice( 1 );
		}
		return str;
	},

	stripSlashOrHashSuffix: str => {
		var index = str.length - 1;
		if ( str[index] === '/' || str[index] === '#' ) {
			str = str.slice( 0, - 1 );
		}
		return str;
	},

	prefixWithHash: str => {
		if ( str[0] === '#' ) {
			return str;
		}

		str = util.stripSlashOrHashPrefix( str );
		str = '#' + str;
		return str;
	},

	prefixWithSlash (str) {
		// Cannot prefix a url with '/' else http://moo will become /http://moo
		if ( util.isUrl( str ) ) {
			return str;
		}

		if ( str[0] === '/' ) {
			return str;

		} else {
			str = util.stripSlashOrHashPrefix( str );
		}
		str = '/' + str;
		return str;
	},
	
	suffixWithSlash (str) {
		if ( str[str.length - 1] === '/' ) {
			return str;
		}

		str =  str + '/';
		return str;
	},

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
	
	useDefaultRoute: (path) => {
		if (path == null) return true;

		if (path.length == 1) {

			if (path[0] == '/' || path[0] == '#') {
				return true;
			}
		}

		return false;
	}
};

export default util;