export type VirtualPinId =
  | 'V0'
  | 'V1'
  | 'V2'
  | 'V3'
  | 'V4'
  | 'V5'
  | 'V6'
  | 'V7'
  | 'V8'
  | 'V9'
  | 'V10'
  | 'V11'
  | 'V12'
  | 'V13'
  | 'V14'
  | 'V15';

export type PinType =
  | 'sensor_temperature'
  | 'sensor_humidity'
  | 'sensor_gas'
  | 'sensor_soil'
  | 'sensor_voltage'
  | 'sensor_pressure'
  | 'sensor_light'
  | 'sensor_distance'
  | 'relay'
  | 'slider_pwm'
  | 'rgb_light'
  | 'status_led'
  | 'counter'
  | 'generic';

export interface PinDefinition {
  pin: VirtualPinId;
  label: string;
  labelKhmer: string;
  type: PinType;
  unit?: string;
  min: number;
  max: number;
  value: number | string;
  gpioPin?: number;
  color: string;
  iconName: string;
  history?: number[];
}

export interface IoTDevice {
  id: string;
  name: string;
  nameKhmer: string;
  authToken: string;
  orgId: string;
  templateId: string;
  owner: string;
  status: 'online' | 'offline' | 'inactive' | 'warning';
  ipAddress: string;
  macAddress: string;
  rssi: number; // dBm (-30 to -90)
  firmwareVersion: string;
  hardware: string;
  lastSeen: string;
  lastUpdated: string;
  location: string;
  pins: Record<VirtualPinId, PinDefinition>;
}

export interface TelemetryPoint {
  timestamp: number;
  timeStr: string;
  temperature: number; // V0
  humidity: number;    // V1
  gasCo: number;       // V5
  soilMoisture: number;// V7
  fanSpeed: number;    // V4
  relay1: number;      // V2
  relay2: number;      // V3
}

export interface AutomationRule {
  id: string;
  name: string;
  nameKhmer: string;
  enabled: boolean;
  sourcePin: VirtualPinId;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  targetPin: VirtualPinId;
  targetValue: number;
  cooldownSeconds: number;
  lastTriggered?: string;
  actionDescription: string;
}

export interface DeviceLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DATA';
  deviceId: string;
  message: string;
  messageKhmer?: string;
  source: 'ESP32_FIRMWARE' | 'CLOUD_API' | 'AUTOMATION' | 'SIMULATOR';
}

export type TimeFilter = 'live' | '1h' | '6h' | '1d' | '1w' | '1mo';

export type NavigationTab = 'dashboard' | 'devices' | 'analytics' | 'automations' | 'logs' | 'firmware' | 'simulator';
