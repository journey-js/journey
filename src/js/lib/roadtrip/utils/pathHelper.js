import util from "./util.js";
import config from "./config.js";
import window from './window.js';

let pathHelper = {

	getGotoPath: href => {
		if ( config.useHash ) {
			return href;
		}
		
		href = pathHelper.stripSlashOrHashPrefix( href );
		return href;
	},

	getInitialPath: () => {
		let relUrl = config.useHash ? window.location.hash : util.getLocationAsRelativeUrl();
		let path = util.stripBase( relUrl, config.base );

		if ( config.defaultRoute && util.useDefaultRoute( path ) ) {
			path = config.defaultRoute || path;
		}

		if ( ! config.useHash ) {
			path = pathHelper.stripSlashOrHashPrefix( path );
		}

		return path;
	},

	stripSlashOrHashPrefix: str => {

		if ( str == null )
			return str;
		str = str.trim( );
		if ( str[0] === '/' ) {
			str = str.slice( 1 );
		}

		if ( str.startsWith( config.hash ) ) {
			return str.slice( config.hash.length );
		}

		if ( str[0] === '#' ) {
			str = str.slice( 1 );
		}

		return str;
	},
	prefixWithHash: str => {
		if ( str.startsWith( config.hash ) ) {
			return str;
		}

		str = pathHelper.stripSlashOrHashPrefix( str );
		str = config.hash + str;
		return str;
	},
	prefixWithSlash( str ) {
// Cannot prefix a url with '/' else http://moo will become /http://moo
		if ( util.isUrl( str ) ) {
			return str;
		}

		if ( str[0] === '/' ) {
			return str;
		} else {
			str = pathHelper.stripSlashOrHashPrefix( str );
		}
		str = '/' + str;
		return str;
	}
}

export default pathHelper;