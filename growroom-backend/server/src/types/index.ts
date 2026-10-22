export interface Room {
    id: number;
    name: string;
    // Live values (latest sensor readings)
    light: number;
    humidity: number;
    temperature: number;
    // Control setpoints
    lightSetting: number;
    humiditySetting: number;
    temperatureSetting: number;
    irrigation: boolean;
    // Light cycle schedule
    lightCycleHours: number;   // 0 = off, 24 = always on, otherwise daily photoperiod
    lightOnAt: string;         // 'HH:MM:SS' local time the on-window starts
    lightOn: boolean;          // computed by the scheduler, consumed by the Pi
}

export interface SensorReading {
    temperature?: number;
    humidity?: number;
    light?: number;
}

export interface SensorData {
    roomId: number;
    light: number;
    humidity: number;
    temperature: number;
    timestamp: Date;
}

export interface ControlSettings {
    light: number;
    humidity: number;
    temperature: number;
    irrigation: boolean;
    lightCycleHours?: number;
    lightOnAt?: string;
}
