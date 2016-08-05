var HomeyRadio = require('homey-arduinodriver');
var radio = new HomeyRadio({'address':0x50});

var payload = new Buffer('hello');

setInterval(function() {
  radio.send(0x58, payload, function(err) {
    if(!err) {
      console.log("message has been acknowledged");
    } else {
      console.log("message has not been acknowledged");
    }
  });
}, 2000);
