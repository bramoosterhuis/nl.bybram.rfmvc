"use strict";
var HomeyRadio = require('homey-arduinodriver');
var radio = new HomeyRadio({'address':0x50});

function init() {
	Homey.log("nl.bybram.rfmvc running....");
}

// bind flow action
Homey.manager('flow').on('action.set_speed', function( callback, args ){
	set_speed(args.id, args.speed)
	callback( null, true);
});

function set_speed(id ,speed) {
	var payload = new Buffer([
		parseInt(id),
		parseInt(speed)
	]);
	radio.send(0x58, payload, function (err) {
		if (!err) {
			Homey.log("Ventilation " + id + " set to: " + speed)
			return true;
		} else {
			Homey.log("Ventilation " + id + " ACK error")
			return false;
		}
	});
}

function measureHC(id ,speed) {
    var payload = new Buffer([
        parseInt(id),
        parseInt(speed)
    ]);
    radio.send(0x58, payload, function (err) {
        if (!err) {
            Homey.log("Ventilation " + id + " set to: " + speed)
            return true;
        } else {
            Homey.log("Ventilation " + id + " ACK error")
            return false;
        }
    });
}

module.exports.init = init;