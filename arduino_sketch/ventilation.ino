#include <HomeyRadio.h>
// device
#define DEVICE_ID     0x01
#define HOMEY_ADDR    0x50

// protocol
#define ID            0
#define SPEED         1

//pins
#define S_LOW         14
#define S_MED         15
#define S_HIGH        16  


Homey::Radio radio(0x58);
static uint8_t state(0);

void setup() {
  // init IO
  pinMode(S_LOW, OUTPUT);
  pinMode(S_MED, OUTPUT);
  pinMode(S_HIGH, OUTPUT);
  
  digitalWrite(S_LOW, HIGH);  
  digitalWrite(S_MED, HIGH);
  digitalWrite(S_HIGH, HIGH);
	
	// initialize module
	radio.initialize();
	radio.listeningMode();
}

void loop() {
	byte data[8];
	uint8_t srcAddress;

	while( !radio.getData(&srcAddress, data, sizeof(data)) );

  if (srcAddress == HOMEY_ADDR) {
    if (data[ID] == DEVICE_ID ){
        ( 0 < (data[SPEED] & 0x07) ) ? digitalWrite(S_LOW, LOW) : digitalWrite(S_LOW, HIGH);  
        ( 0 < (data[SPEED] & 0x02) ) ? digitalWrite(S_MED, LOW) : digitalWrite(S_MED, HIGH);
        ( 0 < (data[SPEED] & 0x04) ) ? digitalWrite(S_HIGH, LOW) : digitalWrite(S_HIGH, HIGH);
        state = data[SPEED];
    }
  }
}
