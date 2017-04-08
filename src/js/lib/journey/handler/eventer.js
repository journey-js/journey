import EventEmitter from  "../EventEmitter";

var eventer = new EventEmitter();

var journey;

var origEmit = eventer.emit;

eventer.emit = function ( that ) {
	if ( typeof that === 'string' ) {
		var args = Array.prototype.slice.call( arguments );
		args.unshift( journey );
		return origEmit.apply( this, args );
	}
	origEmit.apply( this, arguments );
};


eventer.init = ( arg ) => {
	journey = arg;

	journey.on = ( event, listener ) => {
		//eventer.on.call( journey, event, listener );
		eventer.on( event, listener );
	};
	journey.off = ( event, listener ) => {
		eventer.off( event, listener );
	};

	journey.emit = function () {
		eventer.emit.apply( eventer, arguments );
	};
	journey.emitEvent = function () {
		eventer.emitEvent.apply( eventer, arguments );
	};
};

export default eventer;