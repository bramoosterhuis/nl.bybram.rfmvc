"use strict";

function init() {
	Homey.log("nl.bybram.rfmvc running....");
}

// bind flow action
Homey.manager('flow').on('action.set_speed', function( callback, args ){
	callback( null, set_speed(args.speed.id));
});

function set_speed(input) {
	var HomeyRadio = require('homey-arduinodriver');
	var radio = new HomeyRadio({'address':0x50});
	var payload = new Buffer([parseInt(input)]);
	radio.send(0x58, payload, function (err) {
		if (!err) {
			console.log("ok speed has been set");
			return true;
		} else {
			console.log("error setting speed");
			return false;
		}
	});
}

module.exports.init = init;