#include <Arduino.h>
#include <HomeyRadio.h>
#include <Wire.h>
#include <SparkFunHTU21D.h>

/// @brief Basic config
#define DEVICE_ID     0x02
#define DEVICE_ADDR   0x58

#define HOMEY_ADDR    0x50

// protocol
#define ID            0

Homey::Radio radio(DEVICE_ADDR);
HTU21D sensor;

void setup() {
  sensor.begin();
	radio.initialize();
	radio.listeningMode();
}

void loop() {
  uint8_t srcAddress; 
  byte data[8];
  
  while( !radio.getData(&srcAddress, data, sizeof(data)) );
  
  if ((srcAddress == HOMEY_ADDR) && (data[ID] == DEVICE_ID )) {
      int32_t humd = (sensor.readHumidity()*100);
      int32_t temp = (sensor.readTemperature()*100);

      // copy payload 
      memcpy((void*) humd,(void*) (data), 4);
      memcpy((void*) temp,(void*) (data+4), 4);

      radio.send(srcAddress, (void*) &data, sizeof(data));  
    }
}

