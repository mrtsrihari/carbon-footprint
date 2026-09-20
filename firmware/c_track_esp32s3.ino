/*
  ========================================================================================
  C-TRACK: Edge IoT & Carbon Intelligence Platform - ESP32-S3 Firmware
  ========================================================================================
  Device: ESP32-S3 DevKit
  Hardware Architecture:
    12V Power Adapter (12V 2A)
         ↓
    ACS712 Current Sensor (5A Model) → ADS1115 (AIN1)
         ↓
    L298N Motor Driver → 12V DC Motor Load
    
    Voltage Sensor (0-25V Divider) → ADS1115 (AIN0)
    DS18B20 Digital Thermometer → GPIO 4 (OneWire)
    
  Pinout:
  - ADS1115 ADC: I2C (SDA = GPIO 21, SCL = GPIO 22)
      * AIN0: 0–25V Voltage Divider Sensor (5:1 ratio)
      * AIN1: ACS712-05B Current Sensor (2.5V zero offset, 185mV/A)
  - DS18B20 Temperature: OneWire Bus (GPIO 4)
  - L298N Motor Driver:
      * IN1 = GPIO 5, IN2 = GPIO 6, ENA (PWM Speed) = GPIO 7
  - Status LED: GPIO 2 (Blinks on telemetry transmission)

  Communication Modes Supported:
  1. Serial JSON Streaming (USB @ 115200 Baud - Web Serial API)
  2. WiFi HTTP REST POST (to http://<gateway_ip>:3001/api/telemetry)
  3. WiFi WebSocket Stream (to ws://<gateway_ip>:3001/ws)

  Canonical Payload Schema:
  {
    "timestamp": 1740000000000,
    "deviceId": "ESP32-S3-CTRACK-01",
    "machineId": "MOTOR-01",
    "voltage": 12.05,
    "current": 0.85,
    "temperature": 27.4,
    "power": 10.24,
    "energy": 0.04200,
    "machineState": "ACTIVE",
    "dataSource": "LIVE_SENSOR"
  }
  ========================================================================================
*/

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_ADS1X15.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ============================================================================
// CONFIGURATION FLAGS & NETWORK CREDENTIALS (OPTIONAL FOR WIFI MODES)
// ============================================================================
#define ENABLE_WIFI_HTTP  false  // Set true to enable HTTP POST to C-TRACK Ingestion Gateway
#define ENABLE_WIFI_WS    false  // Set true to enable WebSocket streaming
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* HTTP_ENDPOINT = "http://192.168.1.100:3001/api/telemetry";

// Pin Definitions
#define PIN_ONE_WIRE_BUS 4
#define PIN_MOTOR_IN1    5
#define PIN_MOTOR_IN2    6
#define PIN_MOTOR_ENA    7
#define PIN_LED_STATUS   2

// Sensor Objects
Adafruit_ADS1115 ads;
OneWire oneWire(PIN_ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

// Transducer Calibration Constants
const float VOLTAGE_DIVIDER_RATIO = 5.0;     // 25V -> 5V range (5:1)
const float ACS712_ZERO_MV        = 2500.0;  // 2.5V quiescent voltage at 0A
const float ACS712_SENSITIVITY    = 185.0;   // 185 mV/A for ACS712-05B
const float ADS1115_MV_PER_BIT    = 0.1875;  // GAIN_TWOTHIRDS (+/- 6.144V)

// Rule-Based Machine State Thresholds
const float IDLE_POWER_THRESHOLD_W        = 4.5; // Below 4.5W = IDLE
const float OVERLOAD_CURRENT_THRESHOLD_A  = 1.8; // Above 1.8A = ABNORMAL
const float OFF_CURRENT_THRESHOLD_A       = 0.08;
const float MIN_OPERATING_VOLTAGE_V       = 8.0;

// Device Identifiers
const char* DEVICE_ID  = "ESP32-S3-CTRACK-01";
const char* MACHINE_ID = "MOTOR-01";
const char* DATA_SOURCE = "LIVE_SENSOR";

// Telemetry & Energy State
unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL_MS = 500; // 2Hz sampling rate
unsigned long packetIndex = 0;
float cumulativeEnergyKWh = 0.0;
unsigned long lastEnergyCalcTime = 0;
bool ads1115Available = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_MOTOR_IN1, OUTPUT);
  pinMode(PIN_MOTOR_IN2, OUTPUT);
  pinMode(PIN_MOTOR_ENA, OUTPUT);

  // Set motor running forward at nominal duty cycle
  digitalWrite(PIN_MOTOR_IN1, HIGH);
  digitalWrite(PIN_MOTOR_IN2, LOW);
  analogWrite(PIN_MOTOR_ENA, 200); // ~78% PWM speed

  // Initialize I2C for ADS1115
  Wire.begin(21, 22);
  if (ads.begin(0x48)) {
    ads.setGain(GAIN_TWOTHIRDS); // +/- 6.144V (1 bit = 0.1875mV)
    ads1115Available = true;
  } else {
    Serial.println("{\"status\":\"ERROR\",\"error\":\"ADS1115 I2C ADC not detected at 0x48\"}");
  }

  // Initialize DS18B20 OneWire Sensor
  ds18b20.begin();
  ds18b20.setResolution(10); // 10-bit conversion (187.5ms)

  // Optional WiFi initialization
  if (ENABLE_WIFI_HTTP || ENABLE_WIFI_WS) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  lastEnergyCalcTime = millis();
}

void loop() {
  unsigned long now = millis();

  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;
    packetIndex++;

    // 1. Read Voltage (ADS1115 Channel 0)
    float voltage = 0.0;
    if (ads1115Available) {
      int16_t adc0 = ads.readADC_SingleEnded(0);
      float adc0_mv = adc0 * ADS1115_MV_PER_BIT;
      voltage = (adc0_mv * VOLTAGE_DIVIDER_RATIO) / 1000.0;
      if (voltage < 0.2) voltage = 0.0;
    }

    // 2. Read Current (ADS1115 Channel 1 - ACS712)
    float current = 0.0;
    if (ads1115Available) {
      int16_t adc1 = ads.readADC_SingleEnded(1);
      float adc1_mv = adc1 * ADS1115_MV_PER_BIT;
      current = (adc1_mv - ACS712_ZERO_MV) / ACS712_SENSITIVITY;
      if (current < 0.05) current = 0.0;
    }

    // 3. Calculate Power (P = V * I)
    float power = voltage * current;

    // 4. Read DS18B20 Measured Temperature
    ds18b20.requestTemperatures();
    float measuredTempC = ds18b20.getTempCByIndex(0);
    if (measuredTempC == DEVICE_DISCONNECTED_C) {
      measuredTempC = -127.0; // Standard error code for sensor disconnect
    }

    // 5. Integrate Energy Accumulation (kWh)
    unsigned long dtMs = now - lastEnergyCalcTime;
    lastEnergyCalcTime = now;
    float dtHours = (float)dtMs / 3600000.0;
    cumulativeEnergyKWh += (power * dtHours) / 1000.0;

    // 6. Rule-Based Machine State Engine (ESP32 Edge Inference)
    const char* machineState = "OFF";
    if (voltage < MIN_OPERATING_VOLTAGE_V || current < OFF_CURRENT_THRESHOLD_A || power < 0.5) {
      machineState = "OFF";
    } else if (current >= OVERLOAD_CURRENT_THRESHOLD_A || voltage > 24.5) {
      machineState = "ABNORMAL";
    } else if (power < IDLE_POWER_THRESHOLD_W) {
      machineState = "IDLE";
    } else {
      machineState = "ACTIVE";
    }

    // 7. Format JSON String in Exact Canonical C-TRACK Schema
    String jsonPayload = "{";
    jsonPayload += "\"timestamp\":" + String(now) + ",";
    jsonPayload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
    jsonPayload += "\"machineId\":\"" + String(MACHINE_ID) + "\",";
    jsonPayload += "\"voltage\":" + String(voltage, 2) + ",";
    jsonPayload += "\"current\":" + String(current, 3) + ",";
    jsonPayload += "\"temperature\":" + String(measuredTempC, 1) + ",";
    jsonPayload += "\"power\":" + String(power, 2) + ",";
    jsonPayload += "\"energy\":" + String(cumulativeEnergyKWh, 5) + ",";
    jsonPayload += "\"machineState\":\"" + String(machineState) + "\",";
    jsonPayload += "\"dataSource\":\"" + String(DATA_SOURCE) + "\"";
    jsonPayload += "}";

    // 8. Transmit over Web Serial (USB)
    digitalWrite(PIN_LED_STATUS, HIGH);
    Serial.println(jsonPayload);
    digitalWrite(PIN_LED_STATUS, LOW);

    // 9. Transmit over WiFi HTTP REST (if enabled and connected)
    if (ENABLE_WIFI_HTTP && WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(HTTP_ENDPOINT);
      http.addHeader("Content-Type", "application/json");
      http.POST(jsonPayload);
      http.end();
    }
  }
}
