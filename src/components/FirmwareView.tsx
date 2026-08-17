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
  const [editorTemplatePreset, setEditorTemplatePreset] = useState<'esp32_cam_urlencode' | 'esp32_devkit' | 'esp32_direct_webserver' | 'esp8266_nodemcu'>('esp32_cam_urlencode');

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

  // 1. ESP32-CAM AI-Thinker Code with UrlEncode & Telegram Alerts (User Exact Project Specification)
  const esp32CamUrlEncodeCode = `/*
 * ==============================================================================
 * Project: Smart_Lamp & MQ135 Air Sensor on ESP32-CAM + Telegram Alerts
 * Hardware: ESP32-CAM (AI-Thinker)
 * Organization: SPS-PEH
 * ==============================================================================
 */

// 1. Blynk Cloud Template Credentials (Must be at the very top)
#define BLYNK_TEMPLATE_ID    "${blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME  "${blynkTemplateName}"
#define BLYNK_AUTH_TOKEN     "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h> // ប្រើ Library UrlEncode ដើម្បីស្រួលផ្ញើអក្សរខ្មែរ
#include <BlynkSimpleEsp32.h>

// ---------------------- 2. WIFI & TELEGRAM CREDENTIALS ------------------------
char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";

const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

// ---------------------- 3. HARDWARE GPIO PIN DEFINITIONS ----------------------
#define SMART_LAMP_PIN       ${lampPin}   // GPIO ${lampPin} for Smart_Lamp Relay (V0)
#define MQ135_PIN            ${mq135Pin}   // GPIO ${mq135Pin} (Digital Input / DO) for MQ-135 (V1)
#define ONBOARD_FLASH_LED     4   // Built-in Flash LED on GPIO 4

BlynkTimer timer;
bool lastAlarmSent = false;
unsigned long lastTgMsgTime = 0;

// ---------------------- 4. TELEGRAM SENDER FUNCTION --------------------------
void sendTelegramAlert(String message) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Skip SSL certificate check for ESP32-CAM

  HTTPClient https;
  // ប្រើ urlEncode() លើសារអក្សរខ្មែរ ឬ Emoji ដោយស្វ័យប្រវត្តិ
  String url = "https://api.telegram.org/bot" + String(TELEGRAM_BOT_TOKEN) + 
               "/sendMessage?chat_id=" + String(TELEGRAM_CHAT_ID) + 
               "&text=" + urlEncode(message) + "&parse_mode=HTML";

  Serial.println("[Telegram] Sending alert...");
  https.begin(client, url);
  int httpCode = https.GET();
  if (httpCode > 0) {
    Serial.printf("[Telegram] Message sent! (HTTP %d)\\n", httpCode);
  } else {
    Serial.printf("[Telegram] Error: %s\\n", https.errorToString(httpCode).c_str());
  }
  https.end();
}

// ---------------------- 5. BLYNK VIRTUAL PIN LISTENERS -----------------------
// V0: Smart_Lamp Relay Switch
BLYNK_WRITE(V0) {
  int lampState = param.asInt();

  // 💡 ចំណាំសំខាន់សម្រាប់ Relay Module៖
  // Relay Module ៩៩% លើទីផ្សារជាប្រភេទ Active LOW (LOW = បើក ON, HIGH = បិទ OFF)
  // ប្រសិនបើជា LED ធម្មតា (HIGH = ON, LOW = OFF)
  ${relayActiveLow ? `// កំណត់សម្រាប់ Relay Module (Active LOW)
  digitalWrite(SMART_LAMP_PIN, lampState == 1 ? LOW : HIGH);` : `// កំណត់សម្រាប់ LED ធម្មតា (Active HIGH)
  digitalWrite(SMART_LAMP_PIN, lampState == 1 ? HIGH : LOW);`}

  // 📸 បើក Flash LED ពណ៌សនៅលើ ESP32-CAM (GPIO 4) ដំណាលគ្នាដើម្បីងាយស្រួលដឹងថា Chip ដំណើរការ
  digitalWrite(ONBOARD_FLASH_LED, lampState == 1 ? HIGH : LOW);

  Serial.print("[Blynk] Smart_Lamp (GPIO ${lampPin} / V0) -> ");
  Serial.println(lampState == 1 ? "ON (Relay ON / Flash ON)" : "OFF (Relay OFF / Flash OFF)");

  String statusMsg = lampState == 1 
    ? "💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបើក (ON) ✅"
    : "💡 <b>[ESP32-CAM Smart_Lamp]</b> កុងតាក់ត្រូវបានបិទ (OFF) ⭕";
  sendTelegramAlert(statusMsg);
}

// ---------------------- 6. SENSOR TELEMETRY & ALARM SENDER -------------------
void sendMQ135Telemetry() {
  int gasDigital = digitalRead(MQ135_PIN);
  
  // 💡 ប្រសិនបើ MQ135 DO Module របស់អ្នកជា Active LOW (ភាគច្រើន)៖
  bool isGasAlert = (gasDigital == LOW); // កែជា HIGH វិញ ប្រសិនបើ Module របស់អ្នកជា Active HIGH

  Blynk.virtualWrite(V1, isGasAlert ? 1 : 0);
  Blynk.virtualWrite(V8, WiFi.RSSI());

  Serial.printf("[ESP32-CAM] MQ135 Digital (GPIO ${mq135Pin}): %s | WiFi RSSI: %d dBm\\n", 
                isGasAlert ? "HAZARD DETECTED" : "NORMAL", WiFi.RSSI());

  if (isGasAlert) {
    if (!lastAlarmSent || (millis() - lastTgMsgTime > 60000)) { // Limit alert 1 mn
      lastAlarmSent = true;
      lastTgMsgTime = millis();
      String alertMsg = "⚠️ <b>[ESP32-CAM MQ-135 អាសន្នផ្សែងពុល]</b>\\n"
                        "🚨 ស្ថានភាព: <b>រកឃើញមានផ្សែងពុល!</b>\\n"
                        "📍 ESP32-CAM Pin ${mq135Pin}\\n"
                        "⚠️ សូមប្រុងប្រយ័ត្ន និងបើកកង្ហារបន្សុទ្ធខ្យល់!";
      sendTelegramAlert(alertMsg);
    }
  } else {
    if (lastAlarmSent) {
      lastAlarmSent = false;
      String safeMsg = "✅ <b>[ESP32-CAM MQ-135 សុវត្ថិភាពឡើងវិញ]</b>\\n"
                       "🌿 កម្រិតខ្យល់: <b>មានសុវត្ថិភាព (Normal)</b>";
      sendTelegramAlert(safeMsg);
    }
  }
}

// ---------------------- 7. SETUP ---------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n[SPS-PEH] Booting ESP32-CAM Smart_Lamp & MQ135 Node...");

  pinMode(SMART_LAMP_PIN, OUTPUT);
  pinMode(MQ135_PIN, INPUT_PULLUP); // ប្រើ PULLUP ដើម្បីការពារ Signal រំខាន
  pinMode(ONBOARD_FLASH_LED, OUTPUT);
  
  // បិទ Relay ឬ LED ជាមុនពេល Boot
  digitalWrite(SMART_LAMP_PIN, ${relayActiveLow ? 'HIGH' : 'LOW'});
  digitalWrite(ONBOARD_FLASH_LED, LOW);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  sendTelegramAlert("🚀 <b>[ESP32-CAM]</b> Smart_Lamp & MQ135 Node ភ្ជាប់ជោគជ័យ! ✅");

  timer.setInterval(${intervalMs}L, sendMQ135Telemetry);
}

// ---------------------- 8. MAIN LOOP -----------------------------------------
void loop() {
  Blynk.run();
  timer.run();
}
`;

  // 2. ESP32 DevKit WROOM-32
  const esp32DevKitCode = `/*
 * Project: ESP32 DevKit WROOM-32 Smart_Lamp & MQ-135 Node
 * Organization: SPS-PEH
 */
#define BLYNK_TEMPLATE_ID   "${blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME "${blynkTemplateName}"
#define BLYNK_AUTH_TOKEN    "${blynkAuthToken}"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UrlEncode.h>
#include <BlynkSimpleEsp32.h>

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";
const char* TELEGRAM_BOT_TOKEN = "${telegramBotToken}";
const char* TELEGRAM_CHAT_ID   = "${telegramChatId}";

#define PIN_SMART_LAMP       ${lampPin}
#define PIN_MQ135_DO         ${mq135Pin}

BlynkTimer timer;
bool lastAlarmSent = false;
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

BLYNK_WRITE(V0) {
  int val = param.asInt();
  digitalWrite(PIN_SMART_LAMP, val == 1 ? HIGH : LOW);
  if (val == 1) {
    sendTelegramAlert("💡 <b>អំពូលកំពុងបើក</b>");
  } else {
    sendTelegramAlert("⭕ <b>អំពូលត្រូវបានបិទ</b>");
  }
}

void checkMQ135() {
  int gasDigital = digitalRead(PIN_MQ135_DO);
  bool isAlert = (gasDigital == HIGH);
  Blynk.virtualWrite(V1, isAlert ? 1 : 0);
  Blynk.virtualWrite(V8, WiFi.RSSI());

  if (isAlert && (!lastAlarmSent || (millis() - lastTgMsgTime > 60000))) {
    lastAlarmSent = true;
    lastTgMsgTime = millis();
    sendTelegramAlert("⚠️ <b>[ESP32 MQ-135 អាសន្នផ្សែងពុល]</b>\\n🚨 រកឃើញមានផ្សែងពុល!");
  } else if (!isAlert && lastAlarmSent) {
    lastAlarmSent = false;
    sendTelegramAlert("✅ <b>[ESP32 MQ-135]</b> ខ្យល់ល្អឡើងវិញ!");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SMART_LAMP, OUTPUT);
  pinMode(PIN_MQ135_DO, INPUT);
  digitalWrite(PIN_SMART_LAMP, LOW);
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
  timer.setInterval(2000L, checkMQ135);
}

void loop() {
  Blynk.run();
  timer.run();
}
`;

  // 3. Standalone Direct Web Server (No Blynk Required - Direct Browser to Chip Control)
  const esp32DirectWebServerCode = `/*
 * Project: ESP32 Standalone Web Server for Direct Browser-to-Chip Remote Control
 * No Blynk Server required - Control via Local IP or mDNS
 */
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "${wifiSsid}";
const char* password = "${wifiPass}";

WebServer server(80);
#define PIN_LAMP ${lampPin}
#define PIN_MQ135 ${mq135Pin}

void handleRoot() {
  String html = "<html><body style='font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#fff;'>";
  html += "<h2>💡 SPS-PEH ESP32 Direct Chip Controller</h2>";
  html += "<p>Status: Lamp is " + String(digitalRead(PIN_LAMP) == HIGH ? "<b style='color:#10b981'>ON</b>" : "<b style='color:#ef4444'>OFF</b>") + "</p>";
  html += "<a href='/control?pin=v0&val=1'><button style='padding:12px 24px;background:#10b981;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;margin:5px;'>TURN ON (បើក)</button></a> ";
  html += "<a href='/control?pin=v0&val=0'><button style='padding:12px 24px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;margin:5px;'>TURN OFF (បិទ)</button></a>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleControl() {
  if (server.hasArg("val")) {
    int val = server.arg("val").toInt();
    digitalWrite(PIN_LAMP, val == 1 ? HIGH : LOW);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\\"success\\":true,\\"lamp\\":" + String(val) + "}");
    return;
  }
  server.send(400, "text/plain", "Missing val");
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_MQ135, INPUT_PULLUP);
  digitalWrite(PIN_LAMP, LOW);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected. IP address: " + WiFi.localIP().toString());

  server.on("/", handleRoot);
  server.on("/control", handleControl);
  server.begin();
}

void loop() {
  server.handleClient();
}
`;

  // 4. ESP8266 NodeMCU Code
  const esp8266CppCode = `/*
 * Project: ESP8266 NodeMCU Smart_Lamp & MQ135
 */
#define BLYNK_TEMPLATE_ID   "${blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME "${blynkTemplateName}"
#define BLYNK_AUTH_TOKEN    "${blynkAuthToken}"

#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>

char ssid[] = "${wifiSsid}";
char pass[] = "${wifiPass}";

#define PIN_LAMP D1
#define PIN_MQ135 D2

BlynkTimer timer;

BLYNK_WRITE(V0) {
  int val = param.asInt();
  digitalWrite(PIN_LAMP, val == 1 ? HIGH : LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_MQ135, INPUT);
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
}

void loop() {
  Blynk.run();
  timer.run();
}
`;

  // Initialize custom code editor with the active template if empty
  useEffect(() => {
    const saved = localStorage.getItem('sps_peh_custom_arduino_code');
    if (saved && saved.length > 50) {
      setCustomCode(saved);
    } else {
      setCustomCode(esp32CamUrlEncodeCode);
    }
  }, []);

  const handleTemplateChange = (preset: 'esp32_cam_urlencode' | 'esp32_devkit' | 'esp32_direct_webserver' | 'esp8266_nodemcu') => {
    setEditorTemplatePreset(preset);
    let newCode = esp32CamUrlEncodeCode;
    if (preset === 'esp32_devkit') newCode = esp32DevKitCode;
    if (preset === 'esp32_direct_webserver') newCode = esp32DirectWebServerCode;
    if (preset === 'esp8266_nodemcu') newCode = esp8266CppCode;
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
    let base = esp32CamUrlEncodeCode;
    if (editorTemplatePreset === 'esp32_devkit') base = esp32DevKitCode;
    if (editorTemplatePreset === 'esp32_direct_webserver') base = esp32DirectWebServerCode;
    if (editorTemplatePreset === 'esp8266_nodemcu') base = esp8266CppCode;
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">{lang === 'km' ? 'គំរូកូដ Template:' : 'Preset Template:'}</span>
              <button
                onClick={() => handleTemplateChange('esp32_cam_urlencode')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                  editorTemplatePreset === 'esp32_cam_urlencode'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ESP32-CAM (AI-Thinker) + UrlEncode
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_devkit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                  editorTemplatePreset === 'esp32_devkit'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ESP32 DevKit WROOM
              </button>
              <button
                onClick={() => handleTemplateChange('esp32_direct_webserver')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                  editorTemplatePreset === 'esp32_direct_webserver'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Direct WebServer (No Blynk)
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
              <span>{lang === 'km' ? 'លក្ខខណ្ឌដែលប្រព័ន្ធផ្ញើសារទៅ Telegram:' : 'Automated Telegram Alert Triggers:'}</span>
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>ពេលបើកអំពូល (V0 = ON):</strong> ផ្ញើសារស្វ័យប្រវត្ត <code>💡 អំពូលកំពុងបើក</code> ទៅកាន់ Telegram ភ្លាមៗ។</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">✓</span>
                <span><strong>ពេលបិទអំពូល (V0 = OFF):</strong> ផ្ញើសារស្វ័យប្រវត្ត <code>⭕ អំពូលត្រូវបានបិទ</code>។</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">✓</span>
                <span><strong>ពេល MQ-135 រកឃើញផ្សែង (Pin 14 Digital DO):</strong> ផ្ញើសារប្រកាសអាសន្នផ្សែងពុល/ឧស្ម័នគ្រោះថ្នាក់។</span>
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
