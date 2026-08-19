import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DEVICES, INITIAL_AUTOMATIONS, generateInitialTelemetryHistory, INITIAL_LOGS } from './src/data/initialData';
import { IoTDevice, VirtualPinId, TelemetryPoint, DeviceLog, AutomationRule } from './src/types';

// In-memory persistent database across live session
let devices: IoTDevice[] = JSON.parse(JSON.stringify(INITIAL_DEVICES));
let automations: AutomationRule[] = JSON.parse(JSON.stringify(INITIAL_AUTOMATIONS));
let telemetryHistory: TelemetryPoint[] = generateInitialTelemetryHistory(40);
let logs: DeviceLog[] = JSON.parse(JSON.stringify(INITIAL_LOGS));
let isSimulating = true;
let sseClients: Response[] = [];
const manualPinOverrides = new Map<string, number>(); // key: deviceId:pin -> timestamp

// Helper to broadcast state to all open SSE connections
function broadcastSSE(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client, idx) => {
    try {
      client.write(payload);
    } catch {
      sseClients.splice(idx, 1);
    }
  });
}

// Evaluate automation rules
function evaluateAutomations(device: IoTDevice) {
  // Never run automated pin overrides on ESP32-C3 Wall Switch (V2/V3) or Smart Bin unless explicitly intended for it
  if (device.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL') {
    return;
  }

  const now = Date.now();
  automations.forEach(rule => {
    if (!rule.enabled) return;

    // Only apply greenhouse irrigation automations to greenhouse / irrigation devices
    if (rule.id === 'auto_soil_irrigation' && device.templateId !== 'TMPL_SMART_IRRIGATION') {
      return;
    }
    if (rule.id === 'auto_temp_fan_cooling' && device.templateId !== 'TMPL_SMART_IRRIGATION') {
      return;
    }
    if (rule.id === 'auto_gas_alarm_trigger' && device.templateId !== 'TMPL_ALERT_SYSTEM') {
      return;
    }

    const sourcePinDef = device.pins[rule.sourcePin];
    if (!sourcePinDef) return;

    // Check if target pin is currently under manual override (within 30 seconds)
    const overrideKey = `${device.id}:${rule.targetPin}`;
    const overriddenAt = manualPinOverrides.get(overrideKey);
    if (overriddenAt && now - overriddenAt < 30000) {
      return;
    }

    const currentVal = Number(sourcePinDef.value);
    let triggered = false;

    switch (rule.condition) {
      case 'gt': triggered = currentVal > rule.threshold; break;
      case 'gte': triggered = currentVal >= rule.threshold; break;
      case 'lt': triggered = currentVal < rule.threshold; break;
      case 'lte': triggered = currentVal <= rule.threshold; break;
      case 'eq': triggered = Math.abs(currentVal - rule.threshold) < 0.01; break;
    }

    if (triggered) {
      const targetPinDef = device.pins[rule.targetPin];
      if (targetPinDef && targetPinDef.value !== rule.targetValue) {
        targetPinDef.value = rule.targetValue;
        rule.lastTriggered = new Date().toLocaleTimeString();

        const logMsg: DeviceLog = {
          id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          deviceId: device.id,
          message: `[AUTOMATION TRIGGERED] ${rule.name} -> Set ${rule.targetPin} = ${rule.targetValue}`,
          messageKhmer: `ក្បួនស្វ័យប្រវត្តបានបញ្ជា: ${rule.nameKhmer} -> កំណត់ ${rule.targetPin} = ${rule.targetValue}`,
          source: 'AUTOMATION'
        };
        logs.unshift(logMsg);
        if (logs.length > 200) logs.pop();

        broadcastSSE('device_update', { deviceId: device.id, device });
        broadcastSSE('log_added', logMsg);
        broadcastSSE('automation_triggered', { ruleId: rule.id, lastTriggered: rule.lastTriggered });
      }
    }
  });
}

// Background simulation ticker for realistic sensor physics & ESP32 emulation
setInterval(() => {
  if (!isSimulating || devices.length === 0) return;

  devices.forEach(dev => {
    dev.lastSeen = 'Just now';
    dev.status = 'online';

    // 1. Alert System simulation
    if (dev.templateId === 'TMPL_ALERT_SYSTEM') {
      if (dev.pins.V0) {
        let coVal = Number(dev.pins.V0.value);
        coVal += Math.floor((Math.random() - 0.49) * 8);
        dev.pins.V0.value = Math.max(300, Math.min(495, coVal));
      }
      if (dev.pins.V1) {
        let press = Number(dev.pins.V1.value);
        press += (Math.random() - 0.5) * 0.15;
        dev.pins.V1.value = Number(Math.max(98.0, Math.min(108.0, press)).toFixed(2));
      }
      if (dev.pins.V2) {
        let water = Number(dev.pins.V2.value);
        water += Math.round((Math.random() - 0.5) * 2);
        dev.pins.V2.value = Math.max(5, Math.min(95, water));
      }
      if (dev.pins.V12) {
        let light = Number(dev.pins.V12.value);
        light += Math.round((Math.random() - 0.5) * 20);
        dev.pins.V12.value = Math.max(0, Math.min(2000, light));
      }
    }

    // 2. Smart Bin simulation
    if (dev.templateId === 'TMPL_SMART_BIN') {
      if (dev.pins.V1) {
        let dry = Number(dev.pins.V1.value);
        if (Math.random() > 0.7) dry = Math.min(100, Math.max(10, dry + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V1.value = dry;
      }
      if (dev.pins.V3) {
        let wet = Number(dev.pins.V3.value);
        if (Math.random() > 0.8) wet = Math.min(100, Math.max(5, wet + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V3.value = wet;
      }
      if (dev.pins.V7) {
        let odor = Number(dev.pins.V7.value);
        odor += Math.round((Math.random() - 0.48) * 4);
        dev.pins.V7.value = Math.max(60, Math.min(350, odor));
      }
    }

    // 3. Smart Agriculture simulation
    if (dev.templateId === 'TMPL_SMART_IRRIGATION' || dev.templateId === 'TMPL6BUNdn49f') {
      const pumpOn = Number(dev.pins.V0?.value) === 1;
      if (dev.pins.V1) {
        let soil = Number(dev.pins.V1.value);
        if (pumpOn) {
          soil = Math.min(100, soil + 0.5);
        } else {
          soil = Math.max(20, soil - 0.08);
        }
        dev.pins.V1.value = Number(soil.toFixed(1));
      }
      if (dev.pins.V2) {
        let temp = Number(dev.pins.V2.value);
        temp += (Math.random() - 0.48) * 0.15;
        dev.pins.V2.value = Number(Math.max(22, Math.min(55, temp)).toFixed(1));
      }
      if (dev.pins.V7) {
        let angle = Number(dev.pins.V7.value);
        let lux = Number(dev.pins.V4?.value ?? 500);
        // Move angle towards 90 when light is peak, or just cycle it
        const targetAngle = lux > 500 ? 145 : 45;
        angle += (targetAngle - angle) * 0.05 + (Math.random() - 0.5) * 0.5;
        dev.pins.V7.value = Number(Math.max(0, Math.min(180, angle)).toFixed(1));
      }
      if (dev.pins.V6) {
        let hum = Number(dev.pins.V6.value);
        hum += (Math.random() - 0.5) * 0.25;
        dev.pins.V6.value = Number(Math.max(40, Math.min(90, hum)).toFixed(1));
      }
      if (dev.pins.V4) {
        let light = Number(dev.pins.V4.value);
        light = Math.max(2, Math.min(100, light + Math.round((Math.random() - 0.5) * 2)));
        dev.pins.V4.value = light;
      }
    }

    // 4. Traffic Light & Parking simulation
    if (dev.templateId === 'TMPL_TRAFFIC_PARKING') {
      if (dev.pins.V1 && Math.random() > 0.75) {
        let spots = Number(dev.pins.V1.value);
        spots = Math.max(0, Math.min(20, spots + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V1.value = spots;
      }
      if (dev.pins.V2 && Math.random() > 0.7) {
        let carA = Number(dev.pins.V2.value);
        carA = Math.max(0, Math.min(15, carA + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V2.value = carA;
      }
      if (dev.pins.V3 && Math.random() > 0.7) {
        let carB = Number(dev.pins.V3.value);
        carB = Math.max(0, Math.min(15, carB + (Math.random() > 0.5 ? 1 : -1)));
        dev.pins.V3.value = carB;
      }
    }

    // 5. Smart Lamp & MQ135 Air Quality simulation
    if (dev.templateId === 'TMPL_SMART_LAMP_MQ135') {
      if (dev.pins.V1) {
        let air = Number(dev.pins.V1.value);
        const fanOn = Number(dev.pins.V3?.value) === 1;
        if (fanOn) {
          air = Math.max(80, air - Math.floor(Math.random() * 6 + 2));
        } else {
          air = Math.max(50, Math.min(950, air + Math.floor((Math.random() - 0.45) * 6)));
        }
        dev.pins.V1.value = air;

        // Auto Hazard siren trigger if above 450 ppm
        if (dev.pins.V5) {
          dev.pins.V5.value = air > 450 ? 1 : 0;
        }
        if (dev.pins.V9) {
          dev.pins.V9.value = Math.round(air * 2.2 + 20);
        }
      }
      if (dev.pins.V6) {
        let t = Number(dev.pins.V6.value);
        t += (Math.random() - 0.5) * 0.1;
        dev.pins.V6.value = Number(Math.max(20, Math.min(42, t)).toFixed(1));
      }
      if (dev.pins.V7) {
        let h = Number(dev.pins.V7.value);
        h += (Math.random() - 0.5) * 0.2;
        dev.pins.V7.value = Number(Math.max(30, Math.min(95, h)).toFixed(1));
      }
    }

    // 6. ESP32-C3 Smart Bin & Dual Switch & MQ-135 Air Quality (Dedicated Physical Device Sync)
    if (dev.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL') {
      const dist = Number(dev.pins.V1?.value ?? 10.0);
      // Strict ultrasonic calculation: 15cm=0%, 5cm=100%
      let pct = 0;
      if (dist >= 15.0) pct = 0;
      else if (dist <= 5.0) pct = 100;
      else pct = Math.round(((15.0 - dist) / 10.0) * 100);

      if (dev.pins.V0 && (dev.pins.V0.value === undefined || dev.pins.V0.value === null)) {
        dev.pins.V0.value = pct;
      }

      const ppm = Number(dev.pins.V4?.value ?? 120);
      const airBad = ppm >= 400;
      if (dev.pins.V5) {
        dev.pins.V5.value = airBad ? 1 : 0;
      }

      // Air Pollution Telegram Alert
      if (airBad && (!dev.pins.V6 || Number(dev.pins.V6.value) === 0)) {
        const logMsg: DeviceLog = {
          id: `tg_air_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'ERROR',
          deviceId: dev.id,
          message: `[TELEGRAM ALERT] ⚠️ អាសន្ន! មានខ្យល់ពុលខ្លាំង (${ppm} PPM) - សូមប្រុងប្រយ័ត្នចេញក្រៅសូមពាក់ម៉ាស តែបើមិនចាំបាច់សូមនៅក្នុងផ្ទះ ឬកន្លែងដែលមានបរិយាសកាសល្អ!!!`,
          messageKhmer: `ផ្ញើសារ Telegram: ⚠️ អាសន្ន! មានខ្យល់ពុលខ្លាំង (${ppm} PPM) - សូមប្រុងប្រយ័ត្នចេញក្រៅសូមពាក់ម៉ាស!`,
          source: 'TELEGRAM_BOT'
        };
        logs.unshift(logMsg);
        broadcastSSE('log_added', logMsg);
      }
    }

    // 7. School Light Controls
    if (dev.templateId === 'TMPL_SCHOOL_LIGHTS') {
      // Nothing to simulate here currently, these are just relays
    }

    evaluateAutomations(dev);

    // Real-time SSE update for this specific device
    broadcastSSE('device_updated', { deviceId: dev.id, device: dev });
  });

  const primaryDev = devices[0];
  if (primaryDev) {
    const now = Date.now();
    const alertDev = devices.find(d => d.templateId === 'TMPL_ALERT_SYSTEM');
    const c3Dev = devices.find(d => d.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL') || devices.find(d => d.templateId === 'TMPL_SMART_LAMP_MQ135');
    const coVal = Number(alertDev?.pins.V0?.value || 306);
    const mq135Val = Number(c3Dev?.pins.V4?.value || c3Dev?.pins.V1?.value || 185);
    const waterVal = Number(alertDev?.pins.V2?.value || 28);
    const pressVal = Number(alertDev?.pins.V1?.value || 103.5);

    const newPoint: TelemetryPoint = {
      timestamp: now,
      timeStr: new Date(now).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temperature: Number(devices.find(d => d.templateId === 'TMPL_SMART_IRRIGATION')?.pins.V2?.value || alertDev?.pins.V7?.value || 28.5),
      humidity: Number(devices.find(d => d.templateId === 'TMPL_SMART_IRRIGATION')?.pins.V6?.value || 68.0),
      gasCo: coVal,
      coLevel: coVal,
      airQualityMq135: mq135Val,
      waterLevel: waterVal,
      airPressure: pressVal,
      soilMoisture: Number(devices.find(d => d.templateId === 'TMPL_SMART_IRRIGATION')?.pins.V1?.value || 92),
      fanSpeed: Number(primaryDev.pins.V4?.value || 75),
      relay1: Number(primaryDev.pins.V0?.value || 1),
      relay2: Number(primaryDev.pins.V3?.value || 0),
    };

    telemetryHistory.push(newPoint);
    if (telemetryHistory.length > 300) {
      telemetryHistory.shift();
    }

    broadcastSSE('telemetry_tick', { point: newPoint, deviceId: primaryDev.id, pins: primaryDev.pins });
  }
}, 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS for external ESP32 / Arduino requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-blynk-token');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() });
  });

  // Server-Sent Events (SSE) for Real-time browser updates
  app.get('/api/iot/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to IoT Cloud Stream', timestamp: Date.now() })}\n\n`);
    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
  });

  // GET /api/iot/devices -> List devices
  app.get('/api/iot/devices', (_req: Request, res: Response) => {
    res.json({ success: true, devices });
  });

  // GET /api/iot/device/:token -> Get single device state by token or id
  app.get('/api/iot/device/:token', (req: Request, res: Response) => {
    const tokenOrId = req.params.token;
    const device = devices.find(d => d.authToken === tokenOrId || d.id === tokenOrId);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }
    res.json({ success: true, device });
  });

  // BLYNK & REST COMPLIANT UPDATE ENDPOINT:
  // Can be called via GET query: /api/iot/update?token=xxx&v0=25.4&v1=68&v2=1
  // Or GET /api/iot/update?token=xxx&pin=v0&value=25.4
  // Or POST JSON { token, pins: { V0: 25.4, V1: 68 }, rssi: -60, ip: "192.168.1.100" }
  const handleIotUpdate = (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const body = (req.body || {}) as Record<string, any>;

    const token = (query.token || body.token || query.auth || body.auth) as string;
    if (!token) {
      res.status(400).json({ success: false, error: 'Missing auth token. Pass ?token=YOUR_TOKEN' });
      return;
    }

    const device = devices.find(d => d.authToken === token || d.id === token);
    if (!device) {
      res.status(401).json({ success: false, error: 'Invalid Auth Token or unregistered device' });
      return;
    }

    device.lastSeen = 'Just now';
    device.status = 'online';
    if (query.rssi || body.rssi) device.rssi = Number(query.rssi || body.rssi);
    if (query.ip || body.ip) device.ipAddress = String(query.ip || body.ip);

    const prevV0 = device.pins.V0 ? Number(device.pins.V0.value) : undefined;
    let updatedPinsList: string[] = [];

    // Case 1: single pin update (?pin=v0&value=28.5)
    if (query.pin && query.value !== undefined) {
      const pinKey = (query.pin.toUpperCase()) as VirtualPinId;
      if (device.pins[pinKey]) {
        device.pins[pinKey].value = isNaN(Number(query.value)) ? query.value : Number(query.value);
        updatedPinsList.push(`${pinKey}=${query.value}`);
        manualPinOverrides.set(`${device.id}:${pinKey}`, Date.now());
      }
    }

    // Case 2: multi-pin query (?v0=28.5&v1=65&v5=320)
    Object.keys(query).forEach(k => {
      const upper = k.toUpperCase() as VirtualPinId;
      if (upper.startsWith('V') && device.pins[upper]) {
        const val = isNaN(Number(query[k])) ? query[k] : Number(query[k]);
        device.pins[upper].value = val;
        updatedPinsList.push(`${upper}=${val}`);
        manualPinOverrides.set(`${device.id}:${upper}`, Date.now());
      }
    });

    // Case 3: JSON body pins { V0: 28.5, V1: 65 }
    if (body.pins && typeof body.pins === 'object') {
      Object.keys(body.pins).forEach(k => {
        const upper = k.toUpperCase() as VirtualPinId;
        if (device.pins[upper]) {
          const val = isNaN(Number(body.pins[k])) ? body.pins[k] : Number(body.pins[k]);
          device.pins[upper].value = val;
          updatedPinsList.push(`${upper}=${val}`);
          manualPinOverrides.set(`${device.id}:${upper}`, Date.now());
        }
      });
    }

    // Direct body keys (e.g. { v0: 25.4 })
    Object.keys(body).forEach(k => {
      const upper = k.toUpperCase() as VirtualPinId;
      if (upper.startsWith('V') && device.pins[upper]) {
        const val = isNaN(Number(body[k])) ? body[k] : Number(body[k]);
        device.pins[upper].value = val;
        updatedPinsList.push(`${upper}=${val}`);
        manualPinOverrides.set(`${device.id}:${upper}`, Date.now());
      }
    });

    // Forward actuator pin updates (e.g. V0, V3, V4, V6) to Blynk Cloud REST API
    // so physical ESP32 connected to Blynk Cloud receives the BLYNK_WRITE(V0) trigger instantly
    if (device.authToken && device.authToken.length > 8 && updatedPinsList.length > 0) {
      updatedPinsList.forEach(item => {
        const [pinName, pinVal] = item.split('=');
        if (pinName) {
          const blynkPin = pinName.toLowerCase();
          const regionalEndpoints = [
            `https://blynk.cloud/external/api/update?token=${device.authToken}&${blynkPin}=${pinVal}`,
            `https://sgp1.blynk.cloud/external/api/update?token=${device.authToken}&${blynkPin}=${pinVal}`,
            `https://fra1.blynk.cloud/external/api/update?token=${device.authToken}&${blynkPin}=${pinVal}`
          ];
          regionalEndpoints.forEach(url => {
            fetch(url).catch(() => {});
          });
        }
      });
    }

    // Trigger Telegram notification if V0 (Smart_Lamp) was toggled
    const newV0 = device.pins.V0 ? Number(device.pins.V0.value) : undefined;
    if (prevV0 !== undefined && newV0 !== undefined && prevV0 !== newV0) {
      const tgMsg = newV0 === 1 ? '💡 <b>អំពូលកំពុងបើក</b>' : '⭕ <b>អំពូលត្រូវបានបិទ</b>';
      fetch('https://api.telegram.org/bot8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '5780071626',
          text: tgMsg,
          parse_mode: 'HTML',
        }),
      }).catch(err => console.error('[Telegram Notify Error]', err));
    }

    // Evaluate automations
    evaluateAutomations(device);

    // Create log message
    if (updatedPinsList.length > 0) {
      const logEntry: DeviceLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'DATA',
        deviceId: device.id,
        message: `[ESP32 -> CLOUD] Synced ${updatedPinsList.join(', ')}`,
        messageKhmer: `ទិន្នន័យពី ESP32 បាន Sync: ${updatedPinsList.join(', ')}`,
        source: 'ESP32_FIRMWARE'
      };
      logs.unshift(logEntry);
      if (logs.length > 200) logs.pop();
      broadcastSSE('log_added', logEntry);
    }

    // Broadcast full updated device to frontend
    broadcastSSE('device_update', { deviceId: device.id, device });

    // Respond OK
    res.json({
      success: true,
      message: 'Pins updated successfully',
      updated: updatedPinsList,
      timestamp: Date.now()
    });
  };

  app.get('/api/iot/update', handleIotUpdate);
  app.post('/api/iot/update', handleIotUpdate);

  // Direct Blynk-compatible endpoint: /external/api/update
  app.get('/external/api/update', handleIotUpdate);
  app.post('/external/api/update', handleIotUpdate);

  // Direct Blynk-compatible endpoint: /external/api/get?token=xxx&v0
  // Or /api/iot/get?token=xxx&pin=v0
  const handleIotGet = (req: Request, res: Response) => {
    const token = (req.query.token || req.query.auth) as string;
    if (!token) {
      res.status(400).send('Missing token');
      return;
    }
    const device = devices.find(d => d.authToken === token || d.id === token);
    if (!device) {
      res.status(404).send('Device not found');
      return;
    }

    // Mark device as online on this self-hosted server
    device.status = 'online';
    device.lastSeen = 'Just now';

    // Find requested pin
    const pinParam = (req.query.pin || Object.keys(req.query).find(k => k.toLowerCase().startsWith('v') && k.toLowerCase() !== 'token')) as string;
    if (pinParam) {
      const pinUpper = pinParam.toUpperCase() as VirtualPinId;
      if (device.pins[pinUpper]) {
        const val = device.pins[pinUpper].value;
        // Return raw text format like Blynk API
        res.setHeader('Content-Type', 'text/plain');
        res.send(String(val));
        return;
      }
    }

    // Default: return all pins JSON
    const pinsMap: Record<string, any> = {};
    Object.keys(device.pins).forEach(k => {
      const pk = k as VirtualPinId;
      pinsMap[k.toLowerCase()] = device.pins[pk].value;
    });
    res.json(pinsMap);
  };

  app.get('/external/api/get', handleIotGet);
  app.get('/api/iot/get', handleIotGet);
  app.get('/api/iot/poll', handleIotGet);

  // POST /api/iot/chip/command -> Universal Cross-Device Remote Control to Physical Chip
  app.post('/api/iot/chip/command', async (req: Request, res: Response) => {
    const { deviceId = 'dev_smart_lamp_mq135', pin = 'V0', value = 1, blynkToken, chipIp, sendTelegram = true } = req.body;

    const device = devices.find(d => d.id === deviceId || d.authToken === blynkToken) || devices[0];
    const upperPin = (pin.toUpperCase()) as VirtualPinId;

    if (device && device.pins[upperPin]) {
      const prevVal = device.pins[upperPin].value;
      device.pins[upperPin].value = Number(value);
      manualPinOverrides.set(`${device.id}:${upperPin}`, Date.now());
      device.lastUpdated = 'Just now';

      // Telegram alert on V0 Lamp toggle
      if (sendTelegram && upperPin === 'V0' && prevVal !== Number(value)) {
        const tgMsg = Number(value) === 1 ? '💡 <b>អំពូលកំពុងបើក</b>' : '⭕ <b>អំពូលត្រូវបានបិទ</b>';
        fetch('https://api.telegram.org/bot8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: '5780071626',
            text: tgMsg,
            parse_mode: 'HTML',
          }),
        }).catch(err => console.error('[Telegram Forward Error]', err));
      }

      // Add execution log
      const logEntry: DeviceLog = {
        id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        deviceId: device.id,
        message: `[REMOTE DISPATCH] ${upperPin} -> ${value} sent to physical chip/cloud`,
        messageKhmer: `បានបញ្ជាពីចម្ងាយ: ${upperPin} -> ${value === 1 ? 'ON (បើក)' : 'OFF (បិទ)'} ទៅកាន់ Chip`,
        source: 'CLOUD_API'
      };
      logs.unshift(logEntry);
      if (logs.length > 200) logs.pop();
      broadcastSSE('log_added', logEntry);
      broadcastSSE('device_update', { deviceId: device.id, device });
    }

    // Forward to Blynk Cloud REST API across all regional clusters
    let blynkResult: any = null;
    const tokenToUse = blynkToken || (device ? device.authToken : null);
    if (tokenToUse && tokenToUse.length > 8) {
      const pinLower = pin.toLowerCase();
      const pinUpper = pin.toUpperCase();
      const clusters = [
        `https://sgp1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://fra1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://ny3.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://blr1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinLower}=${value}`,
        `https://sgp1.blynk.cloud/external/api/update?token=${tokenToUse}&${pinUpper}=${value}`,
        `https://blynk.cloud/external/api/update?token=${tokenToUse}&${pinUpper}=${value}`
      ];

      const results = await Promise.allSettled(
        clusters.map(url => fetch(url, { method: 'GET' }).then(r => ({ url, status: r.status, ok: r.ok })))
      );

      const successful = results.find(r => r.status === 'fulfilled' && (r.value.ok || r.value.status === 200));
      blynkResult = {
        ok: !!successful,
        details: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message })
      };
    }

    // Forward to Local IP if specified
    let ipResult: any = null;
    if (chipIp && chipIp.length > 6) {
      try {
        const localUrl = `http://${chipIp}/control?pin=${pin.toLowerCase()}&val=${value}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const ipRes = await fetch(localUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        ipResult = { ok: ipRes.ok, status: ipRes.status };
      } catch (err: any) {
        ipResult = { ok: false, error: 'Local IP unreachable or timeout' };
      }
    }

    res.json({
      success: true,
      pin: upperPin,
      value: Number(value),
      blynkCloud: blynkResult,
      localIp: ipResult,
      timestamp: Date.now()
    });
  });

  // GET /api/iot/chip/poll-ip?ip=192.168.0.169 -> Read live telemetry & status from physical ESP32
  app.get('/api/iot/chip/poll-ip', async (req: Request, res: Response) => {
    const ip = (req.query.ip as string) || '192.168.0.169';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const espRes = await fetch(`http://${ip}/status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (espRes.ok) {
        const data = await espRes.json();
        res.json({ success: true, data, ip });
        return;
      }
      res.json({ success: false, error: `HTTP ${espRes.status}`, ip });
    } catch (err: any) {
      res.json({ success: false, error: err?.message || 'Host unreachable', ip });
    }
  });

  // POST /api/iot/device/update-ip -> Update IP address of any device
  app.post('/api/iot/device/update-ip', (req: Request, res: Response) => {
    const { deviceId, ipAddress } = req.body;
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }
    dev.ipAddress = ipAddress || '192.168.0.169';
    dev.lastUpdated = 'Just now';
    broadcastSSE('device_update', { deviceId: dev.id, device: dev });
    res.json({ success: true, device: dev });
  });

  // GET /api/iot/get?token=xxx&pin=v2 -> Microcontroller reads a single pin (e.g. Relay ON/OFF status)
  app.get('/api/iot/get', (req: Request, res: Response) => {
    const token = (req.query.token || req.query.auth) as string;
    const pin = (req.query.pin || req.query.v) as string;

    if (!token || !pin) {
      res.status(400).send('ERR_PARAM');
      return;
    }

    const device = devices.find(d => d.authToken === token || d.id === token);
    if (!device) {
      res.status(404).send('ERR_AUTH');
      return;
    }

    const upper = pin.toUpperCase() as VirtualPinId;
    const pinDef = device.pins[upper];
    if (!pinDef) {
      res.status(404).send('ERR_PIN');
      return;
    }

    // Return pure scalar for ultra-lightweight ESP32 reading
    res.setHeader('Content-Type', 'text/plain');
    res.send(String(pinDef.value));
  });

  // GET /api/iot/all?token=xxx -> Microcontroller reads all pin states at once
  app.get('/api/iot/all', (req: Request, res: Response) => {
    const token = (req.query.token || req.query.auth) as string;
    if (!token) {
      res.status(400).json({ error: 'Missing token' });
      return;
    }

    const device = devices.find(d => d.authToken === token || d.id === token);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const pinValues: Record<string, any> = {};
    Object.keys(device.pins).forEach(p => {
      pinValues[p] = device.pins[p as VirtualPinId].value;
    });

    res.json({
      success: true,
      deviceId: device.id,
      pins: pinValues,
      timestamp: Date.now()
    });
  });

  // Direct ESP32-C3 Smart Bin & Dual Switch & MQ-135 Endpoints (Exact Match to User Code)
  // 1. Direct real-time sensor push endpoint for ESP32-C3
  const handleC3DirectUpdate = (req: Request, res: Response) => {
    const q = req.query as Record<string, string>;
    const b = (req.body || {}) as Record<string, any>;
    const c3Dev = devices.find(d => d.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL') || devices[0];

    const rawDist = q.distance ?? q.dist ?? q.v1 ?? b.distance ?? b.dist ?? b.v1;
    const rawLevel = q.level ?? q.pct ?? q.v0 ?? b.level ?? b.pct ?? b.v0;
    const rawPpm = q.ppm ?? q.v4 ?? b.ppm ?? b.v4;
    const rawAirBad = q.airBad ?? q.v5 ?? b.airBad ?? b.v5;

    if (rawDist !== undefined && c3Dev.pins.V1) {
      c3Dev.pins.V1.value = Number(Number(rawDist).toFixed(1));
    }
    if (rawLevel !== undefined && c3Dev.pins.V0) {
      c3Dev.pins.V0.value = Math.round(Number(rawLevel));
    } else if (rawDist !== undefined && c3Dev.pins.V0) {
      const d = Number(rawDist);
      let pct = 0;
      if (d >= 20.0) pct = 0;
      else if (d <= 5.0) pct = 100;
      else pct = Math.round(((20.0 - d) / 15.0) * 100);
      c3Dev.pins.V0.value = pct;
    }

    if (rawPpm !== undefined && c3Dev.pins.V4) {
      c3Dev.pins.V4.value = Math.round(Number(rawPpm));
    }
    if (rawAirBad !== undefined && c3Dev.pins.V5) {
      c3Dev.pins.V5.value = (rawAirBad === 'true' || rawAirBad === '1' || Number(rawAirBad) === 1 || Number(rawPpm) >= 400) ? 1 : 0;
    } else if (rawPpm !== undefined && c3Dev.pins.V5) {
      c3Dev.pins.V5.value = Number(rawPpm) >= 400 ? 1 : 0;
    }

    c3Dev.lastSeen = 'Just now (live)';
    c3Dev.status = 'online';

    // Broadcast SSE update to React UI
    broadcastSSE('device_update', { deviceId: c3Dev.id, device: c3Dev });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      success: true,
      distance: c3Dev.pins.V1?.value,
      level: c3Dev.pins.V0?.value,
      ppm: c3Dev.pins.V4?.value,
      airBad: c3Dev.pins.V5?.value === 1,
      timestamp: Date.now()
    });
  };

  app.get('/api/iot/c3/update', handleC3DirectUpdate);
  app.post('/api/iot/c3/update', handleC3DirectUpdate);
  app.get('/update', handleC3DirectUpdate);

  app.get('/data', (_req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const c3Dev = devices.find(d => d.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL') || devices[0];
    const dist = Number(c3Dev?.pins.V1?.value ?? 12.5);
    let level = Number(c3Dev?.pins.V0?.value);
    if (isNaN(level) || level === undefined) {
      if (dist >= 20.0) level = 0;
      else if (dist <= 5.0) level = 100;
      else level = Math.round(((20.0 - dist) / 15.0) * 100);
    }
    const ppm = Number(c3Dev?.pins.V4?.value ?? 95);
    const airBad = ppm >= 400 || Number(c3Dev?.pins.V5?.value ?? 0) === 1;
    res.json({
      distance: Number(dist.toFixed(1)),
      level: Math.round(level),
      ppm: Math.round(ppm),
      airBad: airBad
    });
  });

  app.get('/led1/on', (_req: Request, res: Response) => {
    const c3Dev = devices.find(d => d.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL');
    if (c3Dev && c3Dev.pins.V2) {
      c3Dev.pins.V2.value = 1;
      broadcastSSE('device_update', { deviceId: c3Dev.id, device: c3Dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('1');
  });

  app.get('/led1/off', (_req: Request, res: Response) => {
    const c3Dev = devices.find(d => d.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL');
    if (c3Dev && c3Dev.pins.V2) {
      c3Dev.pins.V2.value = 0;
      broadcastSSE('device_update', { deviceId: c3Dev.id, device: c3Dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('0');
  });

  app.get('/led2/on', (_req: Request, res: Response) => {
    const c3Dev = devices.find(d => d.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL');
    if (c3Dev && c3Dev.pins.V3) {
      c3Dev.pins.V3.value = 1;
      broadcastSSE('device_update', { deviceId: c3Dev.id, device: c3Dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('1');
  });

  app.get('/led2/off', (_req: Request, res: Response) => {
    const c3Dev = devices.find(d => d.templateId === 'TMPL_ESP32C3_SMART_BIN_DUAL');
    if (c3Dev && c3Dev.pins.V3) {
      c3Dev.pins.V3.value = 0;
      broadcastSSE('device_update', { deviceId: c3Dev.id, device: c3Dev });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send('0');
  });

  // GET /api/iot/history -> Telemetry chart data points
  app.get('/api/iot/history', (req: Request, res: Response) => {
    const range = (req.query.range as string) || 'live';
    let data = [...telemetryHistory];

    if (range === 'live') {
      data = data.slice(-30);
    } else if (range === '1h') {
      data = data.slice(-60);
    } else if (range === '6h') {
      data = data.slice(-120);
    }

    res.json({ success: true, count: data.length, points: data });
  });

  // GET /api/iot/logs -> System Logs
  app.get('/api/iot/logs', (_req: Request, res: Response) => {
    res.json({ success: true, logs });
  });

  // POST /api/iot/logs/clear -> Clear terminal logs
  app.post('/api/iot/logs/clear', (_req: Request, res: Response) => {
    logs = [];
    broadcastSSE('logs_cleared', {});
    res.json({ success: true });
  });

  // POST /api/telegram/send -> Send real Telegram message using Bot Token & Chat ID
  app.post('/api/telegram/send', async (req: Request, res: Response) => {
    const { botToken = '8928313450:AAEvmTZMGGDXRJZ-W1ZuE2vc5AlVSQ5oDbY', chatId = '5780071626', message, parseMode = 'HTML' } = req.body;

    if (!message) {
      res.status(400).json({ success: false, error: 'Missing message body' });
      return;
    }

    try {
      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
        }),
      });

      const data = await response.json() as { ok: boolean; description?: string; result?: any };
      if (!data.ok) {
        res.status(400).json({ success: false, error: data.description || 'Telegram API error' });
        return;
      }

      // Add log
      const logEntry: DeviceLog = {
        id: `tg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        deviceId: 'dev_smart_lamp_mq135',
        message: `[TELEGRAM SENT] -> Chat ID ${chatId}: ${message.slice(0, 60)}...`,
        messageKhmer: `សារ Telegram បានផ្ញើជោគជ័យទៅកាន់ ID ${chatId}`,
        source: 'TELEGRAM_BOT'
      };
      logs.unshift(logEntry);
      if (logs.length > 200) logs.pop();
      broadcastSSE('log_added', logEntry);

      res.json({ success: true, result: data.result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to send Telegram message' });
    }
  });

  // POST /api/iot/automations -> Save automation rules
  app.get('/api/iot/automations', (_req: Request, res: Response) => {
    res.json({ success: true, automations });
  });

  app.post('/api/iot/automations', (req: Request, res: Response) => {
    const newRules = req.body.automations as AutomationRule[];
    if (Array.isArray(newRules)) {
      automations = newRules;
      broadcastSSE('automations_updated', automations);
      res.json({ success: true, automations });
      return;
    }
    res.status(400).json({ success: false, error: 'Expected array of automations' });
  });

  // POST /api/iot/simulate/toggle -> Toggle simulation
  app.post('/api/iot/simulate/toggle', (req: Request, res: Response) => {
    if (req.body.enabled !== undefined) {
      isSimulating = Boolean(req.body.enabled);
    } else {
      isSimulating = !isSimulating;
    }
    broadcastSSE('simulation_status', { isSimulating });
    res.json({ success: true, isSimulating });
  });

  // POST /api/iot/device/create -> Add custom device
  app.post('/api/iot/device/create', (req: Request, res: Response) => {
    const { name, nameKhmer, templateId, orgId } = req.body;
    const newId = `dev_esp32_${Date.now().toString(36)}`;
    const randomHex = Math.random().toString(16).substring(2, 8);
    const newAuthToken = `blynk_esp32_${randomHex}_${Date.now().toString(36)}`;

    const newDevice: IoTDevice = {
      id: newId,
      name: name || 'ESP32 Custom Node',
      nameKhmer: nameKhmer || 'ESP32 ឧបករណ៍ថ្មី',
      authToken: newAuthToken,
      orgId: orgId || 'ORG-KHMER-IOT-01',
      templateId: templateId || 'TMPL_GENERIC_ESP32',
      status: 'online',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 150 + 100)}`,
      macAddress: `24:6F:28:${randomHex.slice(0, 2).toUpperCase()}:${randomHex.slice(2, 4).toUpperCase()}:${randomHex.slice(4, 6).toUpperCase()}`,
      rssi: -55 - Math.floor(Math.random() * 20),
      firmwareVersion: 'v2.4.1',
      hardware: 'ESP32-WROOM-32',
      lastSeen: 'Just created',
      lastUpdated: '1 minute ago',
      owner: 'Admin (You)',
      location: 'Custom Station',
      pins: JSON.parse(JSON.stringify(INITIAL_DEVICES[0].pins))
    };

    devices.push(newDevice);
    broadcastSSE('device_created', newDevice);
    res.json({ success: true, device: newDevice });
  });

  // POST /api/iot/device/regenerate-token
  app.post('/api/iot/device/regenerate-token', (req: Request, res: Response) => {
    const { deviceId } = req.body;
    const device = devices.find(d => d.id === deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    const randomHex = Math.random().toString(16).substring(2, 10);
    device.authToken = `blynk_esp32_${randomHex}_${Date.now().toString(36)}`;
    broadcastSSE('device_update', { deviceId: device.id, device });
    res.json({ success: true, authToken: device.authToken });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Blynk IoT Cloud Console Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
