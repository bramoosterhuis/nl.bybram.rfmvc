#include <HomeyRadio.h>

// device
#define DEVICE_ID 0x01
#define HOMEY_ADDR 0x50

// protocol
#define ID 0
#define SPEED 1

// pins
#define S_LOW 14
#define S_MED 15
#define S_HIGH 16
#define SW_MED 5
#define SW_HIGH 6

Homey::Radio radio(0x58);

static uint8_t setting(0);
static uint8_t current(0);
static byte data[8];
static uint8_t srcAddress;

int SwMedState = 0;
int SwHighState = 0;
int SwMedLastState = 0;
int SwHighLastState = 0;

void setup()
{
    // init IO
    pinMode(S_LOW, OUTPUT);
    pinMode(S_MED, OUTPUT);
    pinMode(S_HIGH, OUTPUT);

    pinMode(SW_MED, INPUT_PULLUP);
    pinMode(SW_HIGH, INPUT_PULLUP);

    digitalWrite(S_LOW, HIGH);
    digitalWrite(S_MED, HIGH);
    digitalWrite(S_HIGH, HIGH);

    // initialize module
    radio.initialize();
    radio.listeningMode();
}

void loop()
{
    SwMedState = digitalRead(SW_MED);
    SwHighState = digitalRead(SW_HIGH);

    if (radio.getData(&srcAddress, data, sizeof(data))) {
        if ((srcAddress == HOMEY_ADDR) && (data[ID] == DEVICE_ID)) {
            setting = data[SPEED];
        }
    }

    if ((SwHighState == LOW) || (SwMedState == LOW)) {
        if ((SwMedState != SwMedLastState) && (SwMedState == LOW)) {
            digitalWrite(S_LOW, LOW);
            digitalWrite(S_MED, LOW);
            digitalWrite(S_HIGH, HIGH);
            current = 2;
        }

        if ((SwHighState != SwHighLastState) && (SwHighState == LOW)) {
            digitalWrite(S_LOW, LOW);
            digitalWrite(S_MED, HIGH);
            digitalWrite(S_HIGH, LOW);
            current = 4;
        }
    }
    else {
        if (current != setting) {
            (0 < (setting & 0x07)) ? digitalWrite(S_LOW, LOW)
                                   : digitalWrite(S_LOW, HIGH);
            (0 < (setting & 0x02)) ? digitalWrite(S_MED, LOW)
                                   : digitalWrite(S_MED, HIGH);
            (0 < (setting & 0x04)) ? digitalWrite(S_HIGH, LOW)
                                   : digitalWrite(S_HIGH, HIGH);
            current = setting;
        }
    }

    SwMedLastState = SwMedState;
    SwHighLastState = SwHighState;
}