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
    // Grow cycle (fertilizer calculation)
    cycleStartDate: string | null;   // 'YYYY-MM-DD' day the grow cycle started
    fertilizerFamily: string | null; // fertilizer schedule family id
    growWeek: number | null;        // computed: current week of the grow cycle
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

/** One point of the room history time series (GET /api/rooms/:id/history). */
export interface HistoryPoint {
    timestamp: number;         // epoch ms
    temperature?: number;
    humidity?: number;
    light?: number;
    irrigation?: boolean;
}

export interface ControlSettings {
    name?: string;
    light: number;
    humidity: number;
    temperature: number;
    irrigation: boolean;
    lightCycleHours?: number;
    lightOnAt?: string;
    cycleStartDate?: string;      // 'YYYY-MM-DD'
    fertilizerFamily?: string;
}

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'admin' | 'operator';
}

export interface JwtPayload {
    userId: number;
    email: string;
    role: 'admin' | 'operator';
}
