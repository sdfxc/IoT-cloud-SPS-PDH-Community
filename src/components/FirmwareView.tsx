import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  Sliders,
  KeyRound,
  FileCode,
  Radio,
  Send,
  MessageSquare,
  Bot,
  BellRing,
  ExternalLink,
  ShieldAlert,
  Save,
  RotateCcw,
  Power,
  Flame,
  Lightbulb,
  Zap,
  Globe,
  Smartphone,
  Laptop,
  Usb,
  AlertTriangle,
  RefreshCw,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FirmwareViewProps {
  device: IoTDevice | null;
  lang: 'km' | 'en';
}

export const FirmwareView: React.FC<FirmwareViewProps> = ({ device, lang }) => {
  const [boardType, setBoardType] = useState<
    'esp32_cam' | 'esp32_blynk_lib' | 'esp32_standard' | 'esp8266_nodemcu' | 'esp32_c3' | 'arduino_uno_wifi'
  >('esp32_cam');
  
  // Load saved configuration from localStorage
  const getStored = (key: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || fallback;
    }
    return fallback;
  };

  // Blynk Credentials
  const [blynkTemplateId, setBlynkTemplateId] = useState(
    () => getStored('sps_peh_template_id', device?.templateId || 'TMPL_SMART_LAMP_MQ135')
  );
  const [blynkTemplateName, setBlynkTemplateName] = useState(
    () => getStored('sps_peh_template_name', device?.name || 'Smart_Lamp & MQ135')
  );
  const [blynkAuthToken, setBlynkAuthToken] = useState(
    () => getStored('sps_peh_auth_token', device?.authToken || 'YFr7r30K8HV8rRQ7x59hYojzeU0m9wYs')
  );

  // Telegram Credentials
  const [telegramBotToken, setTelegramBotToken] = useState(
    () => getStored('sps_peh_telegram_bot_token', '8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY')
  );
  const [telegramChatId, setTelegramChatId] = useState(
    () => getStored('sps_peh_telegram_chat_id', '5780071626')
  );
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const [wifiSsid, setWifiSsid] = useState(
    () => getStored('sps_peh_wifi_ssid', 'SMART-WIFI-B339')
  );
  const [wifiPass, setWifiPass] = useState(
    () => getStored('sps_peh_wifi_pass', '5E85D60F')
  );
  const [serverUrl, setServerUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://your-app.run.app'
  );
  const [intervalMs, setIntervalMs] = useState(2000);
  const [lampPin, setLampPin] = useState(
    () => Number(getStored('sps_peh_lamp_pin', '12'))
  );
  const [mq135Pin, setMq135Pin] = useState(
    () => Number(getStored('sps_peh_mq135_pin', '14'))
  );
  const [relayActiveLow, setRelayActiveLow] = useState(true);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDefines, setCopiedDefines] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'remote' | 'code' | 'telegram' | 'guide' | 'wiring' | 'api'>('editor');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Auto-save all configuration changes into localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sps_peh_template_id', blynkTemplateId);
      localStorage.setItem('sps_peh_template_name', blynkTemplateName);
      localStorage.setItem('sps_peh_auth_token', blynkAuthToken);
      localStorage.setItem('sps_peh_telegram_bot_token', telegramBotToken);
      localStorage.setItem('sps_peh_telegram_chat_id', telegramChatId);
      localStorage.setItem('sps_peh_wifi_ssid', wifiSsid);
      localStorage.setItem('sps_peh_wifi_pass', wifiPass);
      localStorage.setItem('sps_peh_lamp_pin', String(lampPin));
      localStorage.setItem('sps_peh_mq135_pin', String(mq135Pin));
    }
  }, [blynkTemplateId, blynkTemplateName, blynkAuthToken, telegramBotToken, telegramChatId, wifiSsid, wifiPass, lampPin, mq135Pin]);

  const triggerSaveNotification = (message: string) => {
    setSaveToast(message);
    setTimeout(() => {
      setSaveToast(null);
    }, 3000);
  };

  // --- LIVE IN-APP CODE EDITOR STATE ---
  const [customCode, setCustomCode] = useState<string>('');
  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const [codeSavedNotification, setCodeSavedNotification] = useState(false);
  const [editorTemplatePreset, setEditorTemplatePreset] = useState<
    'esp32_cam_smartlamp' | 'esp32_30pin_alert' | 'esp32_30pin_smartbin' | 'esp32_30pin_irrigation' | 'esp32_30pin_traffic' | 'esp32_direct_webserver' | 'esp32c3_smartbin_dualwall' | 'esp32_school_lights'
  >('esp32c3_smartbin_dualwall');

  // --- REMOTE CHIP CONTROLLER STATE ---
  const [remoteLampState, setRemoteLampState] = useState<number>(
    device?.pins.V0 ? Number(device.pins.V0.value) : 0
  );
  const [remoteFlashState, setRemoteFlashState] = useState<number>(0);
  const [remoteGasSimState, setRemoteGasSimState] = useState<number>(
    device?.pins.V1 ? Number(device.pins.V1.value) : 0
  );
  const [chipTargetIp, setChipTargetIp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sps_peh_chip_ip') || device?.ipAddress || '192.168.0.169';
    }
    return device?.ipAddress || '192.168.0.169';
  });
  const [remoteDispatchMode, setRemoteDispatchMode] = useState<'blynk_cloud' | 'local_ip' | 'web_serial'>('blynk_cloud');
  const [remoteStatusMessage, setRemoteStatusMessage] = useState<string | null>(null);
  const [remoteDispatching, setRemoteDispatching] = useState<boolean>(false);

  // Web Serial API state
  const [serialPort, setSerialPort] = useState<any>(null);
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [serialInput, setSerialInput] = useState<string>('');
  const serialReaderRef = useRef<any>(null);

  // Sync state if device props update
  useEffect(() => {
    if (device?.pins.V0 !== undefined) {
      setRemoteLampState(Number(device.pins.V0.value));
    }
    if (device?.pins.V1 !== undefined) {
      setRemoteGasSimState(Number(device.pins.V1.value));
    }
  }, [device]);

  // 1. ESP32-CAM AI-Thinker Code with Dual-Mode AP+STA + Captive Portal + Telegram
  const esp32CamSmartLampCode = `/*
 * ==============================================================================
 * Project: Smart_Lamp & MQ135 Air Sensor on ESP32-CAM (Dual-Mode AP+STA)
 * Hardware: ESP32-CAM (AI-Thinker)
 * Wi-Fi: AP (192.168.0.169) + STA (Router) + Captive Portal (Port 53)
 * Telegram Alerts: Enabled (Instant Alert on Lamp Toggle & MQ135 Gas Detection)
 * ==============================================================================
 */

// 1. Blynk Cloud Template Credentials (Must be at the very top)
#define BLYNK_TEMPLATE_ID    "${blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME  "${blynkTemplateName}"
#define BLYNK_AUTH_TOKEN     "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h>
#include <BlynkSimpleEsp32.h>

// ---------------------- 2. WIFI CREDENTIALS & DUAL-MODE SETUP -----------------
const char* ap_ssid = "SmartLamp-ESP32CAM";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";

const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

// ---------------------- 3. HARDWARE GPIO PIN DEFINITIONS ----------------------
#define SMART_LAMP_PIN       ${lampPin}   // GPIO ${lampPin} for Smart_Lamp Relay (V0)
#define MQ135_PIN            ${mq135Pin}   // GPIO ${mq135Pin} (Digital Input / DO) for MQ-135 (V1)
#define ONBOARD_FLASH_LED     4   // Built-in Flash LED on GPIO 4

WebServer server(80);
DNSServer dnsServer;
BlynkTimer timer;
bool lastAlarmSent = false;
unsigned long lastTgMsgTime = 0;
bool lampState = false;

// ---------------------- 4. TELEGRAM SENDER FUNCTION --------------------------
void sendTelegramAlert(String message) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure(); // Skip SSL certificate check
  HTTPClient https;
  String url = "https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + 
               "/sendMessage?chat_id=" + String(TELEGRAM_CHAT_ID) + 
               "&text=" + urlEncode(message) + "&parse_mode=HTML";
  https.begin(client, url);
  https.GET();
  https.end();
}

// ---------------------- 5. HTTP WEB SERVER & CAPTIVE PORTAL ------------------
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>ESP32-CAM Smart Lamp Dashboard</title>";
  html += "<style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;text-align:center;padding:25px;margin:0;}";
  html += ".card{background:#1e293b;border-radius:18px;padding:24px;max-width:440px;margin:auto;border:1px solid #334155;box-shadow:0 10px 25px rgba(0,0,0,0.5);}";
  html += ".btn{display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#fff;border-radius:12px;text-decoration:none;margin:8px;border:none;cursor:pointer;}";
  html += ".btn-on{background:#10b981;} .btn-off{background:#ef4444;} .status-box{padding:12px;background:#0f172a;border-radius:10px;margin:15px 0;font-size:14px;}</style></head><body>";
  html += "<div class='card'>";
  html += "<h2 style='color:#38bdf8;margin-top:0;'>💡 SPS-PEH Smart Lamp & MQ135</h2>";
  html += "<p style='color:#94a3b8;font-size:13px;'>Dual-Mode: <b>AP (192.168.0.169)</b> + <b>STA Router</b></p>";
  html += "<div class='status-box'>";
  html += "<p style='margin:4px 0;'>Lamp Relay: " + String(lampState ? "<b style='color:#10b981'>ON (បើក)</b>" : "<b style='color:#ef4444'>OFF (បិទ)</b>") + "</p>";
  html += "<p style='margin:4px 0;'>MQ-135 Gas: " + String(digitalRead(MQ135_PIN) == LOW ? "<b style='color:#ef4444'>HAZARD ALERT</b>" : "<b style='color:#10b981'>NORMAL (SAFE)</b>") + "</p>";
  html += "<p style='margin:4px 0;'>WiFi Mode: <b>WIFI_AP_STA (Captive Portal 53)</b></p>";
  html += "</div>";
  html += "<a href='/on' class='btn btn-on'>💡 បើកភ្លើង (TURN ON)</a>";
  html += "<a href='/off' class='btn btn-off'>⭕ បិទភ្លើង (TURN OFF)</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (server.hasArg("val")) {
    int val = server.arg("val").toInt();
    lampState = (val == 1);
    digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'lampState ? LOW : HIGH' : 'lampState ? HIGH : LOW'});
    digitalWrite(ONBOARD_FLASH_LED, lampState ? HIGH : LOW);
    Blynk.virtualWrite(V0, val);
    server.send(200, "application/json", "{\\"success\\":true,\\"lamp\\":" + String(val) + "}");
    return;
  }
  server.send(400, "text/plain", "Missing val parameter");
}

void handleOn() {
  lampState = true;
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'LOW' : 'HIGH'});
  digitalWrite(ONBOARD_FLASH_LED, HIGH);
  Blynk.virtualWrite(V0, 1);
  sendTelegramAlert("💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបើក (ON) ✅");
  handleRoot();
}

void handleOff() {
  lampState = false;
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'HIGH' : 'LOW'});
  digitalWrite(ONBOARD_FLASH_LED, LOW);
  Blynk.virtualWrite(V0, 0);
  sendTelegramAlert("💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបិទ (OFF) ⭕");
  handleRoot();
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\\"status\\":\\"online\\",\\"device\\":\\"SmartLamp-ESP32CAM\\",\\"mode\\":\\"WIFI_AP_STA\\",";
  json += "\\"ap_ip\\":\\"" + WiFi.softAPIP().toString() + "\\",";
  json += "\\"sta_ip\\":\\"" + WiFi.localIP().toString() + "\\",";
  json += "\\"lamp\\":" + String(lampState ? 1 : 0) + ",";
  json += "\\"mq135\\":" + String(digitalRead(MQ135_PIN) == LOW ? 1 : 0) + ",";
  json += "\\"rssi\\":" + String(WiFi.RSSI()) + "}";
  server.send(200, "application/json", json);
}

// ---------------------- 6. BLYNK VIRTUAL PIN LISTENERS -----------------------
BLYNK_WRITE(V0) {
  int val = param.asInt();
  lampState = (val == 1);
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'lampState ? LOW : HIGH' : 'lampState ? HIGH : LOW'});
  digitalWrite(ONBOARD_FLASH_LED, lampState ? HIGH : LOW);
  String statusMsg = lampState 
    ? "💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបើក (ON) ✅"
    : "💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបិទ (OFF) ⭕";
  sendTelegramAlert(statusMsg);
}

// ---------------------- 7. SENSOR TELEMETRY & ALARM SENDER -------------------
void sendMQ135Telemetry() {
  int gasDigital = digitalRead(MQ135_PIN);
  bool isGasAlert = (gasDigital == LOW);
  Blynk.virtualWrite(V1, isGasAlert ? 1 : 0);
  Blynk.virtualWrite(V8, WiFi.RSSI());

  if (isGasAlert) {
    if (!lastAlarmSent || (millis() - lastTgMsgTime > 60000)) {
      lastAlarmSent = true;
      lastTgMsgTime = millis();
      sendTelegramAlert("⚠️ <b>[ESP32-CAM MQ-135 អាសន្នផ្សែងពុល]</b>\\n🚨 រកឃើញមានផ្សែងពុល!\\n📍 ESP32-CAM Pin ${mq135Pin}");
    }
  } else {
    if (lastAlarmSent) {
      lastAlarmSent = false;
      sendTelegramAlert("✅ <b>[ESP32-CAM MQ-135 សុវត្ថិភាពឡើងវិញ]</b>\\n🌿 កម្រិតខ្យល់មានសុវត្ថិភាព!");
    }
  }
}

// ---------------------- 8. SETUP ---------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(SMART_LAMP_PIN, OUTPUT);
  pinMode(MQ135_PIN, INPUT_PULLUP);
  pinMode(ONBOARD_FLASH_LED, OUTPUT);
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'HIGH' : 'LOW'});
  digitalWrite(ONBOARD_FLASH_LED, LOW);

  // 1. Dual-Mode Wi-Fi Architecture (WIFI_AP_STA)
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  Serial.println("[Wi-Fi] AP Mode Created: " + String(ap_ssid) + " (IP: " + WiFi.softAPIP().toString() + ")");

  // 2. Start Captive Portal DNS Server on Port 53
  dnsServer.start(53, "*", apIP);

  // 3. Connect to Home Router Wi-Fi & Blynk Cloud
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  // 4. Register HTTP Web Server Endpoints
  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.on("/status", handleStatus);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Redirecting to Captive Portal");
  });
  server.begin();

  sendTelegramAlert("🚀 <b>[ESP32-CAM]</b> Dual-Mode AP+STA + Captive Portal ដំណើរការជោគជ័យ! ✅\\nIP: 192.168.0.169");
  timer.setInterval(${intervalMs}L, sendMQ135Telemetry);
}

// ---------------------- 9. MAIN LOOP -----------------------------------------
void loop() {
  dnsServer.processNextRequest(); // Handle Captive Portal Redirects
  server.handleClient();          // Handle Direct Web Server Requests
  Blynk.run();                    // Sync with Blynk Cloud
  timer.run();
}
`;

  // 2. Device 1: Alert System (ESP32 30-Pin)
  const esp32AlertSystemCode = `/*
 * ==============================================================================
 * Project: Device 1 - Alert System on ESP32 30-Pin (Dual-Mode AP+STA)
 * Hardware: ESP32-WROOM-32D 30-Pin
 * Sensors: MQ-2 Gas (GPIO 34 ADC), Air Pressure (GPIO 21), Water Level (GPIO 35)
 * Actuators: Siren Buzzer (GPIO 2), Strobe LED (GPIO 22), Exhaust Fan PWM (GPIO 19)
 * Wi-Fi: AP (192.168.0.169) + STA (Router) + Captive Portal (Port 53)
 * Telegram Alerts: Enabled
 * ==============================================================================
 */
#define BLYNK_TEMPLATE_ID    "TMPL_ALERT_SYSTEM"
#define BLYNK_TEMPLATE_NAME  "Alert System"
#define BLYNK_AUTH_TOKEN     "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h>
#include <BlynkSimpleEsp32.h>

// Wi-Fi Credentials
const char* ap_ssid = "AlertSystem-ESP32";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";
const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

// Hardware 30-Pin GPIOs
#define PIN_MQ2_GAS          34   // ADC Input for MQ-2 (V0)
#define PIN_PRESSURE         21   // Pressure Sensor (V1)
#define PIN_WATER_LEVEL      35   // Water Level Sensor (V2)
#define PIN_STROBE_LIGHT     22   // Strobe LED Light (V3)
#define PIN_FAN_PWM          19   // Fan Speed PWM (V4)
#define PIN_SIREN_BUZZER      2   // Emergency Siren Buzzer (V6)

WebServer server(80);
DNSServer dnsServer;
BlynkTimer timer;
bool sirenState = false;
bool strobeState = false;
int fanSpeed = 80;
unsigned long lastTgMsgTime = 0;

void sendTelegramAlert(String message) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = "https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + 
               "/sendMessage?chat_id=" + String(TELEGRAM_CHAT_ID) + 
               "&text=" + urlEncode(message) + "&parse_mode=HTML";
  https.begin(client, url);
  https.GET();
  https.end();
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Alert System ESP32 Dashboard</title>";
  html += "<style>body{font-family:sans-serif;background:#0f172a;color:#fff;text-align:center;padding:20px;}";
  html += ".card{background:#1e293b;border-radius:16px;padding:20px;max-width:440px;margin:auto;border:1px solid #334155;}";
  html += ".btn{display:inline-block;padding:12px 20px;margin:6px;border-radius:10px;font-weight:bold;color:#fff;text-decoration:none;}";
  html += ".btn-danger{background:#ef4444;} .btn-safe{background:#10b981;} .btn-warn{background:#f59e0b;}</style></head><body>";
  html += "<div class='card'><h2>🚨 Alert System (ESP32 30-Pin)</h2>";
  html += "<p style='color:#94a3b8;'>Dual-Mode: <b>192.168.0.169</b> + Home Wi-Fi</p>";
  html += "<div style='background:#0f172a;padding:12px;border-radius:10px;margin:12px 0;'>";
  html += "<p>Siren Status: " + String(sirenState ? "<b style='color:#ef4444'>ALARM ON</b>" : "<b style='color:#10b981'>OFF</b>") + "</p>";
  html += "<p>Strobe Light: " + String(strobeState ? "<b style='color:#f59e0b'>ACTIVE</b>" : "<b style='color:#64748b'>IDLE</b>") + "</p>";
  html += "<p>Fan Speed: <b>" + String(fanSpeed) + "%</b></p>";
  html += "</div>";
  html += "<a href='/control?pin=v6&val=1' class='btn btn-danger'>🚨 បើកស៊ីរ៉ែន (Siren ON)</a>";
  html += "<a href='/control?pin=v6&val=0' class='btn btn-safe'>បិទស៊ីរ៉ែន (Siren OFF)</a>";
  html += "<a href='/control?pin=v3&val=1' class='btn btn-warn'>ភ្លើងសញ្ញា (Strobe)</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String pin = server.arg("pin");
  int val = server.arg("val").toInt();
  if (pin == "v6" || pin == "V6") {
    sirenState = (val == 1);
    digitalWrite(PIN_SIREN_BUZZER, sirenState ? HIGH : LOW);
    Blynk.virtualWrite(V6, val);
    if (sirenState) sendTelegramAlert("🚨 <b>[Alert System]</b> ស៊ីរ៉ែនប្រកាសអាសន្នត្រូវបានបើក!");
  } else if (pin == "v3" || pin == "V3") {
    strobeState = (val == 1);
    digitalWrite(PIN_STROBE_LIGHT, strobeState ? HIGH : LOW);
    Blynk.virtualWrite(V3, val);
  } else if (pin == "v4" || pin == "V4") {
    fanSpeed = val;
    analogWrite(PIN_FAN_PWM, map(val, 0, 100, 0, 255));
    Blynk.virtualWrite(V4, val);
  }
  server.send(200, "application/json", "{\\"success\\":true}");
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\\"device\\":\\"AlertSystem-ESP32\\",\\"mode\\":\\"WIFI_AP_STA\\",";
  json += "\\"gas_co\\":" + String(analogRead(PIN_MQ2_GAS)) + ",";
  json += "\\"siren\\":" + String(sirenState ? 1 : 0) + ",";
  json += "\\"strobe\\":" + String(strobeState ? 1 : 0) + ",";
  json += "\\"fan\\":" + String(fanSpeed) + "}";
  server.send(200, "application/json", json);
}

// Blynk writes
BLYNK_WRITE(V6) {
  sirenState = (param.asInt() == 1);
  digitalWrite(PIN_SIREN_BUZZER, sirenState ? HIGH : LOW);
}
BLYNK_WRITE(V3) {
  strobeState = (param.asInt() == 1);
  digitalWrite(PIN_STROBE_LIGHT, strobeState ? HIGH : LOW);
}
BLYNK_WRITE(V4) {
  fanSpeed = param.asInt();
  analogWrite(PIN_FAN_PWM, map(fanSpeed, 0, 100, 0, 255));
}

void checkSensors() {
  int gasVal = analogRead(PIN_MQ2_GAS);
  Blynk.virtualWrite(V0, map(gasVal, 0, 4095, 0, 500));
  Blynk.virtualWrite(V2, map(analogRead(PIN_WATER_LEVEL), 0, 4095, 0, 100));

  if (gasVal > 2500 && (millis() - lastTgMsgTime > 60000)) {
    lastTgMsgTime = millis();
    sendTelegramAlert("⚠️ <b>[Alert System អាសន្នឧស្ម័ន/ផ្សែង!]</b>\\n🔥 រកឃើញកម្រិតឧស្ម័នខ្ពស់ខ្លាំង!\\n💨 ស៊ីរ៉ែន & កង្ហារត្រូវបានបើកស្វ័យប្រវត្តិ!");
    digitalWrite(PIN_SIREN_BUZZER, HIGH);
    analogWrite(PIN_FAN_PWM, 255);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MQ2_GAS, INPUT);
  pinMode(PIN_WATER_LEVEL, INPUT);
  pinMode(PIN_STROBE_LIGHT, OUTPUT);
  pinMode(PIN_FAN_PWM, OUTPUT);
  pinMode(PIN_SIREN_BUZZER, OUTPUT);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  dnsServer.start(53, "*", apIP);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.on("/status", handleStatus);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Redirecting");
  });
  server.begin();

  timer.setInterval(2000L, checkSensors);
  sendTelegramAlert("🚀 <b>[Alert System ESP32 30-Pin]</b> Online! IP: 192.168.0.169");
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  Blynk.run();
  timer.run();
}
`;

  // 3. Device 2: Smart Bin (ESP32 30-Pin / C3)
  const esp32SmartBinCode = `/*
 * ==============================================================================
 * Project: Device 2 - Smart Bin on ESP32 30-Pin / ESP32-C3 (Dual-Mode AP+STA)
 * Hardware: ESP32 30-Pin / ESP32-C3
 * Sensors: Ultrasonic Dry (Trig 14, Echo 35), Ultrasonic Wet (Trig 27, Echo 34), Odor Gas (GPIO 32)
 * Actuators: Servo Lid Motor (GPIO 18), Spray Relay (GPIO 23)
 * Wi-Fi: AP (192.168.0.169) + STA (Router) + Captive Portal (Port 53)
 * Telegram Alerts: Enabled (Alert when Bin > 80% Full or Odor Detected)
 * ==============================================================================
 */
#define BLYNK_TEMPLATE_ID    "TMPL_SMART_BIN"
#define BLYNK_TEMPLATE_NAME  "Smart Bin"
#define BLYNK_AUTH_TOKEN     "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h>
#include <BlynkSimpleEsp32.h>
#include <ESP32Servo.h>

const char* ap_ssid = "SmartBin-ESP32";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";
const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

#define PIN_SERVO_LID        18   // Servo for Bin Lid (V0 / V9)
#define PIN_SPRAY_RELAY      23   // Deodorizer Spray Relay (V6)
#define PIN_DRY_TRIG         14
#define PIN_DRY_ECHO         35   // Ultrasonic Dry (V1)
#define PIN_WET_TRIG         27
#define PIN_WET_ECHO         34   // Ultrasonic Wet (V2)
#define PIN_ODOR_GAS         32   // Odor Sensor (V3)

WebServer server(80);
DNSServer dnsServer;
BlynkTimer timer;
Servo lidServo;
bool lidOpen = false;
bool sprayState = false;
unsigned long lastBinTgTime = 0;

void sendTelegramAlert(String message) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = "https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + 
               "/sendMessage?chat_id=" + String(TELEGRAM_CHAT_ID) + 
               "&text=" + urlEncode(message) + "&parse_mode=HTML";
  https.begin(client, url);
  https.GET();
  https.end();
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Smart Bin Dashboard</title>";
  html += "<style>body{font-family:sans-serif;background:#0f172a;color:#fff;text-align:center;padding:20px;}";
  html += ".card{background:#1e293b;border-radius:16px;padding:20px;max-width:440px;margin:auto;}";
  html += ".btn{display:inline-block;padding:12px 24px;margin:6px;border-radius:10px;font-weight:bold;color:#fff;text-decoration:none;}";
  html += ".btn-open{background:#10b981;} .btn-close{background:#ef4444;} .btn-spray{background:#06b6d4;}</style></head><body>";
  html += "<div class='card'><h2>🗑️ Smart Bin Controller</h2>";
  html += "<p style='color:#94a3b8;'>Dual-Mode: <b>192.168.0.169</b> + Home Wi-Fi</p>";
  html += "<p>Lid Status: " + String(lidOpen ? "<b style='color:#10b981'>OPEN (បើក)</b>" : "<b style='color:#ef4444'>CLOSED (បិទ)</b>") + "</p>";
  html += "<a href='/control?pin=v0&val=1' class='btn btn-open'>🗑️ បើកគម្រប (Open Lid)</a>";
  html += "<a href='/control?pin=v0&val=0' class='btn btn-close'>បិទគម្រប (Close)</a>";
  html += "<a href='/control?pin=v6&val=1' class='btn btn-spray'>💨 បាញ់ថ្នាំបំបាត់ក្លិន</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String pin = server.arg("pin");
  int val = server.arg("val").toInt();
  if (pin == "v0" || pin == "V0") {
    lidOpen = (val == 1);
    lidServo.write(lidOpen ? 90 : 0);
    Blynk.virtualWrite(V0, val);
  } else if (pin == "v6" || pin == "V6") {
    sprayState = (val == 1);
    digitalWrite(PIN_SPRAY_RELAY, sprayState ? HIGH : LOW);
    Blynk.virtualWrite(V6, val);
  }
  server.send(200, "application/json", "{\\"success\\":true}");
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\\"device\\":\\"SmartBin-ESP32\\",\\"mode\\":\\"WIFI_AP_STA\\",";
  json += "\\"lid\\":" + String(lidOpen ? 1 : 0) + ",";
  json += "\\"spray\\":" + String(sprayState ? 1 : 0) + "}";
  server.send(200, "application/json", json);
}

BLYNK_WRITE(V0) {
  lidOpen = (param.asInt() == 1);
  lidServo.write(lidOpen ? 90 : 0);
}
BLYNK_WRITE(V6) {
  sprayState = (param.asInt() == 1);
  digitalWrite(PIN_SPRAY_RELAY, sprayState ? HIGH : LOW);
}

void checkBinSensors() {
  // Ultrasonic dry waste read
  digitalWrite(PIN_DRY_TRIG, LOW); delayMicroseconds(2);
  digitalWrite(PIN_DRY_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_DRY_TRIG, LOW);
  long duration = pulseIn(PIN_DRY_ECHO, HIGH, 25000);
  int dist = (duration > 0) ? duration * 0.034 / 2 : 50;
  int dryPercent = constrain(map(dist, 30, 5, 0, 100), 0, 100);

  Blynk.virtualWrite(V1, dryPercent);
  Blynk.virtualWrite(V3, analogRead(PIN_ODOR_GAS));

  if (dryPercent >= 85 && (millis() - lastBinTgTime > 60000)) {
    lastBinTgTime = millis();
    sendTelegramAlert("⚠️ <b>[Smart Bin ធុងសម្រាមពេញ!]</b>\\n🗑️ កម្រិតសម្រាមស្ងួត: <b>" + String(dryPercent) + "%</b>\\n📍 សូមបញ្ជូនរថយន្តប្រមូលសម្រាម!");
  }
}

void setup() {
  Serial.begin(115200);
  lidServo.attach(PIN_SERVO_LID);
  lidServo.write(0);
  pinMode(PIN_SPRAY_RELAY, OUTPUT);
  pinMode(PIN_DRY_TRIG, OUTPUT);
  pinMode(PIN_DRY_ECHO, INPUT);
  pinMode(PIN_ODOR_GAS, INPUT);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  dnsServer.start(53, "*", apIP);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.on("/status", handleStatus);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Redirecting");
  });
  server.begin();

  timer.setInterval(2500L, checkBinSensors);
  sendTelegramAlert("🚀 <b>[Smart Bin ESP32]</b> Online! IP: 192.168.0.169");
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  Blynk.run();
  timer.run();
}
`;

  // 4. Device 3: Smart Irrigation (ESP32 30-Pin)
  const esp32IrrigationCode = `/*
 * ==============================================================================
 * Project: Device 3 - Smart Irrigation on ESP32 30-Pin (Dual-Mode AP+STA)
 * Hardware: ESP32-WROOM-32D 30-Pin
 * Sensors: Soil Moisture (GPIO 35 ADC), DHT11 Temp/Humidity (GPIO 4), Solar Angle (GPIO 19)
 * Actuators: Water Pump Relay (GPIO 23)
 * Wi-Fi: AP (192.168.0.169) + STA (Router) + Captive Portal (Port 53)
 * Telegram Alerts: Enabled
 * ==============================================================================
 */
#define BLYNK_TEMPLATE_ID    "TMPL6BUNdn49f"
#define BLYNK_TEMPLATE_NAME  "Smart Irrigation"
#define BLYNK_AUTH_TOKEN     "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h>
#include <BlynkSimpleEsp32.h>

const char* ap_ssid = "SmartIrrigation-ESP32";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";
const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

#define PIN_PUMP_RELAY       23   // Water Pump Relay (V0)
#define PIN_SOIL_MOISTURE    35   // Soil Moisture ADC (V1)
#define PIN_DHT11            4    // DHT11 Sensor (V2)
#define PIN_SOLAR_SERVO      19   // Solar Panel Servo (V7)

WebServer server(80);
DNSServer dnsServer;
BlynkTimer timer;
bool pumpState = false;
bool autoMode = true;

void sendTelegramAlert(String message) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = "https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + 
               "/sendMessage?chat_id=" + String(TELEGRAM_CHAT_ID) + 
               "&text=" + urlEncode(message) + "&parse_mode=HTML";
  https.begin(client, url);
  https.GET();
  https.end();
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Smart Irrigation Dashboard</title>";
  html += "<style>body{font-family:sans-serif;background:#0f172a;color:#fff;text-align:center;padding:20px;}";
  html += ".card{background:#1e293b;border-radius:16px;padding:20px;max-width:440px;margin:auto;}";
  html += ".btn{display:inline-block;padding:12px 24px;margin:6px;border-radius:10px;font-weight:bold;color:#fff;text-decoration:none;}";
  html += ".btn-pump{background:#0284c7;} .btn-off{background:#ef4444;}</style></head><body>";
  html += "<div class='card'><h2>🌱 Smart Irrigation System</h2>";
  html += "<p style='color:#94a3b8;'>Dual-Mode: <b>192.168.0.169</b> + Home Wi-Fi</p>";
  html += "<p>Water Pump: " + String(pumpState ? "<b style='color:#38bdf8'>PUMPING (បើក)</b>" : "<b style='color:#ef4444'>OFF (បិទ)</b>") + "</p>";
  html += "<a href='/control?pin=v0&val=1' class='btn btn-pump'>🚰 បើកម៉ូទ័របូមទឹក (Pump ON)</a>";
  html += "<a href='/control?pin=v0&val=0' class='btn btn-off'>⭕ បិទម៉ូទ័រ (Pump OFF)</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  int val = server.arg("val").toInt();
  pumpState = (val == 1);
  digitalWrite(PIN_PUMP_RELAY, pumpState ? LOW : HIGH); // Active LOW relay
  Blynk.virtualWrite(V0, val);
  sendTelegramAlert(pumpState ? "🌱 <b>[Irrigation]</b> ម៉ូទ័របូមទឹកត្រូវបានបើក ✅" : "🌱 <b>[Irrigation]</b> ម៉ូទ័របូមទឹកត្រូវបានបិទ ⭕");
  server.send(200, "application/json", "{\\"success\\":true,\\"pump\\":" + String(val) + "}");
}

BLYNK_WRITE(V0) {
  pumpState = (param.asInt() == 1);
  digitalWrite(PIN_PUMP_RELAY, pumpState ? LOW : HIGH);
}
BLYNK_WRITE(V3) {
  autoMode = (param.asInt() == 1);
}

void checkSoil() {
  int raw = analogRead(PIN_SOIL_MOISTURE);
  int moistPercent = constrain(map(raw, 4095, 1500, 0, 100), 0, 100);
  Blynk.virtualWrite(V1, moistPercent);

  if (autoMode && moistPercent < 25 && !pumpState) {
    pumpState = true;
    digitalWrite(PIN_PUMP_RELAY, LOW);
    Blynk.virtualWrite(V0, 1);
    sendTelegramAlert("💧 <b>[Irrigation ស្វ័យប្រវត្តិ]</b>\\n🌱 សំណើមដីធ្លាក់ចុះទាប (<b>" + String(moistPercent) + "%</b>)\\n🚰 ម៉ូទ័របូមទឹកត្រូវបានបើក!");
  } else if (autoMode && moistPercent >= 70 && pumpState) {
    pumpState = false;
    digitalWrite(PIN_PUMP_RELAY, HIGH);
    Blynk.virtualWrite(V0, 0);
    sendTelegramAlert("✅ <b>[Irrigation ស្វ័យប្រវត្តិ]</b>\\n🌱 សំណើមដីគ្រប់គ្រាន់ (<b>" + String(moistPercent) + "%</b>)\\n⭕ ម៉ូទ័រត្រូវបានបិទ!");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  pinMode(PIN_SOIL_MOISTURE, INPUT);
  digitalWrite(PIN_PUMP_RELAY, HIGH); // Default OFF

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  dnsServer.start(53, "*", apIP);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Redirecting");
  });
  server.begin();

  timer.setInterval(3000L, checkSoil);
  sendTelegramAlert("🚀 <b>[Smart Irrigation ESP32]</b> Online! IP: 192.168.0.169");
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  Blynk.run();
  timer.run();
}
`;

  // 5. Device 4: Traffic & Parking (ESP32 30-Pin)
  const esp32TrafficParkingCode = `/*
 * ==============================================================================
 * Project: Device 4 - Traffic & Parking on ESP32 30-Pin (Dual-Mode AP+STA)
 * Hardware: ESP32-WROOM-32D 30-Pin
 * Actuators: Traffic Lamp (GPIO 22), Street Light (GPIO 23), Gate Barrier Servo (GPIO 18)
 * Sensors: Parking IR (GPIO 35), Road A IR (GPIO 34), Road B IR (GPIO 32)
 * Wi-Fi: AP (192.168.0.169) + STA (Router) + Captive Portal (Port 53)
 * Telegram Alerts: Enabled
 * ==============================================================================
 */
#define BLYNK_TEMPLATE_ID    "TMPL_TRAFFIC_PARKING"
#define BLYNK_TEMPLATE_NAME  "Traffic & Parking"
#define BLYNK_AUTH_TOKEN     "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h>
#include <BlynkSimpleEsp32.h>
#include <ESP32Servo.h>

const char* ap_ssid = "TrafficParking-ESP32";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";
const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

#define PIN_TRAFFIC_LAMP     22   // Traffic Lamp Relay (V0)
#define PIN_STREET_LIGHT     23   // Street Light Relay (V4)
#define PIN_GATE_SERVO       18   // Gate Barrier Servo (V6)
#define PIN_PARKING_IR       35   // Parking Sensor (V1)
#define PIN_ROADA_IR         34   // Road A IR (V2)
#define PIN_ROADB_IR         32   // Road B IR (V3)

WebServer server(80);
DNSServer dnsServer;
BlynkTimer timer;
Servo gateServo;
bool lampState = true;
bool streetState = true;
bool gateOpen = false;

void sendTelegramAlert(String message) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = "https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + 
               "/sendMessage?chat_id=" + String(TELEGRAM_CHAT_ID) + 
               "&text=" + urlEncode(message) + "&parse_mode=HTML";
  https.begin(client, url);
  https.GET();
  https.end();
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Traffic & Parking Dashboard</title>";
  html += "<style>body{font-family:sans-serif;background:#0f172a;color:#fff;text-align:center;padding:20px;}";
  html += ".card{background:#1e293b;border-radius:16px;padding:20px;max-width:440px;margin:auto;}";
  html += ".btn{display:inline-block;padding:12px 24px;margin:6px;border-radius:10px;font-weight:bold;color:#fff;text-decoration:none;}";
  html += ".btn-lamp{background:#eab308;} .btn-street{background:#f59e0b;} .btn-gate{background:#06b6d4;}</style></head><body>";
  html += "<div class='card'><h2>🚦 Traffic & Parking Node</h2>";
  html += "<p style='color:#94a3b8;'>Dual-Mode: <b>192.168.0.169</b> + Home Wi-Fi</p>";
  html += "<a href='/control?pin=v0&val=" + String(lampState ? 0 : 1) + "' class='btn btn-lamp'>💡 កុងតាក់ Lamp</a>";
  html += "<a href='/control?pin=v4&val=" + String(streetState ? 0 : 1) + "' class='btn btn-street'>🌃 Street Light</a>";
  html += "<a href='/control?pin=v6&val=" + String(gateOpen ? 0 : 1) + "' class='btn btn-gate'>🚧 របាំងច្រកទ្វារ Gate</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String pin = server.arg("pin");
  int val = server.arg("val").toInt();
  if (pin == "v0" || pin == "V0") {
    lampState = (val == 1);
    digitalWrite(PIN_TRAFFIC_LAMP, lampState ? HIGH : LOW);
    Blynk.virtualWrite(V0, val);
  } else if (pin == "v4" || pin == "V4") {
    streetState = (val == 1);
    digitalWrite(PIN_STREET_LIGHT, streetState ? HIGH : LOW);
    Blynk.virtualWrite(V4, val);
  } else if (pin == "v6" || pin == "V6") {
    gateOpen = (val == 1);
    gateServo.write(gateOpen ? 90 : 0);
    Blynk.virtualWrite(V6, val);
    sendTelegramAlert(gateOpen ? "🚧 <b>[Traffic Gate]</b> របាំងច្រកទ្វារត្រូវបានបើក!" : "🚧 <b>[Traffic Gate]</b> របាំងច្រកទ្វារត្រូវបានបិទ!");
  }
  server.send(200, "application/json", "{\\"success\\":true}");
}

BLYNK_WRITE(V0) {
  lampState = (param.asInt() == 1);
  digitalWrite(PIN_TRAFFIC_LAMP, lampState ? HIGH : LOW);
}
BLYNK_WRITE(V4) {
  streetState = (param.asInt() == 1);
  digitalWrite(PIN_STREET_LIGHT, streetState ? HIGH : LOW);
}
BLYNK_WRITE(V6) {
  gateOpen = (param.asInt() == 1);
  gateServo.write(gateOpen ? 90 : 0);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRAFFIC_LAMP, OUTPUT);
  pinMode(PIN_STREET_LIGHT, OUTPUT);
  gateServo.attach(PIN_GATE_SERVO);
  gateServo.write(0);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  dnsServer.start(53, "*", apIP);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Redirecting");
  });
  server.begin();

  sendTelegramAlert("🚀 <b>[Traffic & Parking ESP32 30-Pin]</b> Online! IP: 192.168.0.169");
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  Blynk.run();
}
`;

  // 6. Standalone Direct Web Server (No Blynk Required)
  const esp32DirectWebServerCode = `/*
 * Project: ESP32 Standalone Dual-Mode Web Server & Captive Portal
 * No Blynk Server required - Local AP + Router WiFi Direct Control
 */
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>

const char* ap_ssid = "ESP32-DualMode-Direct";
const char* ap_pass = "12345678";
IPAddress apIP(192, 168, 0, 169);
IPAddress netMsk(255, 255, 255, 0);

const char* ssid = "${wifiSsid}";
const char* password = "${wifiPass}";

WebServer server(80);
DNSServer dnsServer;
#define PIN_LAMP ${lampPin}

bool lampState = false;

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>ESP32 Direct Controller</title>";
  html += "<style>body{font-family:sans-serif;text-align:center;padding:30px;background:#0f172a;color:#fff;}";
  html += ".card{background:#1e293b;padding:24px;border-radius:18px;max-width:400px;margin:auto;}";
  html += ".btn{display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#fff;border-radius:12px;text-decoration:none;margin:8px;}";
  html += ".btn-on{background:#10b981;} .btn-off{background:#ef4444;}</style></head><body>";
  html += "<div class='card'>";
  html += "<h2>💡 SPS-PEH Direct Chip Control</h2>";
  html += "<p>Status: " + String(lampState ? "<b style='color:#10b981'>ON</b>" : "<b style='color:#ef4444'>OFF</b>") + "</p>";
  html += "<a href='/on' class='btn btn-on'>TURN ON (បើក)</a> ";
  html += "<a href='/off' class='btn btn-off'>TURN OFF (បិទ)</a>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (server.hasArg("val")) {
    int val = server.arg("val").toInt();
    lampState = (val == 1);
    digitalWrite(PIN_LAMP, lampState ? HIGH : LOW);
    server.send(200, "application/json", "{\\"success\\":true,\\"lamp\\":" + String(val) + "}");
    return;
  }
  server.send(400, "text/plain", "Missing val");
}

void handleOn() {
  lampState = true;
  digitalWrite(PIN_LAMP, HIGH);
  handleRoot();
}

void handleOff() {
  lampState = false;
  digitalWrite(PIN_LAMP, LOW);
  handleRoot();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pass);
  dnsServer.start(53, "*", apIP);

  WiFi.begin(ssid, password);

  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.0.169/", true);
    server.send(302, "text/plain", "Captive Portal Redirect");
  });
  server.begin();
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
}
`;

  // 7. Device 6: ESP32-C3 Smart Bin & MQ-135 Air Quality & Dual Wall Switch (Exact Match to User Code)
  const esp32C3SmartBinDualCode = `/*
 * ==============================================================================
 * Project: ESP32-C3 Smart System: Smart Bin + MQ-135 Air Quality + Dual Wall Switch
 * Hardware: ESP32-C3 SuperMini / Mini (RISC-V)
 * Wi-Fi: AP ("SmartBin-ESP32" 192.168.4.1) + STA ("${wifiSsid}")
 * Ultrasonic HC-SR04: TRIG (GPIO 2), ECHO (GPIO 3) -> 20cm=0%, 5cm=100%
 * Air Quality Sensor MQ-135: GPIO 0 (Analog ADC) -> Air Bad >= 400 PPM
 * Dual Golden Wall Switch: LED1 / Switch 1 (GPIO 8), LED2 / Switch 2 (GPIO 9)
 * Telegram Alerts: Bot "${telegramBotToken}" -> Chat ID "${telegramChatId}"
 * ==============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>

// Pin Definitions
#define TRIG_PIN 2
#define ECHO_PIN 3
#define LED1_PIN 8
#define LED2_PIN 9
#define MQ135_PIN 0  // GPIO 0 សម្រាប់វាស់ MQ-135 Analog

// Bin Dimensions (in cm)
const float EMPTY_DISTANCE = 20.0;
const float FULL_DISTANCE  = 5.0;

// Air Quality Threshold (កម្រិតកំណត់អតិបរមា)
const int AIR_THRESHOLD_PPM = 400; // លើសពី 400 PPM នឹងបង្ហាញថា Air Quality: Bad

// 1. ESP32 Hotspot Credentials
const char* ap_ssid = "SmartBin-ESP32";
const char* ap_password = "12345678";

// 2. Wi-Fi Home/Router Credentials (សម្រាប់ ESP32 ភ្ជាប់អុីនធឺណិត)
const char* wifi_ssid = "${wifiSsid}";        // ដាក់ឈ្មោះ Wi-Fi ផ្ទះ
const char* wifi_password = "${wifiPass}"; // ដាក់លេខសម្ងាត់ Wi-Fi

// Telegram Credentials
const String BOT_TOKEN = "${telegramBotToken}";
const String CHAT_ID   = "${telegramChatId}";

IPAddress local_ip(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

const byte DNS_PORT = 53;
DNSServer dnsServer;
WebServer server(80);

bool telegramSent = false;
bool airTelegramSent = false;

// HTML Dashboard
const char HTML_CONTENT[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart System Dashboard</title>
    <style>
        * { box-sizing: border-box; }
        body {
            background-color: #f4f4f4;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            user-select: none;
            padding: 20px;
            gap: 20px;
        }
        .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            text-align: center;
            width: 100%;
            max-width: 340px;
        }
        h2 { color: #333333; margin-top: 0; margin-bottom: 15px; }

        /* Bin UI */
        .bin-container {
            width: 120px;
            height: 160px;
            border: 4px solid #333333;
            border-radius: 10px;
            margin: 15px auto;
            position: relative;
            background-color: #eeeeee;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
        }
        .bin-fill {
            width: 100%;
            height: 0%;
            background-color: #4caf50;
            transition: height 0.5s ease, background-color 0.5s ease;
        }
        .info-text { font-size: 22px; font-weight: bold; color: #222222; margin: 8px 0; }
        .dist-text { font-size: 15px; color: #666666; }

        /* Air Quality Widget UI & Semi-Circular Gauge */
        .gauge-container {
            position: relative;
            width: 220px;
            height: 130px;
            margin: 10px auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .gauge-svg { width: 100%; height: 100%; overflow: visible; }
        .gauge-center {
            position: absolute;
            top: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
        }
        .ppm-value {
            font-size: 38px;
            font-weight: 800;
            color: #2e7d32;
            transition: color 0.5s ease;
            line-height: 1;
        }
        .ppm-unit {
            font-size: 11px;
            font-weight: bold;
            color: #888888;
            letter-spacing: 1px;
            margin-top: 2px;
        }
        .air-status {
            font-size: 18px;
            font-weight: bold;
            padding: 8px 16px;
            border-radius: 10px;
            margin-top: 5px;
            display: inline-block;
            transition: background-color 0.3s, color 0.3s;
        }
        .status-normal { background-color: #e8f5e9; color: #2e7d32; border: 2px solid #2e7d32; }
        .status-bad { background-color: #ffebee; color: #c62828; border: 2px solid #c62828; }

        /* Switches UI */
        .status-container { display: flex; gap: 30px; justify-content: center; margin-bottom: 15px; }
        .status-title { font-size: 16px; font-weight: bold; color: #222222; width: 100px; }
        .wall-panel {
            background: linear-gradient(145deg, #e0b458, #b88a30);
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .switches-frame {
            display: flex;
            background-color: #1a1a1a;
            border: 4px solid #1a1a1a;
            border-radius: 6px;
            gap: 4px;
            overflow: hidden;
        }
        .switch-rocker {
            width: 90px;
            height: 180px;
            background: linear-gradient(180deg, #c49631, #a3781f);
            position: relative;
            cursor: pointer;
        }
        .led-indicator {
            position: absolute;
            top: 20px;
            left: 15px;
            width: 45px;
            height: 8px;
            border-radius: 4px;
            background-color: #2a2a2a;
        }
        .led-indicator.active {
            background-color: #80ffff;
            box-shadow: 0 0 8px #80ffff, 0 0 15px rgba(128, 255, 255, 0.8);
        }
        .brand-logo { margin-top: 10px; font-size: 14px; font-weight: bold; font-style: italic; color: #5c4310; letter-spacing: 2px; }
        .labels-container { display: flex; gap: 30px; justify-content: center; margin-top: 15px; }
        .switch-label { font-size: 16px; font-weight: 800; color: #444444; width: 100px; text-transform: uppercase; }
    </style>
</head>
<body>

    <!-- Widget 1: Smart Bin -->
    <div class="card">
        <h2>Smart Bin Level</h2>
        <div class="bin-container">
            <div id="fill" class="bin-fill"></div>
        </div>
        <div id="level" class="info-text">0%</div>
        <div id="distance" class="dist-text">Distance: -- cm</div>
    </div>

    <!-- Widget 2: Air Quality (MQ-135 Semi-Circular Gauge) -->
    <div class="card">
        <h2>Air Quality Monitor</h2>
        <div class="gauge-container">
            <svg class="gauge-svg" viewBox="0 0 200 120">
                <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="#e2e8f0" stroke-width="24" stroke-linecap="butt" />
                <path id="gaugeArc" d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="#22c55e" stroke-width="24" stroke-linecap="butt" stroke-dasharray="235.62" stroke-dashoffset="235.62" style="transition: stroke-dashoffset 0.6s ease, stroke 0.6s ease;" />
                <text x="25" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="#94a3b8">0</text>
                <text x="175" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="#94a3b8">1000</text>
            </svg>
            <div class="gauge-center">
                <div id="ppmDisplay" class="ppm-value">0</div>
                <div class="ppm-unit">PPM</div>
            </div>
        </div>
        <div id="airWidget" class="air-status status-normal">Air Quality: Normal</div>
    </div>

    <!-- Widget 3: Switches -->
    <div class="card">
        <h2>Wall Switch Control</h2>
        <div class="status-container">
            <div id="status1" class="status-title">Status: OFF</div>
            <div id="status2" class="status-title">Status: OFF</div>
        </div>
        <div class="wall-panel">
            <div class="switches-frame">
                <div class="switch-rocker" onclick="toggleLED(1)">
                    <div id="led1" class="led-indicator"></div>
                </div>
                <div class="switch-rocker" onclick="toggleLED(2)">
                    <div id="led2" class="led-indicator"></div>
                </div>
            </div>
            <div class="brand-logo">SGT</div>
        </div>
        <div class="labels-container">
            <div id="label1" class="switch-label">SWITCH 1</div>
            <div id="label2" class="switch-label">SWITCH 2</div>
        </div>
    </div>

    <script>
        function updateSensors() {
            fetch("/data")
                .then(response => response.json())
                .then(data => {
                    // Update Bin UI
                    const fill = document.getElementById("fill");
                    let pct = data.level;
                    fill.style.height = pct + "%";
                    document.getElementById("level").innerText = pct + "% Full";
                    document.getElementById("distance").innerText = "Distance: " + data.distance + " cm";

                    if (pct >= 85) fill.style.backgroundColor = "#e53935";
                    else if (pct >= 50) fill.style.backgroundColor = "#fb8c00";
                    else fill.style.backgroundColor = "#4caf50";

                    // Update Air Quality Arc & Dynamic Color (Green -> Yellow -> Orange -> Deep Red)
                    const ppm = data.ppm;
                    document.getElementById("ppmDisplay").innerText = ppm;
                    const gaugeArc = document.getElementById("gaugeArc");
                    const arcLen = 235.62;
                    const ratio = Math.min(1, Math.max(0, ppm / 1000));
                    gaugeArc.style.strokeDashoffset = (arcLen * (1 - ratio));

                    let color = "#22c55e";
                    if (ppm >= 600) color = "#b91c1c";
                    else if (ppm >= 400) color = "#dc2626";
                    else if (ppm >= 300) color = "#f97316";
                    else if (ppm >= 200) color = "#eab308";
                    else if (ppm >= 100) color = "#84cc16";

                    gaugeArc.style.stroke = color;
                    document.getElementById("ppmDisplay").style.color = color;

                    const airWidget = document.getElementById("airWidget");
                    if (data.airBad) {
                        airWidget.innerText = "Air Quality: Bad";
                        airWidget.className = "air-status status-bad";
                    } else {
                        airWidget.innerText = "Air Quality: Normal";
                        airWidget.className = "air-status status-normal";
                    }
                })
                .catch(err => console.log(err));
        }
        setInterval(updateSensors, 300); // 300ms Ultra-Fast Real-Time refresh
        updateSensors();

        let is1On = false, is2On = false;
        function toggleLED(num) {
            let stateNow = (num === 1) ? is1On : is2On;
            let endpoint = (num === 1) ? (stateNow ? "/led1/off" : "/led1/on") : (stateNow ? "/led2/off" : "/led2/on");

            fetch(endpoint)
                .then(response => response.text())
                .then(state => {
                    const led = document.getElementById("led" + num);
                    const status = document.getElementById("status" + num);
                    const label = document.getElementById("label" + num);

                    if (state === "1") {
                        led.classList.add("active");
                        status.innerText = "Status: ON";
                        label.innerText = "SWITCH ON";
                        if (num === 1) is1On = true; else is2On = true;
                    } else {
                        led.classList.remove("active");
                        status.innerText = "Status: OFF";
                        label.innerText = "SWITCH OFF";
                        if (num === 1) is1On = false; else is2On = false;
                    }
                });
        }
    </script>
</body>
</html>
)rawliteral";

// Measure Ultrasonic Distance
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return EMPTY_DISTANCE;
  return (duration * 0.0343) / 2.0;
}

int calculateLevel(float distance) {
  if (distance >= EMPTY_DISTANCE) return 0;
  if (distance <= FULL_DISTANCE) return 100;
  return (int)(((EMPTY_DISTANCE - distance) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100.0);
}

// មុខងារគណនា PPM សម្រាប់ MQ-135
int getMQ135PPM() {
  int rawADC = analogRead(MQ135_PIN);
  int ppm = map(rawADC, 0, 4095, 100, 1000);
  return ppm;
}

// មុខងារបំប្លែងអក្សរ (Encode) សម្រាប់ Telegram API
String urlEncode(String str) {
  String encodedString = "";
  char c;
  for (unsigned int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (isalnum(c)) {
      encodedString += c;
    } else {
      char code1 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code1 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      char code2 = c + '0';
      if (c > 9) code2 = c - 10 + 'A';
      encodedString += '%';
      encodedString += code2;
      encodedString += code1;
    }
  }
  return encodedString;
}

// Telegram Alert Function
void sendTelegramMessage(String message) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String encodedMessage = urlEncode(message);
    String url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage?chat_id=" + CHAT_ID + "&text=" + encodedMessage;
    
    WiFiClientSecure client;
    client.setInsecure();
    http.begin(client, url);
    
    http.GET();
    http.end();
  }
}

void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/html", HTML_CONTENT);
}

void handleData() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  float dist = getDistance();
  int level = calculateLevel(dist);
  int ppm = getMQ135PPM();
  bool airBad = (ppm >= AIR_THRESHOLD_PPM);

  // Telegram Alert សម្រាប់សម្រាមពេញ
  if (level >= 100 && !telegramSent) {
    sendTelegramMessage("សូមមកប្រមូលសម្រាមជាបន្ទាន់! សម្រាមពេញហើយ!!!");
    telegramSent = true;
  } else if (level < 80) {
    telegramSent = false;
  }

  // Telegram Alert សម្រាប់កម្រិតខ្យល់ពុល (អក្សរដែលអ្នកបានស្នើ)
  if (airBad && !airTelegramSent) {
    String msg = "⚠️ អាសន្ន! មានខ្យល់ពុលខ្លាំង (" + String(ppm) + " PPM)\\n\\n" +
                 "សូមប្រុងប្រយ័ត្នចេញក្រៅសូមពាក់ម៉ាស តែបើមិនចាំបាច់សូមនៅក្នុងផ្ទះ ឬកន្លែងដែលមានបរិយាសកាសល្អ!!!";
    sendTelegramMessage(msg);
    airTelegramSent = true;
  } else if (!airBad) {
    airTelegramSent = false;
  }

  String json = "{\"distance\":" + String(dist, 1) + 
                ",\"level\":" + String(level) + 
                ",\"ppm\":" + String(ppm) + 
                ",\"airBad\":" + String(airBad ? "true" : "false") + "}";
  server.send(200, "application/json", json);
}

void handleLed1On()  { digitalWrite(LED1_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed1Off() { digitalWrite(LED1_PIN, LOW);  server.send(200, "text/plain", "0"); }
void handleLed2On()  { digitalWrite(LED2_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed2Off() { digitalWrite(LED2_PIN, LOW);  server.send(200, "text/plain", "0"); }

void handleNotFound() {
  server.sendHeader("Location", "http://192.168.4.1/", true);
  server.send(302, "text/plain", "");
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(MQ135_PIN, INPUT);

  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  WiFi.softAP(ap_ssid, ap_password);

  WiFi.begin(wifi_ssid, wifi_password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    sendTelegramMessage("WiFi ភ្ជាប់ជោគជ័យ! IP: " + WiFi.localIP().toString());
  }

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.on("/led1/on", handleLed1On);
  server.on("/led1/off", handleLed1Off);
  server.on("/led2/on", handleLed2On);
  server.on("/led2/off", handleLed2Off);
  server.onNotFound(handleNotFound);

  server.begin();
}

// Forward real readings to Web Cloud Dashboard if connected to Wi-Fi
unsigned long lastCloudPush = 0;
void pushDataToCloud() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastCloudPush > 1000) {
    lastCloudPush = millis();
    HTTPClient http;
    float dist = getDistance();
    int level = calculateLevel(dist);
    int ppm = getMQ135PPM();
    bool airBad = (ppm >= AIR_THRESHOLD_PPM);

    // Send HTTP GET to cloud backend automatically (Supports instant real-time sync)
    String cloudUrl = "https://ais-dev-27zugh4jcphio6ahgdc4og-250832150518.asia-southeast1.run.app/api/iot/c3/update?distance=" + String(dist, 1) + "&level=" + String(level) + "&ppm=" + String(ppm) + "&airBad=" + String(airBad ? "1" : "0");
    
    if (cloudUrl.startsWith("https://")) {
      WiFiClientSecure client;
      client.setInsecure();
      http.begin(client, cloudUrl);
    } else {
      http.begin(cloudUrl);
    }
    
    http.setTimeout(1000);
    http.GET();
    http.end();
  }
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  pushDataToCloud();
}
`;
  const esp32SchoolLightsCode = `/*
 * ==============================================================================
 * Project: ESP32 30-Pin School Lights - Smart Relay System (Dual-Mode AP + Cloud STA)
 * Hardware: ESP32 30-Pin (WROOM-32D)
 * Wi-Fi: AP ("SmartBin-ESP32" 192.168.4.1) + STA ("\${wifiSsid}") with Cloud Polling Sync
 * Actuators: School Light (GPIO 19), Building Light (GPIO 21), Playground Light (GPIO 22)
 * Telegram Alerts: Bot "\${telegramBotToken}" -> Chat ID "\${telegramChatId}"
 * ==============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>

// Pin Definitions for ESP32 30-Pin Board
#define LED_SCHOOL_PIN     19  // ភ្លើងសាលាសុវណ្ណភូមិផ្សារដីហុយ
#define LED_BUILDING_PIN   21  // ភ្លើងអគារ
#define LED_PLAYGROUND_PIN 22  // ភ្លើង Playground

// 1. ESP32 Hotspot Credentials
const char* ap_ssid = "SmartBin-ESP32";
const char* ap_password = "12345678";

// 2. Wi-Fi Home/Router Credentials (សម្រាប់ ESP32 ភ្ជាប់អុីនធឺណិត)
const char* wifi_ssid = "${wifiSsid}";        // ដាក់ឈ្មោះ Wi-Fi ផ្ទះ/Hotspot
const char* wifi_password = "${wifiPass}"; // ដាក់លេខសម្ងាត់ Wi-Fi

// Telegram Credentials
const String BOT_TOKEN = "${telegramBotToken}";
const String CHAT_ID   = "${telegramChatId}";

IPAddress local_ip(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

const byte DNS_PORT = 53;
DNSServer dnsServer;
WebServer server(80);

// HTML Dashboard
const char HTML_CONTENT[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart System Dashboard</title>
    <style>
        * { box-sizing: border-box; }
        body {
            background-color: #f4f4f4;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            user-select: none;
            padding: 20px;
            gap: 20px;
        }
        .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            text-align: center;
            width: 100%;
            max-width: 480px;
        }
        h2 { color: #333333; margin-top: 0; margin-bottom: 15px; }

        /* Switches UI */
        .status-container { display: flex; gap: 10px; justify-content: space-around; margin-bottom: 15px; }
        .status-title { font-size: 13px; font-weight: bold; color: #222222; width: 33%; }
        .wall-panel {
            background: linear-gradient(145deg, #e0b458, #b88a30);
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .switches-frame {
            display: flex;
            background-color: #1a1a1a;
            border: 4px solid #1a1a1a;
            border-radius: 6px;
            gap: 4px;
            overflow: hidden;
        }
        .switch-rocker {
            width: 90px;
            height: 160px;
            background: linear-gradient(180deg, #c49631, #a3781f);
            position: relative;
            cursor: pointer;
        }
        .led-indicator {
            position: absolute;
            top: 15px;
            left: 20px;
            width: 50px;
            height: 8px;
            border-radius: 4px;
            background-color: #2a2a2a;
        }
        .led-indicator.active {
            background-color: #80ffff;
            box-shadow: 0 0 8px #80ffff, 0 0 15px rgba(128, 255, 255, 0.8);
        }
        .brand-logo { margin-top: 10px; font-size: 14px; font-weight: bold; font-style: italic; color: #5c4310; letter-spacing: 2px; }
        .labels-container { display: flex; gap: 10px; justify-content: space-around; margin-top: 15px; }
        .switch-label { font-size: 12px; font-weight: bold; color: #444444; width: 33%; }
    </style>
</head>
<body>

    <!-- Widget: Switches -->
    <div class="card">
        <h2>ប្រព័ន្ធគ្រប់គ្រងភ្លើង (School Relays)</h2>
        <div class="status-container">
            <div id="status1" class="status-title">សាលា: OFF</div>
            <div id="status2" class="status-title">អគារ: OFF</div>
            <div id="status3" class="status-title">Playground: OFF</div>
        </div>
        <div class="wall-panel">
            <div class="switches-frame">
                <div class="switch-rocker" onclick="toggleLED(1)">
                    <div id="led1" class="led-indicator"></div>
                </div>
                <div class="switch-rocker" onclick="toggleLED(2)">
                    <div id="led2" class="led-indicator"></div>
                </div>
                <div class="switch-rocker" onclick="toggleLED(3)">
                    <div id="led3" class="led-indicator"></div>
                </div>
            </div>
            <div class="brand-logo">SGT</div>
        </div>
        <div class="labels-container">
            <div id="label1" class="switch-label">ភ្លើងសាលាសុវណ្ណភូមិផ្សារដីហុយ</div>
            <div id="label2" class="switch-label">ភ្លើងអគារ</div>
            <div id="label3" class="switch-label">ភ្លើង Playground</div>
        </div>
    </div>

    <script>
        let states = {1: false, 2: false, 3: false};
        const names = {1: "សាលា", 2: "អគារ", 3: "Playground"};

        function toggleLED(num) {
            let stateNow = states[num];
            let endpoint = "/led" + num + (stateNow ? "/off" : "/on");

            fetch(endpoint)
                .then(response => response.text())
                .then(state => {
                    const led = document.getElementById("led" + num);
                    const status = document.getElementById("status" + num);

                    if (state === "1") {
                        led.classList.add("active");
                        status.innerText = names[num] + ": ON";
                        states[num] = true;
                    } else {
                        led.classList.remove("active");
                        status.innerText = names[num] + ": OFF";
                        states[num] = false;
                    }
                });
        }
    </script>
</body>
</html>
)rawliteral";

// URL Encode function for Telegram API
String urlEncode(String str) {
  String encodedString = "";
  char c;
  for (unsigned int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (isalnum(c)) {
      encodedString += c;
    } else {
      char code1 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code1 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      char code2 = c + '0';
      if (c > 9) code2 = c - 10 + 'A';
      encodedString += '%';
      encodedString += code2;
      encodedString += code1;
    }
  }
  return encodedString;
}

// Telegram Alert Function
void sendTelegramMessage(String message) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String encodedMessage = urlEncode(message);
    String url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage?chat_id=" + CHAT_ID + "&text=" + encodedMessage;
    
    WiFiClientSecure client;
    client.setInsecure();
    http.begin(client, url);
    
    http.GET();
    http.end();
  }
}

void handleRoot() { 
  server.send(200, "text/html; charset=UTF-8", HTML_CONTENT); 
}

void handleLed1On()  { digitalWrite(LED_SCHOOL_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed1Off() { digitalWrite(LED_SCHOOL_PIN, LOW);  server.send(200, "text/plain", "0"); }

void handleLed2On()  { digitalWrite(LED_BUILDING_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed2Off() { digitalWrite(LED_BUILDING_PIN, LOW);  server.send(200, "text/plain", "0"); }

void handleLed3On()  { digitalWrite(LED_PLAYGROUND_PIN, HIGH); server.send(200, "text/plain", "1"); }
void handleLed3Off() { digitalWrite(LED_PLAYGROUND_PIN, LOW);  server.send(200, "text/plain", "0"); }

void handleNotFound() {
  server.sendHeader("Location", "http://192.168.4.1/", true);
  server.send(302, "text/plain", "");
}

// Forward real readings / Pull relay commands to/from Web Cloud Dashboard if connected to Wi-Fi
unsigned long lastCloudSync = 0;
void syncWithCloud() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastCloudSync > 1000) {
    lastCloudSync = millis();
    HTTPClient http;
    
    // Polling V1, V2, and V3 relay states from the cloud server
    // Fetches {"v1": 0, "v2": 1, "v3": 0} and applies them locally in real-time
    String url = "${serverUrl}/api/iot/get?token=${blynkAuthToken}";
    
    if (url.startsWith("https://")) {
      WiFiClientSecure client;
      client.setInsecure();
      http.begin(client, url);
    } else {
      http.begin(url);
    }
    
    http.setTimeout(2500);
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      String payload = http.getString();
      
      // Simple lightweight parsing to avoid heavy Json libraries
      int v1Idx = payload.indexOf("\"v1\":");
      if (v1Idx != -1) {
        char v1Val = payload.charAt(v1Idx + 5);
        if (v1Val == '1') digitalWrite(LED_SCHOOL_PIN, HIGH);
        else if (v1Val == '0') digitalWrite(LED_SCHOOL_PIN, LOW);
      }
      
      int v2Idx = payload.indexOf("\"v2\":");
      if (v2Idx != -1) {
        char v2Val = payload.charAt(v2Idx + 5);
        if (v2Val == '1') digitalWrite(LED_BUILDING_PIN, HIGH);
        else if (v2Val == '0') digitalWrite(LED_BUILDING_PIN, LOW);
      }
      
      int v3Idx = payload.indexOf("\"v3\":");
      if (v3Idx != -1) {
        char v3Val = payload.charAt(v3Idx + 5);
        if (v3Val == '1') digitalWrite(LED_PLAYGROUND_PIN, HIGH);
        else if (v3Val == '0') digitalWrite(LED_PLAYGROUND_PIN, LOW);
      }
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(LED_SCHOOL_PIN, OUTPUT);
  pinMode(LED_BUILDING_PIN, OUTPUT);
  pinMode(LED_PLAYGROUND_PIN, OUTPUT);

  digitalWrite(LED_SCHOOL_PIN, LOW);
  digitalWrite(LED_BUILDING_PIN, LOW);
  digitalWrite(LED_PLAYGROUND_PIN, LOW);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  WiFi.softAP(ap_ssid, ap_password);

  WiFi.begin(wifi_ssid, wifi_password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    sendTelegramMessage("WiFi ភ្ជាប់ជោគជ័យ! IP: " + WiFi.localIP().toString());
  }

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/led1/on", handleLed1On);
  server.on("/led1/off", handleLed1Off);
  server.on("/led2/on", handleLed2On);
  server.on("/led2/off", handleLed2Off);
  server.on("/led3/on", handleLed3On);
  server.on("/led3/off", handleLed3Off);
  server.onNotFound(handleNotFound);

  server.begin();
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  syncWithCloud();
}
`;

  // Initialize custom code editor with the active template if empty
  useEffect(() => {
    const saved = localStorage.getItem('sps_peh_custom_arduino_code');
    if (saved && saved.length > 50) {
      setCustomCode(saved);
    } else {
      setCustomCode(esp32C3SmartBinDualCode);
    }
  }, []);

  const handleTemplateChange = (preset: 'esp32_cam_smartlamp' | 'esp32_30pin_alert' | 'esp32_30pin_smartbin' | 'esp32_30pin_irrigation' | 'esp32_30pin_traffic' | 'esp32_direct_webserver' | 'esp32c3_smartbin_dualwall' | 'esp32_school_lights') => {
    setEditorTemplatePreset(preset);
    let newCode = esp32CamSmartLampCode;
    if (preset === 'esp32_30pin_alert') newCode = esp32AlertSystemCode;
    if (preset === 'esp32_30pin_smartbin') newCode = esp32SmartBinCode;
    if (preset === 'esp32_30pin_irrigation') newCode = esp32IrrigationCode;
    if (preset === 'esp32_30pin_traffic') newCode = esp32TrafficParkingCode;
    if (preset === 'esp32_direct_webserver') newCode = esp32DirectWebServerCode;
    if (preset === 'esp32c3_smartbin_dualwall') newCode = esp32C3SmartBinDualCode;
    if (preset === 'esp32_school_lights') newCode = esp32SchoolLightsCode;
    setCustomCode(newCode);
    localStorage.setItem('sps_peh_custom_arduino_code', newCode);
  };

  const saveCustomCode = () => {
    localStorage.setItem('sps_peh_custom_arduino_code', customCode);
    setCodeSavedNotification(true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.3 } });
    setTimeout(() => setCodeSavedNotification(false), 2500);
  };

  const resetCustomCodeToCurrentTemplate = () => {
    let base = esp32CamSmartLampCode;
    if (editorTemplatePreset === 'esp32_30pin_alert') base = esp32AlertSystemCode;
    if (editorTemplatePreset === 'esp32_30pin_smartbin') base = esp32SmartBinCode;
    if (editorTemplatePreset === 'esp32_30pin_irrigation') base = esp32IrrigationCode;
    if (editorTemplatePreset === 'esp32_30pin_traffic') base = esp32TrafficParkingCode;
    if (editorTemplatePreset === 'esp32_direct_webserver') base = esp32DirectWebServerCode;
    if (editorTemplatePreset === 'esp32c3_smartbin_dualwall') base = esp32C3SmartBinDualCode;
    if (editorTemplatePreset === 'esp32_school_lights') base = esp32SchoolLightsCode;
    setCustomCode(base);
    localStorage.setItem('sps_peh_custom_arduino_code', base);
  };

  // Quick insertion helpers for Live Code Editor
  const insertSnippet = (snippet: string) => {
    setCustomCode((prev) => prev + '\n' + snippet);
  };

  // Send Remote Command to Chip (Supports Blynk Cloud REST API, Local IP Webhook, & Web Serial)
  const dispatchChipCommand = async (pin: string, value: number) => {
    setRemoteDispatching(true);
    setRemoteStatusMessage(null);

    try {
      if (pin === 'V0') setRemoteLampState(value);
      if (pin === 'V4') setRemoteFlashState(value);
      if (pin === 'V1') setRemoteGasSimState(value);

      // Web Serial Mode
      if (remoteDispatchMode === 'web_serial' && serialConnected && serialPort) {
        const encoder = new TextEncoder();
        const writer = serialPort.writable.getWriter();
        await writer.write(encoder.encode(`${pin}=${value}\n`));
        writer.releaseLock();
        setRemoteStatusMessage(`[Web Serial] Sent: ${pin}=${value}`);
        return;
      }

      // Backend / Blynk Cloud / Local IP Forwarder
      if (remoteDispatchMode === 'local_ip' && chipTargetIp) {
        // Direct browser-to-chip local HTTP call (bypasses cloud NAT and HTTPS mixed-content blocks)
        try {
          const actionPath = value === 1 ? 'on' : 'off';
          const targetUrl = `http://${chipTargetIp}/${actionPath}?t=${Date.now()}`;

          // 1. Image Beacon (bypasses standard fetch CORS)
          const beacon = new Image();
          beacon.src = targetUrl;

          // 2. Hidden Iframe Dispatch
          let hiddenIframe = document.getElementById('esp_hidden_sender') as HTMLIFrameElement;
          if (!hiddenIframe) {
            hiddenIframe = document.createElement('iframe');
            hiddenIframe.id = 'esp_hidden_sender';
            hiddenIframe.style.display = 'none';
            document.body.appendChild(hiddenIframe);
          }
          hiddenIframe.src = targetUrl;

          // 3. Background fetch attempt
          fetch(`http://${chipTargetIp}/control?pin=${pin.toLowerCase()}&val=${value}`, { mode: 'no-cors' }).catch(() => {});
          fetch(`http://${chipTargetIp}/api/update?${pin.toLowerCase()}=${value}`, { mode: 'no-cors' }).catch(() => {});
        } catch (e) {
          console.error("Local direct dispatch error:", e);
        }
      }

      const response = await fetch('/api/iot/chip/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device?.id || 'dev_smart_lamp_mq135',
          pin,
          value,
          blynkToken: blynkAuthToken,
          chipIp: remoteDispatchMode === 'local_ip' ? chipTargetIp : undefined,
          sendTelegram: pin === 'V0',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRemoteStatusMessage(
          lang === 'km'
            ? `✅ បានបញ្ជាទៅ Chip ជោគជ័យ: ${pin} -> ${value === 1 ? 'ON (បើក)' : 'OFF (បិទ)'}`
            : `✅ Dispatched to Chip successfully: ${pin} -> ${value === 1 ? 'ON' : 'OFF'}`
        );
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
      } else {
        setRemoteStatusMessage(`❌ Error: ${data.error || 'Failed to dispatch'}`);
      }
    } catch (err: any) {
      setRemoteStatusMessage(`❌ Error: ${err?.message || 'Network dispatch failed'}`);
    } finally {
      setRemoteDispatching(false);
    }
  };

  // Web Serial API connection handler
  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert(lang === 'km' 
        ? 'កម្មវិធីរុករករបស់អ្នកមិនទាន់គាំទ្រ Web Serial API ទេ (សូមប្រើ Chrome ឬ Edge លើ PC ឬ Android OTG)' 
        : 'Web Serial API not supported in this browser. Please use Chrome/Edge on Desktop or Android OTG.');
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      setSerialPort(port);
      setSerialConnected(true);
      setSerialLogs((prev) => [...prev, `[Connected] Port opened at 115200 baud`]);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      readSerialStream(reader);
    } catch (err: any) {
      console.error(err);
      alert('Serial connection failed: ' + err.message);
    }
  };

  const readSerialStream = async (reader: any) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          setSerialLogs((prev) => [...prev.slice(-80), value]);
        }
      }
    } catch (err) {
      console.log('Serial read error:', err);
    }
  };

  const handleDisconnectWebSerial = async () => {
    if (serialReaderRef.current) {
      await serialReaderRef.current.cancel();
    }
    if (serialPort) {
      await serialPort.close();
      setSerialPort(null);
      setSerialConnected(false);
      setSerialLogs((prev) => [...prev, '[Disconnected] Serial port closed']);
    }
  };

  const sendCustomSerialCommand = async () => {
    if (!serialInput.trim() || !serialPort || !serialConnected) return;
    try {
      const encoder = new TextEncoder();
      const writer = serialPort.writable.getWriter();
      await writer.write(encoder.encode(serialInput + '\n'));
      writer.releaseLock();
      setSerialLogs((prev) => [...prev, `> ${serialInput}`]);
      setSerialInput('');
    } catch (err: any) {
      console.error(err);
    }
  };

  const sendTestTelegram = async () => {
    setTelegramTesting(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramBotToken,
          chatId: telegramChatId,
          message: `🔔 <b>[SPS-PEH IoT Cloud Notification]</b>\n\n✅ <b>Smart_Lamp & MQ135 System Online!</b>\n💡 <b>Smart_Lamp Relay:</b> GPIO ${lampPin} (Blynk V0)\n💨 <b>MQ-135 Gas Sensor:</b> GPIO ${mq135Pin} (Blynk V1)\n📶 <b>WiFi Network:</b> ${wifiSsid}\n⏰ <b>Timestamp:</b> ${new Date().toLocaleTimeString()}\n\n<i>សារសាកល្បងនេះត្រូវបានផ្ញើចេញពី SPS-PEH IoT Dashboard ដោយជោគជ័យ។</i>`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus('success');
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 } });
      } else {
        setTelegramStatus('error: ' + (data.error || 'Failed to send'));
      }
    } catch (err: any) {
      setTelegramStatus('error: ' + (err.message || 'Network error'));
    } finally {
      setTelegramTesting(false);
    }
  };

  const blynkHeaderSnippet = `// Fill-in information from your Blynk Template here
#define BLYNK_TEMPLATE_ID   "${blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME "${blynkTemplateName}"
#define BLYNK_AUTH_TOKEN    "${blynkAuthToken}"

// Telegram Bot Credentials
#define TELEGRAM_BOT_TOKEN  "${telegramBotToken}"
#define TELEGRAM_CHAT_ID    "${telegramChatId}"`;

  const copyCustomCode = () => {
    navigator.clipboard.writeText(customCode);
    setCopiedCode(true);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.3 } });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyDefines = () => {
    navigator.clipboard.writeText(blynkHeaderSnippet);
    setCopiedDefines(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.25 } });
    setTimeout(() => setCopiedDefines(false), 2500);
  };

  const downloadInoFile = () => {
    const blob = new Blob([customCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Blynk_${blynkTemplateId}_${blynkTemplateName.replace(/[^a-zA-Z0-9]/g, '_')}.ino`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sampleCurl = `curl -X GET "${serverUrl}/api/iot/update?token=${blynkAuthToken}&v0=1&v1=92&v2=29.4&v5=350&v6=68.5"`;

  const copyCurlCmd = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div id="esp32-firmware-studio-view" className="space-y-5">
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  {lang === 'km' ? 'Blynk IoT & ESP32 Code Studio' : 'Blynk IoT & ESP32 Code Studio'}
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  LIVE EDITOR & REMOTE CHIP CONTROL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'km'
                  ? 'កែសម្រួលកូដ Arduino C++ ផ្ទាល់ក្នុងកម្មវិធី និងបញ្ជាទៅកាន់ Chip (ESP32/ESP32-CAM) ពីគ្រប់ទូរស័ព្ទ កុំព្យូទ័រ ឬ Tablet'
                  : 'Live In-Browser C++ Code Editor with direct cross-device remote control to ESP32 / ESP32-CAM microcontrollers.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="copy-firmware-code-btn"
              onClick={copyCustomCode}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? (lang === 'km' ? 'បានចម្លងកូដ!' : 'Copied Code!') : (lang === 'km' ? 'ចម្លងកូដ' : 'Copy Code')}</span>
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
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-semibold overflow-x-auto pb-1">
          {[
            { key: 'editor', label: 'Live Code Editor', labelKhmer: 'កែសម្រួល & ផ្លាស់ប្តូរកូដភ្លាមៗ', icon: <Edit3 className="w-3.5 h-3.5 text-amber-400" /> },
            { key: 'remote', label: 'Remote Chip Controller', labelKhmer: 'បញ្ជាទៅ Chip ពីគ្រប់ Device', icon: <Radio className="w-3.5 h-3.5 text-emerald-400" /> },
            { key: 'telegram', label: 'Telegram Bot Alerts', labelKhmer: 'ប្រព័ន្ធ Telegram Alert', icon: <Bot className="w-3.5 h-3.5 text-sky-400" /> },
            { key: 'code', label: 'C++ Code View', labelKhmer: 'ទិដ្ឋភាពកូដ C++', icon: <Code2 className="w-3.5 h-3.5" /> },
            { key: 'guide', label: 'Flashing Guide', labelKhmer: 'ការដំឡើង & Flash', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { key: 'wiring', label: 'Hardware Wiring', labelKhmer: 'តារាងតខ្សែ GPIO', icon: <Layers className="w-3.5 h-3.5" /> },
            { key: 'api', label: 'REST API & Webhook', labelKhmer: 'តេស្ត API & cURL', icon: <Terminal className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === tab.key
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{lang === 'km' ? tab.labelKhmer : tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. PROMINENT BLYNK TEMPLATE CREDENTIALS BOX (#define Snippet) */}
      <div className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{lang === 'km' ? 'ព័ត៌មានសម្គាល់ Blynk Template (Blynk Device Info)' : 'Blynk Device Info & #define Credentials'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                  TOP 3 LINES
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'km'
                  ? 'អ្នកអាចកែសម្រួល ឬចម្លង ៣បន្ទាត់នេះទៅដាក់លើគេបង្អស់នៃកូដ Arduino IDE'
                  : 'Copy and paste these 3 lines at the very top of your Arduino sketch.'}
              </p>
            </div>
          </div>

          <button
            onClick={copyDefines}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            {copiedDefines ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDefines ? (lang === 'km' ? 'បានចម្លង 3 បន្ទាត់!' : 'Copied 3 Defines!') : (lang === 'km' ? 'ចម្លង 3 បន្ទាត់ #define' : 'Copy 3 #define Lines')}</span>
          </button>
        </div>

        {/* Input fields to edit template credentials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              #define BLYNK_TEMPLATE_ID
            </label>
            <input
              type="text"
              value={blynkTemplateId}
              onChange={(e) => {
                setBlynkTemplateId(e.target.value);
                setCustomCode((prev) => prev.replace(/#define BLYNK_TEMPLATE_ID\s+"[^"]*"/, `#define BLYNK_TEMPLATE_ID    "${e.target.value}"`));
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-emerald-400 font-mono text-xs font-bold focus:outline-none"
              placeholder="e.g. TMPL_SMART_LAMP_MQ135"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              #define BLYNK_TEMPLATE_NAME
            </label>
            <input
              type="text"
              value={blynkTemplateName}
              onChange={(e) => {
                setBlynkTemplateName(e.target.value);
                setCustomCode((prev) => prev.replace(/#define BLYNK_TEMPLATE_NAME\s+"[^"]*"/, `#define BLYNK_TEMPLATE_NAME  "${e.target.value}"`));
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
              placeholder="e.g. Smart_Lamp & MQ135"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              #define BLYNK_AUTH_TOKEN
            </label>
            <input
              type="text"
              value={blynkAuthToken}
              onChange={(e) => {
                setBlynkAuthToken(e.target.value);
                setCustomCode((prev) => prev.replace(/#define BLYNK_AUTH_TOKEN\s+"[^"]*"/, `#define BLYNK_AUTH_TOKEN     "${e.target.value}"`));
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-cyan-400 font-mono text-xs font-bold focus:outline-none"
              placeholder="e.g. YOUR_BLYNK_AUTH_TOKEN"
            />
          </div>
        </div>

        {/* Relay Module Trigger Logic Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                {lang === 'km' ? 'ប្រភេទ Relay Module (Trigger Logic):' : 'Relay Module Trigger Mode:'}
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === 'km'
                  ? '៩៩% នៃ Relay Module លើទីផ្សារជាប្រភេទ Active LOW (បញ្ជូន LOW ដើម្បីបើក)'
                  : 'Almost all 5V/3.3V Relay modules for Arduino/ESP32 are Active LOW.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => {
                setRelayActiveLow(true);
                setCustomCode((prev) =>
                  prev.replace(/digitalWrite\(SMART_LAMP_PIN,\s*lampState\s*==\s*1\s*\?\s*HIGH\s*:\s*LOW\);/, 'digitalWrite(SMART_LAMP_PIN, lampState == 1 ? LOW : HIGH);')
                );
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                relayActiveLow ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active LOW (Relay Module) ⚡
            </button>
            <button
              onClick={() => {
                setRelayActiveLow(false);
                setCustomCode((prev) =>
                  prev.replace(/digitalWrite\(SMART_LAMP_PIN,\s*lampState\s*==\s*1\s*\?\s*LOW\s*:\s*HIGH\);/, 'digitalWrite(SMART_LAMP_PIN, lampState == 1 ? HIGH : LOW);')
                );
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                !relayActiveLow ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active HIGH (Direct LED) 💡
            </button>
          </div>
        </div>

        {/* Save Bar for Template Credentials */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-800">
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {lang === 'km' ? 'រក្សាទុកស្វ័យប្រវត្តិក្នង Browser (Auto-saved)' : 'Auto-saved in LocalStorage'}
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('sps_peh_template_id', blynkTemplateId);
              localStorage.setItem('sps_peh_template_name', blynkTemplateName);
              localStorage.setItem('sps_peh_auth_token', blynkAuthToken);
              triggerSaveNotification('✅ បានរក្សាទុក Blynk Template Info ជោគជ័យ!');
            }}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'រក្សាទុកការកំណត់ (Save All)' : 'Save Configuration'}</span>
          </button>
        </div>

        {/* Live Code Preview snippet */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 relative select-all overflow-x-auto">
          <pre className="text-emerald-400 font-bold">{blynkHeaderSnippet}</pre>
        </div>
      </div>

      {/* ⚠️ PROMINENT HARDWARE TROUBLESHOOTING & RELAY GUIDE */}
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-extrabold text-amber-300 flex items-center gap-2">
              <span>{lang === 'km' ? '🔧 ហេតុអ្វី Telegram ផ្ញើសារថាបើក តែអំពូលពិត (Relay/LED) មិនទាន់ភ្លឺ?' : '🔧 Why Telegram alerts ON but Physical Lamp / Relay is not lighting up?'}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {lang === 'km'
                ? 'នៅពេល Telegram ផ្ញើសារបាន នោះបញ្ជាក់ថា Chip ESP32 ទទួលបានបញ្ជាពី Cloud រួចរាល់ ១០០% ហើយ! មូលហេតុចម្បងដែលអំពូលពិតមិនភ្លឺ គឺបណ្ដាលមកពី ៣ ចំណុចខាងក្រោម៖'
                : 'Since Telegram successfully sent the alert, it proves the ESP32 received the command! The hardware not turning on is caused by one of these 3 reasons:'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          {/* Reason 1 */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono">
              មូលហេតុ #១ (៩៥% ជួបញឹកញាប់)
            </span>
            <h4 className="font-bold text-white text-xs">Relay Module ជាប្រភេទ Active LOW</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Relay module ភាគច្រើន ត្រូវបញ្ជូនសញ្ញា <strong>LOW (0)</strong> ទើបវាទាញបើក Relay (Click សំឡេងតាក់) ហើយបញ្ជូន <strong>HIGH (1)</strong> ដើម្បីបិទ។
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-amber-400 border border-slate-800">
              digitalWrite(12, LOW); // បើក Relay
            </div>
          </div>

          {/* Reason 2 */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-cyan-500/30 space-y-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold font-mono">
              មូលហេតុ #២ (ការតខ្សែ VCC/GND/IN)
            </span>
            <h4 className="font-bold text-white text-xs">តខ្សែជើង Relay Module</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              • ជើង <strong>VCC</strong> របស់ Relay ត្រូវតទៅ <strong>5V</strong> របស់ ESP32-CAM<br/>
              • ជើង <strong>GND</strong> តទៅ <strong>GND</strong><br/>
              • ជើង <strong>IN</strong> តទៅ <strong>GPIO 12</strong> (ឬ 13, 2, 14)<br/>
              • ខ្សែអំពូលភ្លើងត្រូវកាត់តភ្ជាប់រវាង <strong>COM</strong> និង <strong>NO</strong> (Normally Open)។
            </p>
          </div>

          {/* Reason 3 */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-emerald-500/30 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
              តេស្ត Flash LED Onboard
            </span>
            <h4 className="font-bold text-white text-xs">Flash LED (GPIO 4) លើ ESP32-CAM</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              យើងបានបន្ថែមឲ្យកូដបើក <strong>Flash LED ពណ៌ស (GPIO 4)</strong> នៅលើ ESP32-CAM ផ្ទាល់ដំណាលគ្នា។ នៅពេលអ្នកចុចបើក V0 ភ្លើង Flash លើបន្ទះ Chip នឹងភ្លឺច្បាស់ភ្លាមៗ!
            </p>
            <button
              onClick={() => dispatchChipCommand('V0', 1)}
              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition text-[11px]"
            >
              តេស្តចុចបើក V0 ឥឡូវនេះ 💡
            </button>
          </div>
        </div>
      </div>

      {/* SUB TAB 1: LIVE IN-APP CODE EDITOR */}
      {activeSubTab === 'editor' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'km' ? 'កន្លែងកែសម្រួល & ផ្លាស់ប្ដូរកូដ Arduino C++ ផ្ទាល់' : 'Live In-App Arduino C++ Code Editor'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-700">
                    INTERACTIVE IDE
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'km'
                    ? 'អ្នកអាចសរសេរ កែសម្រួល ឬបិទភ្ជាប់កូដ C++ របស់អ្នកនៅទីនេះ ហើយរក្សាទុក ឬទាញយកភ្លាមៗ'
                    : 'Edit, customize, or paste your Arduino C++ code here with live formatting and instant download.'}
                </p>
              </div>
            </div>

            {/* Template Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold mr-1">{lang === 'km' ? 'ជ្រើសរើស Device Template:' : 'Device Preset:'}</span>
              <button
                onClick={() => handleTemplateChange('esp32_school_lights')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_school_lights'
                    ? 'bg-purple-500/25 text-purple-300 border-purple-500/60 shadow-md ring-1 ring-purple-400/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🏫💡 Dev 7: ESP32 30-Pin School Lights
              </button>
              <button
                onClick={() => handleTemplateChange('esp32c3_smartbin_dualwall')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32c3_smartbin_dualwall'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🗑️💨💡 Dev 6: ESP32-C3 Bin + MQ-135 Air + Dual Switch
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_cam_smartlamp')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_cam_smartlamp'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                📸 Dev 5: ESP32-CAM Smart Lamp
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_alert')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_alert'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🚨 Dev 1: ESP32 30-Pin Alert System
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_smartbin')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_smartbin'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🗑️ Dev 2: ESP32 30-Pin Smart Bin
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_irrigation')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_irrigation'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🌱 Dev 3: ESP32 30-Pin Irrigation
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_30pin_traffic')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_30pin_traffic'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🚦 Dev 4: ESP32 30-Pin Traffic
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_direct_webserver')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  editorTemplatePreset === 'esp32_direct_webserver'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ⚡ Standalone Direct Web (No Blynk)
              </button>
            </div>
          </div>

          {/* Quick Snippet Injector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">{lang === 'km' ? 'បញ្ចូលរហ័ស:' : 'Insert / Replace:'}</span>
              <button
                onClick={() => {
                  setCustomCode((prev) =>
                    prev.replace(/char ssid\[\] = "[^"]*";/, `char ssid[] = "${wifiSsid}";`)
                        .replace(/char pass\[\] = "[^"]*";/, `char pass[] = "${wifiPass}";`)
                  );
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[11px] font-mono transition"
              >
                📶 Update WiFi ({wifiSsid})
              </button>
              <button
                onClick={() => {
                  setCustomCode((prev) =>
                    prev.replace(/const char\* TELEGRAM_BOT_TOKEN = "[^"]*";/, `const char\* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";`)
                        .replace(/const char\* TELEGRAM_CHAT_ID   = "[^"]*";/, `const char\* TELEGRAM_CHAT_ID   = "${telegramChatId}";`)
                  );
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 rounded-lg text-[11px] font-mono transition"
              >
                🤖 Update Telegram Bot Token
              </button>
              <button
                onClick={() => {
                  insertSnippet(`// Added Custom Virtual Pin\nBLYNK_WRITE(V3) {\n  int val = param.asInt();\n  Serial.println(val);\n}`);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-lg text-[11px] font-mono transition"
              >
                + Add BLYNK_WRITE(V3)
              </button>
            </div>

            {/* Font Size & Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Size:</span>
              {[12, 13, 14, 16].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setEditorFontSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    editorFontSize === sz ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>

          {/* Main Interactive Code Editor Box */}
          <div className="relative rounded-xl border-2 border-slate-800 focus-within:border-emerald-500/70 overflow-hidden bg-slate-950 shadow-inner">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-300 font-semibold ml-2">firmware.ino (Arduino C++)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>{customCode.split('\n').length} Lines</span>
                <span>{customCode.length} Characters</span>
              </div>
            </div>

            <textarea
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              spellCheck={false}
              className="w-full h-[520px] bg-slate-950 p-4 font-mono text-emerald-400 focus:outline-none resize-y selection:bg-emerald-500/30 leading-relaxed border-none"
              style={{ fontSize: `${editorFontSize}px` }}
            />
          </div>

          {/* Editor Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={saveCustomCode}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>{codeSavedNotification ? (lang === 'km' ? 'បានរក្សាទុក!' : 'Code Saved!') : (lang === 'km' ? 'រក្សាទុកកូដ (Save)' : 'Save Code')}</span>
              </button>

              <button
                onClick={resetCustomCodeToCurrentTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>{lang === 'km' ? 'កំណត់ឡើងវិញ (Reset)' : 'Reset to Template'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('remote')}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                <Radio className="w-4 h-4" />
                <span>{lang === 'km' ? 'តេស្តបញ្ជាទៅ Chip ផ្ទាល់' : 'Test Control Physical Chip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: UNIVERSAL CROSS-DEVICE REMOTE CHIP CONTROLLER */}
      {activeSubTab === 'remote' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'km' ? 'បញ្ជាពីគ្រប់ Device តាមកម្មវិធីទៅកាន់ Chip' : 'Universal Cross-Device Remote Chip Controller'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                    REAL-TIME SYNC
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'km'
                    ? 'បញ្ជាអំពូល (Smart_Lamp), Flash LED, Sensor ឬ Reboot ESP32 ពីគ្រប់ទូរស័ព្ទ កុំព្យូទ័រ ឬ Tablet តាមរយៈ Blynk Cloud, Local IP ឬ Web Serial'
                    : 'Dispatch commands directly to physical ESP32 / ESP32-CAM via Blynk Cloud REST API, Local WiFi IP, or Web Serial.'}
                </p>
              </div>
            </div>

            {/* Protocol Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setRemoteDispatchMode('blynk_cloud')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  remoteDispatchMode === 'blynk_cloud'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Blynk Cloud API</span>
              </button>
              <button
                onClick={() => setRemoteDispatchMode('local_ip')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  remoteDispatchMode === 'local_ip'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Local WiFi IP</span>
              </button>
              <button
                onClick={() => setRemoteDispatchMode('web_serial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  remoteDispatchMode === 'web_serial'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Usb className="w-3.5 h-3.5" />
                <span>Web Serial (USB/OTG)</span>
              </button>
            </div>
          </div>

          {/* Protocol Configuration Box */}
          {remoteDispatchMode === 'blynk_cloud' && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  {lang === 'km' ? 'ផ្លូវបញ្ជាឆ្លងកាត់ Blynk Cloud (ទូទាំងពិភពលោក):' : 'Blynk Cloud REST API Route (Global Internet):'}
                </span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">Token: {blynkAuthToken.slice(0, 8)}...</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {lang === 'km'
                  ? 'រាល់ពេលអ្នកចុចប៊ូតុងខាងក្រោម ប្រព័ន្ធនឹងផ្ញើសំណើ HTTP ទៅកាន់ Blynk Cloud Server ហើយ Chip ESP32 របស់អ្នកនឹងទទួលបញ្ជា BLYNK_WRITE(V0) ភ្លាមៗ!'
                  : 'Every switch action issues an authenticated HTTP PUT/GET to Blynk Cloud, triggering the real physical pin on your ESP32 in under 150ms.'}
              </p>
            </div>
          )}

          {remoteDispatchMode === 'local_ip' && (
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4" />
                    {lang === 'km' ? 'អាសយដ្ឋាន Local IP របស់ ESP32 ក្នុងបណ្តាញ Wi-Fi:' : 'ESP32 Local Network IP Address:'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {lang === 'km' ? 'រក្សាទុកស្វ័យប្រវត្តិ (Auto-saved into Storage)' : 'Auto-saved in LocalStorage'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={chipTargetIp}
                      onChange={(e) => {
                        setChipTargetIp(e.target.value);
                        localStorage.setItem('sps_peh_chip_ip', e.target.value);
                      }}
                      placeholder="192.168.0.169"
                      className="bg-slate-950 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400 shadow-inner"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">:80</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('sps_peh_chip_ip', chipTargetIp);
                      triggerSaveNotification(`✅ បានរក្សាទុក IP: ${chipTargetIp} ជោគជ័យ!`);
                    }}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? 'រក្សាទុក IP (Save)' : 'Save IP'}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-cyan-500/20">
                <p className="text-slate-300 text-[11px]">
                  {lang === 'km'
                    ? 'បញ្ជាផ្ទាល់ក្នុងបណ្តាញ Wi-Fi ក្នុងផ្ទះ (Sub-10ms Latency) ដោយមិនចាំបាច់ឆ្លងកាត់ Cloud Server'
                    : 'Direct local webhook execution (sub-10ms latency) without requiring internet or third-party servers.'}
                </p>
                {chipTargetIp && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const ifr = (document.getElementById('esp_hidden_sender') as HTMLIFrameElement) || document.createElement('iframe');
                        ifr.id = 'esp_hidden_sender';
                        ifr.style.display = 'none';
                        document.body.appendChild(ifr);
                        ifr.src = `http://${chipTargetIp}/on?t=${Date.now()}`;
                        setRemoteLampState(1);
                        setRemoteStatusMessage('💡 បានបញ្ជូនទៅ IP បើក (ON) ជោគជ័យ!');
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                    >
                      💡 ចុចបើកភ្លាម (LAN ON)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ifr = (document.getElementById('esp_hidden_sender') as HTMLIFrameElement) || document.createElement('iframe');
                        ifr.id = 'esp_hidden_sender';
                        ifr.style.display = 'none';
                        document.body.appendChild(ifr);
                        ifr.src = `http://${chipTargetIp}/off?t=${Date.now()}`;
                        setRemoteLampState(0);
                        setRemoteStatusMessage('⭕ បានបញ្ជូនទៅ IP បិទ (OFF) ជោគជ័យ!');
                      }}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-rose-500/20"
                    >
                      ⭕ ចុចបិទភ្លាម (LAN OFF)
                    </button>
                    <a
                      href={`http://${chipTargetIp}/on`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px]"
                    >
                      បើក New Tab
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {remoteDispatchMode === 'web_serial' && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Usb className="w-4 h-4" />
                  {lang === 'km' ? 'ភ្ជាប់ខ្សែ USB / OTG ផ្ទាល់ទៅកាន់ ESP32 (115200 Baud):' : 'Direct USB / OTG Web Serial Connection (115200 Baud):'}
                </span>
                <div>
                  {!serialConnected ? (
                    <button
                      onClick={handleConnectWebSerial}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs flex items-center gap-1.5"
                    >
                      <Usb className="w-3.5 h-3.5" />
                      <span>{lang === 'km' ? 'ជ្រើសរើស COM Port' : 'Connect COM Port'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnectWebSerial}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg transition text-xs"
                    >
                      <span>{lang === 'km' ? 'ផ្តាច់ការតភ្ជាប់' : 'Disconnect'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Serial Monitor */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 h-28 overflow-y-auto space-y-0.5">
                {serialLogs.length === 0 ? (
                  <span className="text-slate-600">{lang === 'km' ? 'រង់ចាំទិន្នន័យពី Serial Port...' : 'Waiting for serial data...'}</span>
                ) : (
                  serialLogs.map((log, idx) => <div key={idx}>{log}</div>)
                )}
              </div>

              {/* Custom Command Sender */}
              {serialConnected && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendCustomSerialCommand()}
                    placeholder="e.g. V0=1, V0=0, STATUS, RESTART"
                    className="flex-1 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-mono text-xs focus:outline-none"
                  />
                  <button
                    onClick={sendCustomSerialCommand}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}

          {/* INTERACTIVE PHYSICAL CHIP COMMAND CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. SMART LAMP TOGGLE (V0 / GPIO 12) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              remoteLampState === 1
                ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/60 shadow-xl shadow-amber-500/10'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    remoteLampState === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {remoteLampState === 1 ? 'ON (បើក)' : 'OFF (បិទ)'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">Smart_Lamp</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">GPIO {lampPin} (Pin 12 / Virtual Pin V0)</p>
                <p className="text-[10px] text-sky-400 mt-1">
                  {lang === 'km' ? '📢 ផ្ញើសារ Telegram ស្វ័យប្រវត្តិពេលប្តូរ' : '📢 Triggers Telegram notify automatically'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('V0', remoteLampState === 1 ? 0 : 1)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    remoteLampState === 1
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{remoteLampState === 1 ? (lang === 'km' ? 'ចុចដើម្បីបិទអំពូល' : 'Turn OFF Lamp') : (lang === 'km' ? 'ចុចដើម្បីបើកអំពូល' : 'Turn ON Lamp')}</span>
                </button>
              </div>
            </div>

            {/* 2. ESP32-CAM FLASH LED (GPIO 4) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              remoteFlashState === 1
                ? 'bg-gradient-to-br from-yellow-950/40 via-slate-900 to-slate-950 border-yellow-500/60 shadow-xl shadow-yellow-500/10'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    remoteFlashState === 1 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {remoteFlashState === 1 ? 'FLASH ON' : 'STANDBY'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">ESP32-CAM Flash</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">High-Power LED on GPIO 4</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'km' ? 'អំពូល Flash សម្រាប់ថតរូបពេលយប់' : 'High brightness illumination'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('V4', remoteFlashState === 1 ? 0 : 1)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    remoteFlashState === 1
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/20'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{remoteFlashState === 1 ? 'Turn OFF Flash' : 'Turn ON Flash'}</span>
                </button>
              </div>
            </div>

            {/* 3. MQ-135 SENSOR HAZARD TEST (Pin 14 / V1) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              remoteGasSimState === 1
                ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/60 shadow-xl shadow-rose-500/10'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    remoteGasSimState === 1 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {remoteGasSimState === 1 ? 'ALERT (HIGH)' : 'SAFE (NORMAL)'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">MQ-135 Gas Alert</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">GPIO {mq135Pin} Digital Out (V1)</p>
                <p className="text-[10px] text-rose-400 mt-1">
                  {lang === 'km' ? 'សាកល្បងប្រកាសអាសន្នផ្សែង' : 'Test gas hazard safety alarms'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('V1', remoteGasSimState === 1 ? 0 : 1)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    remoteGasSimState === 1
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>{remoteGasSimState === 1 ? (lang === 'km' ? 'កំណត់ជាធម្មតា (Safe)' : 'Set Normal') : (lang === 'km' ? 'តេស្តអាសន្នផ្សែង (Hazard)' : 'Trigger Gas Alert')}</span>
                </button>
              </div>
            </div>

            {/* 4. CHIP SOFTWARE REBOOT (OTA Reset) */}
            <div className="p-4 rounded-2xl border-2 border-slate-800 bg-slate-950/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
                    ESP.restart()
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">ESP32 Reboot</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Software Restart Command</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'km' ? 'បញ្ជាឱ្យ Microcontroller ចាប់ផ្តើមឡើងវិញ' : 'Send remote reset packet'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  disabled={remoteDispatching}
                  onClick={() => dispatchChipCommand('REBOOT', 1)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'km' ? 'Reboot ESP32' : 'Reboot ESP32'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status Message Display */}
          {remoteStatusMessage && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 flex items-center justify-between">
              <span>{remoteStatusMessage}</span>
              <span className="text-[10px] text-slate-500">{new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: TELEGRAM BOT NOTIFICATION CONFIGURATION */}
      {activeSubTab === 'telegram' && (
        <div className="bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'km' ? 'ការកំណត់ Telegram Bot សម្រាប់ផ្ញើសារដំណឹង' : 'Telegram Bot Alert Integration'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-700">
                    REAL-TIME ALERTS
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'km'
                    ? 'ផ្ញើសារស្វ័យប្រវត្តទៅ Telegram ពេលកម្រិត MQ135 រកឃើញផ្សែងពុល ឬពេល Smart_Lamp បើក/បិទ'
                    : 'Instant Telegram alerts when MQ-135 detects hazard or when Smart_Lamp toggles.'}
                </p>
              </div>
            </div>

            <button
              onClick={sendTestTelegram}
              disabled={telegramTesting}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-sky-500/20 self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {telegramTesting
                  ? (lang === 'km' ? 'កំពុងផ្ញើសារ...' : 'Sending...')
                  : (lang === 'km' ? 'តេស្តផ្ញើសារ Telegram' : 'Test Telegram Message')}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                TELEGRAM BOT TOKEN
              </label>
              <input
                type="text"
                value={telegramBotToken}
                onChange={(e) => {
                  setTelegramBotToken(e.target.value);
                  localStorage.setItem('sps_peh_telegram_bot_token', e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2 text-sky-400 font-mono text-xs font-bold focus:outline-none"
                placeholder="e.g. 8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                TELEGRAM CHAT ID
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => {
                  setTelegramChatId(e.target.value);
                  localStorage.setItem('sps_peh_telegram_chat_id', e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-mono text-xs font-bold focus:outline-none"
                placeholder="e.g. 5780071626"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-sky-500/20">
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {lang === 'km' ? 'រក្សាទុកស្វ័យប្រវត្តិក្នង Browser (Auto-saved)' : 'Auto-saved in LocalStorage'}
            </span>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('sps_peh_telegram_bot_token', telegramBotToken);
                localStorage.setItem('sps_peh_telegram_chat_id', telegramChatId);
                triggerSaveNotification('✅ បានរក្សាទុកការកំណត់ Telegram ជោគជ័យ!');
              }}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'រក្សាទុកការកំណត់ Telegram' : 'Save Telegram Settings'}</span>
            </button>
          </div>

          {telegramStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              telegramStatus === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}>
              {telegramStatus === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
              <span>
                {telegramStatus === 'success'
                  ? (lang === 'km' ? 'សារ Telegram បានផ្ញើជោគជ័យទៅកាន់ Chat ID ' + telegramChatId : 'Telegram message delivered successfully to Chat ID ' + telegramChatId)
                  : telegramStatus}
              </span>
            </div>
          )}

          {/* Telegram Rules & Logic Info */}
          <div className="p-4 bg-slate-950 rounded-xl border border-sky-500/20 text-xs space-y-2">
            <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'លក្ខខណ្ឌដែលប្រព័ន្ធផ្ញើសារទៅ Telegram (Automated Telegram Triggers):' : 'Automated Telegram Alert Triggers:'}</span>
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">⚠️</span>
                <span><strong>MQ-135 Air Quality Bad (GPIO 0 &gt;= 400 PPM):</strong> ផ្ញើសារប្រកាសអាសន្នខ្យល់ពុល៖ <code>⚠️ អាសន្ន! មានខ្យល់ពុលខ្លាំង (PPM) - សូមប្រុងប្រយ័ត្នចេញក្រៅសូមពាក់ម៉ាស តែបើមិនចាំបាច់សូមនៅក្នុងផ្ទះ ឬកន្លែងដែលមានបរិយាសកាសល្អ!!!</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">🗑️</span>
                <span><strong>សំរាមពេញក្នុងធុង (Level &gt;= 100% / &lt;= 5cm):</strong> ផ្ញើសារប្រកាសអាសន្ន៖ <code>សូមមកប្រមូលសម្រាមជាបន្ទាន់! សម្រាមពេញហើយ!!!</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>ពេល ESP32 ភ្ជាប់ WiFi ជោគជ័យ:</strong> ផ្ញើសារ <code>WiFi ភ្ជាប់ជោគជ័យ! IP: 192.168.x.x</code>។</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* SUB TAB 4: READ-ONLY C++ CODE VIEW */}
      {activeSubTab === 'code' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'km' ? 'កូដ Arduino C++ ពេញលេញ' : 'Arduino C++ Code Output'}</span>
            </h3>
            <button
              onClick={copyCustomCode}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed">
            <pre>{customCode}</pre>
          </div>
        </div>
      )}

      {/* SUB TAB 5: FLASHING GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            {lang === 'km' ? 'ជំហាន Flash កូដទៅ ESP32-CAM តាម Arduino IDE' : 'Flashing Guide for ESP32-CAM via Arduino IDE'}
          </h3>

          <div className="space-y-3 text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-1">១. ដំឡើង Library ចាំបាច់ (Install Required Libraries):</h4>
              <p className="text-slate-400 mb-2">
                បើក Arduino IDE ចូល <strong>Sketch &gt; Include Library &gt; Manage Libraries...</strong> រួចស្វែងរកដំឡើង៖
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-emerald-400">
                <li>Blynk by Volodymyr Shymanskyy (v1.3.x+)</li>
                <li>UrlEncode by Masayuki Sugahara (ដើម្បីផ្ញើសារអក្សរខ្មែរទៅ Telegram)</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-1">២. ជ្រើសរើស Board & Port សម្រាប់ ESP32-CAM:</h4>
              <p className="text-slate-400 mb-2">ចូល <strong>Tools &gt; Board &gt; ESP32 Arduino</strong> រួចជ្រើសរើស៖</p>
              <ul className="list-disc list-inside space-y-1 font-mono text-cyan-300">
                <li>Board: "AI Thinker ESP32-CAM"</li>
                <li>Upload Speed: "115200"</li>
                <li>Flash Frequency: "40MHz"</li>
                <li>Flash Mode: "QIO"</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">⚠️ ចំណាំសំខាន់ពេល Flash ESP32-CAM:</h4>
              <p className="text-slate-300">
                ត្រូវតខ្សែ <strong>GPIO 0 ទៅកាន់ GND</strong> មុនពេលចុចប៊ូតុង Upload។ បន្ទាប់ពី Upload ពេញ ១០០% សូមដកខ្សែ GPIO 0 ចេញពី GND រួចចុចប៊ូតុង <strong>RST / Reset</strong> នៅលើ ESP32-CAM។
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 6: HARDWARE WIRING */}
      {activeSubTab === 'wiring' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            {lang === 'km' ? 'តារាងតខ្សែ GPIO សម្រាប់ ESP32-CAM & ESP32' : 'Hardware Pinout & Wiring Connections'}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Device / Sensor</th>
                  <th className="py-2.5 px-3">ESP32 Pin</th>
                  <th className="py-2.5 px-3">Blynk Pin</th>
                  <th className="py-2.5 px-3">VCC</th>
                  <th className="py-2.5 px-3">GND</th>
                  <th className="py-2.5 px-3">Wiring Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-amber-400">Smart_Lamp (Relay / LED)</td>
                  <td className="py-2.5 px-3 text-white font-bold">GPIO {lampPin} (Pin 12)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">V0</td>
                  <td className="py-2.5 px-3 text-yellow-400">3.3V / 5V</td>
                  <td className="py-2.5 px-3">GND</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Relay IN or LED anode via 220Ω resistor</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">MQ-135 Gas / Air Quality</td>
                  <td className="py-2.5 px-3 text-white font-bold">GPIO {mq135Pin} (Pin 14 DO)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">V1</td>
                  <td className="py-2.5 px-3 text-yellow-400">5V (VIN)</td>
                  <td className="py-2.5 px-3">GND</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Digital Out (DO) to Pin 14 with INPUT_PULLUP</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-yellow-400">Built-in Flash LED</td>
                  <td className="py-2.5 px-3 text-white font-bold">GPIO 4</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">V4</td>
                  <td className="py-2.5 px-3 text-yellow-400">Internal</td>
                  <td className="py-2.5 px-3">Internal</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Onboard high brightness LED on ESP32-CAM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 7: REST API & CURL TEST */}
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
                <span className="font-semibold text-emerald-400">2. Direct Chip Command Endpoint:</span>
              </div>
              <code className="block bg-slate-900 p-2 rounded text-cyan-300 font-mono select-all overflow-x-auto">
                curl -X POST "{serverUrl}/api/iot/chip/command" -H "Content-Type: application/json" -d '{`{"pin":"V0","value":1,"blynkToken":"${blynkAuthToken}"}`}'
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold font-sans animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
};
