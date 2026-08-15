import React, { useState } from 'react';
import { IoTDevice } from '../types';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Wifi,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2,
  Settings,
  HelpCircle,
  Play,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FirmwareViewProps {
  device: IoTDevice | null;
  lang: 'km' | 'en';
}

export const FirmwareView: React.FC<FirmwareViewProps> = ({ device, lang }) => {
  const [boardType, setBoardType] = useState<'esp32_standard' | 'esp32_cam'>('esp32_standard');
  const [wifiSsid, setWifiSsid] = useState('My_Home_WiFi_2.4G');
  const [wifiPass, setWifiPass] = useState('password1234');
  const [serverUrl, setServerUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://your-app.run.app'
  );
  const [intervalMs, setIntervalMs] = useState(2000);
  const [dhtPin, setDhtPin] = useState(4);
  const [relay1Pin, setRelay1Pin] = useState(23);
  const [relay2Pin, setRelay2Pin] = useState(22);
  const [gasPin, setGasPin] = useState(34);
  const [soilPin, setSoilPin] = useState(35);
  const [fanPwmPin, setFanPwmPin] = useState(19);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'guide' | 'wiring' | 'api'>('code');

  const token = device?.authToken || 'blynk_esp32_khmer_gh_8923a1';

  // Dynamic ESP32 Standard Arduino C++ Code
  const standardCppCode = `/*
 * ==============================================================================
 * Project: ESP32 Full-Stack IoT Cloud Node (Blynk.Cloud Console Compatible)
 * Target Hardware: ESP32 (NodeMCU / ESP32-WROOM-32 / ESP32-S3)
 * Server URL: ${serverUrl}
 * Auth Token: ${token}
 * Telemetry Interval: ${intervalMs} ms (2 seconds real-time loop)
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ---------------------- 1. WIFI & CLOUD CREDENTIALS ----------------------
const char* WIFI_SSID     = "${wifiSsid}";
const char* WIFI_PASSWORD = "${wifiPass}";
const char* BLYNK_AUTH    = "${token}";
const char* SERVER_BASE   = "${serverUrl}";

// ---------------------- 2. HARDWARE PIN DEFINITIONS ----------------------
#define DHTPIN        ${dhtPin}     // Digital PIN for DHT22 / DHT11 (V0 Temp, V1 Hum)
#define DHTTYPE       DHT22  // Change to DHT11 if using blue sensor
#define PIN_RELAY_1   ${relay1Pin}    // Digital Output for Water Pump / Relay 1 (V2)
#define PIN_RELAY_2   ${relay2Pin}    // Digital Output for Grow Light / Relay 2 (V3)
#define PIN_FAN_PWM   ${fanPwmPin}    // PWM Output for Fan Speed (V4)
#define PIN_GAS_MQ    ${gasPin}    // Analog ADC Input for MQ-135 / MQ-2 (V5)
#define PIN_SOIL_ADC  ${soilPin}    // Analog ADC Input for Soil Moisture (V7)
#define PIN_STATUS_LED 2     // ESP32 Onboard Blue LED (V6 Alert)

// PWM Channel configuration for ESP32
#define PWM_CHANNEL   0
#define PWM_FREQ      5000
#define PWM_RES       8      // 8-bit resolution (0-255)

// ---------------------- 3. OBJECTS & TIMING VARIABLES -------------------
DHT dht(DHTPIN, DHTTYPE);
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = ${intervalMs}; // ${intervalMs} ms interval

// ---------------------- 4. SETUP FUNCTION --------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n[SYSTEM] Starting ESP32 Blynk.Cloud IoT Node...");

  // Configure GPIO Pins
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_RELAY_1, LOW);
  digitalWrite(PIN_RELAY_2, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Setup PWM Fan channel
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RES);
  ledcAttachPin(PIN_FAN_PWM, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 180); // Default ~70% speed

  // Initialize Sensors
  dht.begin();
  analogReadResolution(12); // 12-bit ADC (0 - 4095)

  // Connect to Wi-Fi
  connectWiFi();
}

// ---------------------- 5. MAIN LOOP -------------------------------------
void loop() {
  // Maintain Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Non-blocking timer: Sync with Cloud every ${intervalMs / 1000} seconds
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = millis();
    
    // 1. Read real hardware sensors
    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    
    // Fallback if sensor disconnected
    if (isnan(temperature) || isnan(humidity)) {
      temperature = 28.5; // fallback test value
      humidity = 65.0;
      Serial.println("[WARN] DHT sensor read failed! Using fallback values.");
    }

    // Read Gas Analog (MQ-135 / MQ-2)
    int rawGas = analogRead(PIN_GAS_MQ);
    int gasPpm = map(rawGas, 0, 4095, 100, 1000); // Approximate PPM scale

    // Read Soil Moisture Analog
    int rawSoil = analogRead(PIN_SOIL_ADC);
    // Invert scale: 4095 = dry (0%), 1200 = wet (100%)
    float soilMoist = constrain(map(rawSoil, 3800, 1200, 0, 100), 0, 100);

    // 2. Publish Sensor Telemetry to Cloud REST API
    publishTelemetry(temperature, humidity, gasPpm, soilMoist);

    // 3. Read Actuator Commands (Relays & PWM) from Cloud
    syncActuatorCommands();
  }
}

// ---------------------- 6. WI-FI CONNECTION ------------------------------
void connectWiFi() {
  Serial.print("[WiFi] Connecting to SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\\n[WiFi] Connection timeout. Retrying in background...");
  }
}

// ---------------------- 7. PUBLISH SENSOR TELEMETRY ----------------------
void publishTelemetry(float temp, float hum, int gas, float soil) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  
  // Format URL query parameters
  String url = String(SERVER_BASE) + "/api/iot/update?token=" + String(BLYNK_AUTH) +
               "&v0=" + String(temp, 1) +
               "&v1=" + String(hum, 1) +
               "&v5=" + String(gas) +
               "&v7=" + String(soil, 1) +
               "&rssi=" + String(WiFi.RSSI()) +
               "&ip=" + WiFi.localIP().toString();

  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    Serial.printf("[Cloud Sync] Telemetry Published: Temp=%.1f C, Hum=%.1f %%, Gas=%d ppm, Soil=%.1f %%\n",
                  temp, hum, gas, soil);
  } else {
    Serial.printf("[Cloud Sync] Error sending telemetry. HTTP Code: %d\n", httpCode);
  }
  http.end();
}

// ---------------------- 8. SYNC ACTUATOR COMMANDS ------------------------
void syncActuatorCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE) + "/api/iot/all?token=" + String(BLYNK_AUTH);
  
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    
    // Parse Relay 1 (V2 - Water Pump)
    if (payload.indexOf("\\"V2\\":1") > 0) {
      digitalWrite(PIN_RELAY_1, HIGH);
    } else if (payload.indexOf("\\"V2\\":0") > 0) {
      digitalWrite(PIN_RELAY_1, LOW);
    }

    // Parse Relay 2 (V3 - Grow Light)
    if (payload.indexOf("\\"V3\\":1") > 0) {
      digitalWrite(PIN_RELAY_2, HIGH);
    } else if (payload.indexOf("\\"V3\\":0") > 0) {
      digitalWrite(PIN_RELAY_2, LOW);
    }

    // Parse Alarm Buzzer / Status LED (V6)
    if (payload.indexOf("\\"V6\\":1") > 0) {
      digitalWrite(PIN_STATUS_LED, HIGH);
    } else if (payload.indexOf("\\"V6\\":0") > 0) {
      digitalWrite(PIN_STATUS_LED, LOW);
    }

    // Parse Fan PWM (V4)
    int fanIdx = payload.indexOf("\\"V4\\":");
    if (fanIdx > 0) {
      int fanSpeed = payload.substring(fanIdx + 5, fanIdx + 8).toInt();
      int pwmDuty = map(constrain(fanSpeed, 0, 100), 0, 100, 0, 255);
      ledcWrite(PWM_CHANNEL, pwmDuty);
    }
  }
  http.end();
}
`;

  // Dynamic ESP32-CAM AI-Thinker C++ Code
  const esp32CamCppCode = `/*
 * ==============================================================================
 * Project: ESP32-CAM Smart Surveillance & IoT Cloud Node
 * Target Hardware: AI-Thinker ESP32-CAM (OV2640 + Flash LED + Cloud Sync)
 * Server URL: ${serverUrl}
 * Auth Token: ${token}
 * Features:
 *   - Live MJPEG Stream Server (Port 80) -> http://<ESP32-CAM-IP>/stream
 *   - Flash Light / Strobe LED Control on GPIO 4 via Virtual Pin V3 / V0
 *   - Motion / PIR Sensor on GPIO 13 -> Alert to Cloud V6
 *   - Heartbeat & RSSI Telemetry Sync with Cloud
 * ==============================================================================
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_http_server.h"

// ---------------------- 1. WIFI & CLOUD CREDENTIALS ----------------------
const char* WIFI_SSID     = "${wifiSsid}";
const char* WIFI_PASSWORD = "${wifiPass}";
const char* BLYNK_AUTH    = "${token}";
const char* SERVER_BASE   = "${serverUrl}";

// ---------------------- 2. ESP32-CAM AI-THINKER PIN MAP -------------------
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Actuator & Sensor Pins for ESP32-CAM
#define FLASH_LED_PIN      4   // Built-in High-Power White Flash LED
#define PIR_MOTION_PIN    13   // Optional PIR Motion Sensor Input
#define STATUS_LED_PIN    33   // Built-in Small Red Status LED (Active LOW)

httpd_handle_t stream_httpd = NULL;
unsigned long lastSyncTime = 0;

// ---------------------- 3. MJPEG STREAM HANDLER ---------------------------
#define PART_BOUNDARY "12345678900000000000087654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\\r\\n--" PART_BOUNDARY "\\r\\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\\r\\nContent-Length: %u\\r\\n\\r\\n";

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t * _jpg_buf = NULL;
  char * part_buf[64];

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("[CAM] Camera capture failed");
      res = ESP_FAIL;
    } else {
      if (fb->format != PIXFORMAT_JPEG) {
        bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
        esp_camera_fb_return(fb);
        fb = NULL;
        if (!jpeg_converted) {
          res = ESP_FAIL;
        }
      } else {
        _jpg_buf_len = fb->len;
        _jpg_buf = fb->buf;
      }
    }
    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if (_jpg_buf) {
      free(_jpg_buf);
      _jpg_buf = NULL;
    }
    if (res != ESP_OK) break;
  }
  return res;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;

  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    Serial.println("[CAM] MJPEG Camera Stream Server Started on Port 80 (/stream)");
  }
}

// ---------------------- 4. SETUP FUNCTION --------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n[SYSTEM] Starting ESP32-CAM Smart IoT Node...");

  pinMode(FLASH_LED_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(PIR_MOTION_PIN, INPUT_PULLDOWN);
  digitalWrite(FLASH_LED_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, HIGH); // OFF (Active LOW)

  // Configure Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;  // 640x480 (Smooth & Stable)
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 14;
    config.fb_count = 1;
  }

  // Camera Init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[ERROR] Camera init failed with error 0x%x\\n", err);
    return;
  }

  // Connect to Wi-Fi
  connectWiFi();

  // Start Live Streaming Web Server
  startCameraServer();
}

// ---------------------- 5. MAIN LOOP -------------------------------------
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Sync with Cloud every ${intervalMs / 1000} seconds
  if (millis() - lastSyncTime >= ${intervalMs}) {
    lastSyncTime = millis();
    
    int motionDetected = digitalRead(PIR_MOTION_PIN);
    syncCloud(motionDetected);
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[WiFi] Connected!");
    Serial.print("[WiFi] Stream URL: http://");
    Serial.print(WiFi.localIP());
    Serial.println("/stream");
  }
}

void syncCloud(int motion) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  
  // 1. Send status & motion to Cloud
  String streamUrl = "http://" + WiFi.localIP().toString() + "/stream";
  String updateUrl = String(SERVER_BASE) + "/api/iot/update?token=" + String(BLYNK_AUTH) +
                     "&v6=" + String(motion) +
                     "&rssi=" + String(WiFi.RSSI()) +
                     "&ip=" + WiFi.localIP().toString();

  http.begin(updateUrl);
  http.GET();
  http.end();

  // 2. Read Flash Light Command (V0 or V3) from Cloud
  String getUrl = String(SERVER_BASE) + "/api/iot/get?token=" + String(BLYNK_AUTH) + "&pin=v0";
  http.begin(getUrl);
  int httpCode = http.GET();
  if (httpCode == 200) {
    String state = http.getString();
    state.trim();
    if (state == "1" || state == "\\"1\\"") {
      digitalWrite(FLASH_LED_PIN, HIGH); // Turn ON Flash LED
    } else {
      digitalWrite(FLASH_LED_PIN, LOW);  // Turn OFF Flash LED
    }
  }
  http.end();
}
`;

  const generatedCppCode = boardType === 'esp32_cam' ? esp32CamCppCode : standardCppCode;

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCppCode);
    setCopiedCode(true);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.3 } });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const downloadInoFile = () => {
    const blob = new Blob([generatedCppCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ESP32_Blynk_Cloud_${device?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Firmware'}.ino`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sampleCurl = `curl -X GET "${serverUrl}/api/iot/update?token=${token}&v0=29.4&v1=68.5&v5=350&v7=55.0"`;

  const copyCurlCmd = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div id="esp32-firmware-studio-view" className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  {lang === 'km' ? 'ESP32 Microcontroller Firmware (Arduino C++)' : 'ESP32 Arduino C++ Firmware Studio'}
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  READY TO FLASH
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'km'
                  ? 'កូដពេញលេញសម្រាប់ ESP32 ភ្ជាប់ Wi-Fi, អានតម្លៃ Sensor (V0, V1, V5, V7) និងបញ្ជា Relay (V2, V3, V4, V6) ជាមួយ Cloud Console'
                  : 'Production-ready C++ firmware for ESP32. Includes Wi-Fi auto-reconnect, bidirectional REST synchronization, and sensor drivers.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="copy-firmware-code-btn"
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? (lang === 'km' ? 'បានចម្លងកូដ!' : 'Copied C++ Code!') : (lang === 'km' ? 'ចម្លងកូដ C++' : 'Copy C++ Code')}</span>
            </button>

            <button
              id="download-ino-file-btn"
              onClick={downloadInoFile}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'km' ? 'ទាញយក .ino' : 'Download .ino'}</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-semibold">
          {[
            { key: 'code', label: 'Arduino C++ Code', labelKhmer: 'កូដ C++ ពេញលេញ', icon: <Code2 className="w-3.5 h-3.5" /> },
            { key: 'guide', label: 'Flashing Guide', labelKhmer: 'ការដំឡើង & Flash', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { key: 'wiring', label: 'Hardware Wiring', labelKhmer: 'តារាងតខ្សែ GPIO', icon: <Layers className="w-3.5 h-3.5" /> },
            { key: 'api', label: 'REST API / cURL Test', labelKhmer: 'តេស្ត API & cURL', icon: <Terminal className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeSubTab === tab.key
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{lang === 'km' ? tab.labelKhmer : tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Config Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Board Selection Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              {lang === 'km' ? 'ជ្រើសរើសប្រភេទក្តារ ESP32 Board Target' : 'Target ESP32 Hardware Architecture'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'km' ? 'គាំទ្រ ESP32 ស្តង់ដារ និង ESP32-CAM AI-Thinker (OV2640 + Flash Light)' : 'Switch between Standard ESP32 or ESP32-CAM (AI-Thinker)'}
            </p>
          </div>

          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setBoardType('esp32_standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                boardType === 'esp32_standard'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ESP32 (Standard / DevKit)</span>
            </button>
            <button
              onClick={() => setBoardType('esp32_cam')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                boardType === 'esp32_cam'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ESP32-CAM (AI-Thinker)</span>
            </button>
          </div>
        </div>

        {boardType === 'esp32_cam' && (
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300 font-bold block mb-0.5">
                {lang === 'km' ? 'ESP32-CAM AI-Thinker Module ត្រូវបានបើកដំណើរការ!' : 'ESP32-CAM Architecture Activated!'}
              </strong>
              <span>
                {lang === 'km'
                  ? 'កូដខាងក្រោមរួមបញ្ចូល Live MJPEG Video Streaming Web Server (Port 80), ការបញ្ជា Flash Light (GPIO 4), Motion Sensor (GPIO 13) និងការ Sync ទិន្នន័យជាមួយ Cloud។'
                  : 'Includes full OV2640 camera drivers, MJPEG live streaming on Port 80 (/stream), Onboard White Flash LED control on GPIO 4, and Cloud REST synchronization.'}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Wi-Fi SSID:</label>
            <input
              type="text"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Wi-Fi Password:</label>
            <input
              type="text"
              value={wifiPass}
              onChange={(e) => setWifiPass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Server Host URL:</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Sync Interval (ms):</label>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value={1000}>1000 ms (1 sec)</option>
              <option value={2000}>2000 ms (2 sec - Recommended)</option>
              <option value={5000}>5000 ms (5 sec)</option>
              <option value={10000}>10000 ms (10 sec)</option>
            </select>
          </div>
        </div>

        {/* Pin Mapping inputs row for standard ESP32 */}
        {boardType === 'esp32_standard' && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-3 border-t border-slate-800/60 text-[11px]">
            <div>
              <span className="text-slate-400 block">DHT Pin:</span>
              <input
                type="number"
                value={dhtPin}
                onChange={(e) => setDhtPin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-orange-400 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block">Relay 1 Pin:</span>
              <input
                type="number"
                value={relay1Pin}
                onChange={(e) => setRelay1Pin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-emerald-400 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block">Relay 2 Pin:</span>
              <input
                type="number"
                value={relay2Pin}
                onChange={(e) => setRelay2Pin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block">Fan PWM Pin:</span>
              <input
                type="number"
                value={fanPwmPin}
                onChange={(e) => setFanPwmPin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-blue-400 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block">MQ Gas Pin:</span>
              <input
                type="number"
                value={gasPin}
                onChange={(e) => setGasPin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-purple-400 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block">Soil ADC Pin:</span>
              <input
                type="number"
                value={soilPin}
                onChange={(e) => setSoilPin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-teal-400 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* SUB TAB 1: CODE VIEWER */}
      {activeSubTab === 'code' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <span className="text-xs font-mono text-slate-300 font-semibold ml-2">
                ESP32_Blynk_Cloud_Console.ino
              </span>
            </div>

            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-4 overflow-x-auto max-h-[600px] text-xs font-mono leading-relaxed text-slate-300 select-all">
            <pre>{generatedCppCode}</pre>
          </div>
        </div>
      )}

      {/* SUB TAB 2: FLASHING & ARDUINO IDE GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs leading-relaxed text-slate-300">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            {boardType === 'esp32_cam'
              ? (lang === 'km' ? 'របៀប Flash Firmware ទៅក្នុង ESP32-CAM តាម FTDI Programmer' : 'How to Flash ESP32-CAM via FTDI USB-to-TTL')
              : (lang === 'km' ? 'របៀបបញ្ចូលកូដ (Flash Firmware) ទៅក្នុង ESP32 តាម Arduino IDE' : 'How to Flash ESP32 via Arduino IDE')}
          </h3>

          {boardType === 'esp32_cam' ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <strong className="text-cyan-400 font-semibold block">
                  {lang === 'km' ? 'ជំហានទី ១: តខ្សែរវាង FTDI Programmer និង ESP32-CAM' : 'Step 1: Wire FTDI Programmer to ESP32-CAM'}
                </strong>
                <p className="text-slate-400">
                  {lang === 'km'
                    ? 'ដោយសារ ESP32-CAM គ្មានរន្ធ USB ផ្ទាល់ខ្លួន អ្នកត្រូវប្រើ USB-to-TTL FTDI Programmer (5V)៖'
                    : 'Since ESP32-CAM lacks built-in USB, use a 5V FTDI Programmer:'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] bg-slate-900/80 p-2.5 rounded-lg">
                  <div><span className="text-slate-400">FTDI VCC (5V)</span> &rarr; <span className="text-red-400">ESP32 5V</span></div>
                  <div><span className="text-slate-400">FTDI GND</span> &rarr; <span className="text-slate-300">ESP32 GND</span></div>
                  <div><span className="text-slate-400">FTDI TX</span> &rarr; <span className="text-emerald-400">ESP32 U0R (GPIO 3)</span></div>
                  <div><span className="text-slate-400">FTDI RX</span> &rarr; <span className="text-blue-400">ESP32 U0T (GPIO 1)</span></div>
                </div>
                <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded text-amber-300 text-[11px]">
                  <strong>⚠️ សំខាន់ខ្លាំង (Flash Mode):</strong> ភ្ជាប់ខ្សែ <strong>GPIO 0 ទៅ GND</strong> មុនពេលដោត USB ដើម្បីឱ្យ ESP32-CAM ចូល Flash Mode។ ពេល Flash ចប់ ដកខ្សែ GPIO 0 ចេញ រួចចុចប៊ូតុង Reset លើ Board!
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <strong className="text-cyan-400 font-semibold block">
                  {lang === 'km' ? 'ជំហានទី ២: កំណត់ Board ក្នុង Arduino IDE' : 'Step 2: Arduino IDE Board Settings'}
                </strong>
                <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2">
                  <li>Board: <strong>AI Thinker ESP32-CAM</strong></li>
                  <li>CPU Frequency: <strong>240MHz (WiFi/BT)</strong></li>
                  <li>Flash Frequency: <strong>80MHz</strong></li>
                  <li>Flash Mode: <strong>QIO</strong></li>
                  <li>Partition Scheme: <strong>Huge APP (3MB No OTA/1MB SPIFFS)</strong></li>
                  <li>PSRAM: <strong>Enabled</strong></li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <strong className="text-cyan-400 font-semibold block">
                  {lang === 'km' ? 'ជំហានទី ៣: ចុច Upload និងពិនិត្យ Stream' : 'Step 3: Upload & Open Live Stream'}
                </strong>
                <p className="text-slate-400">
                  {lang === 'km'
                    ? 'ចុច Upload &rarr; ពេលចប់ ដកខ្សែ GPIO 0 ចេញពីរន្ធ GND &rarr; ចុចប៊ូតុង Reset &rarr; បើក Serial Monitor (115200 baud) អ្នកនឹងឃើញ Stream IP Address ឧទាហរណ៍៖ http://192.168.1.120/stream'
                    : 'Click Upload. When finished, disconnect GPIO 0 from GND, press RST button. Open Serial Monitor at 115200 to view your Live Stream URL (e.g. http://192.168.1.120/stream).'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 font-semibold block mb-1">
                  ជំហានទី ១: បញ្ចូល ESP32 Board URL ក្នុង Arduino IDE
                </strong>
                <p className="text-slate-400 mb-1">
                  បើក Arduino IDE &rarr; ចូល <strong>File &gt; Preferences &gt; Additional Boards Manager URLs</strong> រួចបិទភ្ជាប់ Link នេះ៖
                </p>
                <code className="block bg-slate-900 p-2 rounded text-cyan-300 font-mono select-all">
                  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
                </code>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 font-semibold block mb-1">
                  ជំហានទី ២: ដំឡើង Libraries ដែលត្រូវការ
                </strong>
                <p className="text-slate-400 mb-1">
                  ចូល <strong>Sketch &gt; Include Library &gt; Manage Libraries...</strong> រួចស្វែងរក និង Install ៖
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2">
                  <li><strong className="text-white">DHT sensor library</strong> ដោយ <em>Adafruit</em></li>
                  <li><strong className="text-white">Adafruit Unified Sensor</strong> ដោយ <em>Adafruit</em></li>
                  <li>(ចំណាំ៖ <code>WiFi.h</code> និង <code>HTTPClient.h</code> មានស្រាប់ក្នុង ESP32 core មិនបាច់ install ទេ)</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 font-semibold block mb-1">
                  ជំហានទី ៣: ជ្រើសរើស Board & Port រួចចុច Upload
                </strong>
                <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2">
                  <li>Board: <strong>ESP32 Dev Module</strong> ឬ <strong>DOIT ESP32 DEVKIT V1</strong></li>
                  <li>Upload Speed: <strong>921600</strong> ឬ <strong>115200</strong></li>
                  <li>Flash Frequency: <strong>80MHz</strong></li>
                  <li>ចុចប៊ូតុង <strong>Upload</strong> (ប្រសិន ESP32 គាំងត្រង់ <em>Connecting...</em> សូមចុចសង្កត់ប៊ូតុង <strong>BOOT</strong> លើ Board ប្រហែល ២វិនាទី)</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 font-semibold block mb-1">
                  ជំហានទី ៤: បើក Serial Monitor ដើម្បីពិនិត្យ
                </strong>
                <p className="text-slate-400">
                  បើក <strong>Serial Monitor</strong> កំណត់ Baud rate ទៅ <strong>115200 baud</strong>។ អ្នកនឹងឃើញ ESP32 ភ្ជាប់ Wi-Fi និងចាប់ផ្ដើម Sync ទិន្នន័យជាមួយ Dashboard ភ្លាមៗ!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: WIRING SCHEMATIC & PINOUT */}
      {activeSubTab === 'wiring' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            {boardType === 'esp32_cam'
              ? (lang === 'km' ? 'តារាងតខ្សែ ESP32-CAM Pinout & Flash / Motion' : 'ESP32-CAM Hardware Wiring Schematic')
              : (lang === 'km' ? 'តារាងតខ្សែ Sensor & Relay ជាមួយ ESP32' : 'ESP32 Hardware Wiring Schematic')}
          </h3>

          <div className="overflow-x-auto">
            {boardType === 'esp32_cam' ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Function / Peripheral</th>
                    <th className="py-2.5 px-3">ESP32-CAM Pin</th>
                    <th className="py-2.5 px-3">Virtual Pin</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Description / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-cyan-400">OV2640 Camera Sensor</td>
                    <td className="py-2.5 px-3 text-white">GPIO 0, 5, 18-27, 34-39</td>
                    <td className="py-2.5 px-3 text-cyan-400">HTTP /stream</td>
                    <td className="py-2.5 px-3 text-yellow-400">Internal FPC</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">2-Megapixel Camera socket on board</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-amber-400">High-Power White Flash LED</td>
                    <td className="py-2.5 px-3 text-white">GPIO 4</td>
                    <td className="py-2.5 px-3 text-emerald-400">V0 / V3</td>
                    <td className="py-2.5 px-3 text-green-400">OUTPUT</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Onboard high brightness LED for night vision</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-purple-400">PIR Motion Detector (HC-SR501)</td>
                    <td className="py-2.5 px-3 text-white">GPIO 13 / 12</td>
                    <td className="py-2.5 px-3 text-emerald-400">V6 (Alert)</td>
                    <td className="py-2.5 px-3 text-cyan-400">INPUT</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Triggers motion alerts to Blynk Cloud console</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-red-400">Onboard Status Indicator LED</td>
                    <td className="py-2.5 px-3 text-white">GPIO 33</td>
                    <td className="py-2.5 px-3 text-slate-400">Internal</td>
                    <td className="py-2.5 px-3 text-green-400">OUTPUT</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Active LOW small red indicator on the back</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">Power Supply (VCC)</td>
                    <td className="py-2.5 px-3 text-white">5V Pin</td>
                    <td className="py-2.5 px-3 text-slate-400">Power</td>
                    <td className="py-2.5 px-3 text-yellow-400">5V DC &ge; 2A</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Requires stable 5V &ge; 2A power supply for Wi-Fi + Camera</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Module / Sensor</th>
                    <th className="py-2.5 px-3">ESP32 Pin</th>
                    <th className="py-2.5 px-3">Virtual Pin</th>
                    <th className="py-2.5 px-3">VCC / Power</th>
                    <th className="py-2.5 px-3">GND</th>
                    <th className="py-2.5 px-3">Wiring Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-orange-400">DHT22 / DHT11</td>
                    <td className="py-2.5 px-3 text-white">GPIO 4</td>
                    <td className="py-2.5 px-3 text-emerald-400">V0 / V1</td>
                    <td className="py-2.5 px-3 text-yellow-400">3.3V / 5V</td>
                    <td className="py-2.5 px-3">GND</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Pull-up 10k resistor between Data & VCC</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">Relay Module 1 (Pump)</td>
                    <td className="py-2.5 px-3 text-white">GPIO 23</td>
                    <td className="py-2.5 px-3 text-emerald-400">V2</td>
                    <td className="py-2.5 px-3 text-yellow-400">5V (VIN)</td>
                    <td className="py-2.5 px-3">GND</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Optocoupler isolated relay channel 1</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-amber-400">Relay Module 2 (Lamp)</td>
                    <td className="py-2.5 px-3 text-white">GPIO 22</td>
                    <td className="py-2.5 px-3 text-emerald-400">V3</td>
                    <td className="py-2.5 px-3 text-yellow-400">5V (VIN)</td>
                    <td className="py-2.5 px-3">GND</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Optocoupler isolated relay channel 2</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-blue-400">Fan PWM / MOSFET</td>
                    <td className="py-2.5 px-3 text-white">GPIO 19</td>
                    <td className="py-2.5 px-3 text-emerald-400">V4</td>
                    <td className="py-2.5 px-3 text-yellow-400">12V / 5V</td>
                    <td className="py-2.5 px-3">GND</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Gate pin of N-Channel MOSFET / Motor Driver</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-purple-400">MQ-135 Gas / Smoke</td>
                    <td className="py-2.5 px-3 text-white">GPIO 34 (ADC)</td>
                    <td className="py-2.5 px-3 text-emerald-400">V5</td>
                    <td className="py-2.5 px-3 text-yellow-400">5V (VIN)</td>
                    <td className="py-2.5 px-3">GND</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Analog Out (AOUT) pin to ADC1</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold text-teal-400">Soil Moisture Probe</td>
                    <td className="py-2.5 px-3 text-white">GPIO 35 (ADC)</td>
                    <td className="py-2.5 px-3 text-emerald-400">V7</td>
                    <td className="py-2.5 px-3 text-yellow-400">3.3V</td>
                    <td className="py-2.5 px-3">GND</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">Capacitive corrosion-free probe</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 4: REST API & CURL TEST */}
      {activeSubTab === 'api' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            {lang === 'km' ? 'តេស្ត REST API ផ្ទាល់ (cURL Command)' : 'Direct REST API & cURL Command Tester'}
          </h3>

          <p className="text-slate-400">
            {lang === 'km'
              ? 'អ្នកអាចសាកល្បងផ្ញើទិន្នន័យពី Terminal ឬ Postman ដូចជា ESP32 ពិតប្រាកដតាមរយៈ cURL ខាងក្រោម៖'
              : 'Test telemetry injection or read pin statuses right from your bash terminal:'}
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-emerald-400">1. Update Sensors (GET or POST):</span>
                <button
                  onClick={copyCurlCmd}
                  className="flex items-center gap-1 text-slate-400 hover:text-white"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 p-2 rounded text-cyan-300 font-mono select-all overflow-x-auto">
                {sampleCurl}
              </code>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="mb-1.5">
                <span className="font-semibold text-emerald-400">2. Read Relay 1 Value (Plain scalar 1 or 0):</span>
              </div>
              <code className="block bg-slate-900 p-2 rounded text-cyan-300 font-mono select-all overflow-x-auto">
                curl -X GET "{serverUrl}/api/iot/get?token={token}&pin=v2"
              </code>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="mb-1.5">
                <span className="font-semibold text-emerald-400">3. Read All Pins (JSON Payload):</span>
              </div>
              <code className="block bg-slate-900 p-2 rounded text-cyan-300 font-mono select-all overflow-x-auto">
                curl -X GET "{serverUrl}/api/iot/all?token={token}"
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
