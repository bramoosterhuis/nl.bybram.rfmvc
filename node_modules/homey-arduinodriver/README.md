# Homey arduino module 
Homey app developers can use this node module to communicate with a nRF905 module over 433MHz wired to a Arduino. The Arduino must be running the Homey-arduino-nRF905 library which can be found [here](https://github.com/athombv/homey-arduino-nrf905).

Currently it is only possible to receive data from an Arduino device by first sending data to it. After sending data the driver switches to receive mode and waits 200ms for the Arduino to respond. After the 200ms have passed Homey returns to its default receive configuration. 

The module includes automatic acking of transmitted and received messages, which makes it easy to detect dropped messages. 

Examples are provided in the examples/ folder. 

## Requirements
- a nRF905 wired to a Arduino running the Homey-arduino-nRF905 library
- Homey running 0.9.0 or later

## Installation
Import the module to your homey app project by using npm:

```npm install git+https://github.com/athombv/node-homey-arduinodriver.git```

Add the signal-definition in ```signal.json``` to your existing app.json. This signal-definition will be used by the arduinodriver.

## Usage
first, create a ArduinoRadio instance with a desired receive address:

```
var HomeyRadio = require('homey-arduinodriver'); 
var radio = new ArduinoRadio({address: 0x50});
```
listen to incoming data events:
```
radio.on('payload', function(message) {
    console.log(message);
});
```
or send data to a Arduino:
```
var payload = new Buffer('hello');
radio.send(0xAA, payload, function(err) {
    if(!err) {
        console.log("message acked!");
    } else {
        console.log("message not acked");
});
```
### Constructors
- `ArduinoRadio(opts)`
    * ***Description:*** Constructor which spawns a ArduinoRadio object
    * ***Parameters:***
        * ***opts.address:*** receive address of Homey between 0x00 and 0xFE

### Methods
- `ArduinoRadio.send(address, data, callback)`
    * ***returning:***  -
    * ***Description:***  method to send data to a Arduino device
    * ***Parameters:***
        * ***address:*** receive address of the nRF905 module between 0x00 and 0xFE
        * ***data:*** Buffer with payload data ***Max 8 bytes***
        * ***callback:*** function(err) which get called on a timeout or ack
### Events
- `ArduinoRadio.on('payload', function(message){})`
    * ***Description:***  Event which get emitted when receiving data from a Arduino device
    * ***Parameters:***
        * ***message.srcAddr:*** address of Arduino
        * ***message.destAddr:*** address of Homey
        * ***message.type:*** message type, 'data'
        * ***message.sequenceNr:*** sequence number
        * ***message.payload:*** Buffer including the received data 
        * ***message.crc:*** crc checksum

