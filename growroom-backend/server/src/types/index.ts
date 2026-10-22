export interface Room {
    id: number;
    name: string;
    light: number;
    humidity: number;
    temperature: number;
    irrigation: boolean;
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
}