var events = require('events');
var crc = require('crc');
var util = require('util');
var Signal = Homey.wireless('433').Signal;

// default opts
var dopts = {
	address: 0x00
};

function ArduinoRadio(opts) {
    if(!(this instanceof ArduinoRadio)) return new HomeyArduino(address, Signal);
    if(opts.address === 0xFF) throw new Error("address 0xFF is reserved as broadcast address");
    if(opts.address > 0xFF) throw new Error("address out of bounds");


	var PAYLOADSIZE = 8; // bytes
    var QUEUELEN = 3;

    var self = this;
	var _txQueue = [];
	var _sequenceNr = 0;
	var _lastSeqNr = 0xFF;
	var _busy = false;
	var _currentReq = {};

	this.opts = Object.assign(dopts, opts);

	var _nrfProtocol = new Signal('nRF905');
	_nrfProtocol.register(function(err) {
		if(err) {
			throw new Error("could not register signal");
		} else {
			self.emit('ready');
		}
	});


	/* static functions */
	function _deserialize(data) {
        if(data.length < (PAYLOADSIZE + 5)) return; // + destAddr, srcAddr, type and 16-bits crc

		// parse message
        var idx = 0;
        var message = {};
		message.destAddr = data.readUInt8(idx++);
		message.srcAddr = data.readUInt8(idx++);
		message.type = (data.readUInt8(idx) & 0x80) ? 'ack' : 'data';
		message.sequenceNr = data.readUInt8(idx++) & 0x7F;
		message.payload = data.slice(idx, idx+PAYLOADSIZE);

        idx += PAYLOADSIZE;

		message.crc = data.readUInt16BE(idx++);

		return message;
	}

	function _serialize(message) {
		var buffer = new Buffer(13);
		var idx = 0;
		// zero all elements
		buffer.fill(0);
		// add source and destination address
		buffer.writeUInt8(message.destAddr, idx++);
		buffer.writeUInt8(message.srcAddr, idx++);
		// add status byte
		var type = (message.type === 'ack') ? 0x80 : 0x00;
		buffer.writeUInt8(type | message.sequenceNr, idx++);
        // write payload to buffer
        message.payload.copy(buffer, idx);
        idx += PAYLOADSIZE;
		// write crc
		buffer.writeUInt16BE(message.crc, idx);

		return buffer;
	}

	function _calculateCRC(message) {
		var status = (message.type === 'ack') ? message.sequenceNr | 0x80 : message.sequenceNr;
		var header = new Buffer([message.destAddr, message.srcAddr, status])
		return crc.crc16ccitt(Buffer.concat([header, message.payload]));
	}

	function _request(request) {
		_busy = true;
		// serialize packet
		var rawBuffer = _serialize(request);

        var callback = function(timeout) {
        	clearTimeout(_currentReq.timeout);
            if(typeof request.callback === 'function') {
                request.callback(timeout);
                // send next request
                var nextRequest = _txQueue.shift();
                if(typeof nextRequest === 'object') {
                    _request(nextRequest);	
                } else {
                    _busy = false;
                }
            }
        };
        // set current request
        _currentReq.request = request;
        _currentReq.callback = callback;
        _currentReq.timeout = setTimeout(function() { 
        	callback(true);
        }, 5000);


        // send buffer
		_nrfProtocol.tx(rawBuffer) ; 
	}
	/* ------------------ */

	_nrfProtocol.on('payload', function(payload, first) {
		var data = (!Buffer.isBuffer(payload)) ? new Buffer(payload) : payload;
        var message = _deserialize(data);
        // check if valid message
        if(message === undefined) { 
            return;
        }
        if(_calculateCRC(message) !== message.crc) {
            return; 
        }
        if(message.destAddr !== self.opts.address) {
            return;
        }
        if(message.sequenceNr === _lastSeqNr) {
        	return;
        }
        // write new sequence nr for debouncing
       	_lastSeqNr = message.sequenceNr;

    	switch (message.type) {
    		case ('ack') :
    			if(!_busy) return;
    			// compare received and sent sequence numbers 
    			if(_currentReq.request.sequenceNr === message.sequenceNr) {
    				clearTimeout(_currentReq.timeout);
    				_currentReq.callback(false);
    			}	
    		break;

    		case ('data') :
    			// copy received message and change type to ack
    			var ackMessage = Object.assign({}, message);

    			ackMessage.type = 'ack';
    			ackMessage.srcAddr = self.opts.address;
    			ackMessage.destAddr = message.srcAddr;
    			ackMessage.crc = _calculateCRC(ackMessage);

    			var rawMessage = _serialize(ackMessage);	
    			_nrfProtocol.tx(rawMessage);

        		self.emit('payload', message);
    		break;
    	}
	});

	this.send = function(address, data, callback) {
		if(data.length > 8) throw new Error("can only send "+PAYLOADSIZE+" bytes at a time");
		if(address > 0xFF) throw new Error("address out of bounds");
        if(_txQueue.length > QUEUELEN)  return; 
        // increment sequence number until 128
        _sequenceNr = (_sequenceNr + 1) & 0x7F;

		var databuffer = (data instanceof Array) ? new Buffer(data) : data;

		var payload = new Buffer(PAYLOADSIZE);
		payload.fill(0x00);
		databuffer.copy(payload);

		var request = {};
		request.sequenceNr = _sequenceNr;
		request.destAddr = address;
		request.srcAddr = self.opts.address;
		request.type = 'data';
		request.payload = payload;
		request.crc = _calculateCRC(request);
        request.callback = callback;

		// if busy sending push it to queue
		if(_busy) {
			_txQueue.push(request);
		} else {
			_request(request);
		}
    };

	return this;
}

util.inherits(ArduinoRadio, events.EventEmitter);

module.exports = ArduinoRadio;
