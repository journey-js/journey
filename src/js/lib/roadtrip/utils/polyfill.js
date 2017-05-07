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


if ( ! String.prototype.startsWith ) {
	String.prototype.startsWith = function ( searchString, position ) {
		position = position || 0;
		return this.substr( position, searchString.length ) === searchString;
	};
}

if ( ! String.prototype.endsWith ) {
	String.prototype.endsWith = function ( searchString, position ) {
		var subjectString = this.toString();
		if ( typeof position !== 'number' || ! isFinite( position ) || Math.floor( position ) !== position || position > subjectString.length ) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.lastIndexOf( searchString, position );
		return lastIndex !== - 1 && lastIndex === position;
	};
}