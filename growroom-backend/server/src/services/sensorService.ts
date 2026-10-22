import db from '../db/mysql';
import { Room, SensorReading, HistoryPoint } from '../types';
import { isLightOn } from './lightScheduler';
import { computeGrowWeek } from './fertilizerService';

// Mock data for development (when the DB is unavailable)
const mockRooms: Room[] = [
  {
    id: 1,
    name: 'Grow Room 1',
    light: 100,
    humidity: 65,
    temperature: 24.5,
    lightSetting: 100,
    humiditySetting: 65,
    temperatureSetting: 24.5,
    irrigation: false,
    lightCycleHours: 18,
    lightOnAt: '06:00:00',
    lightOn: true,
    cycleStartDate: '2026-10-08',
    fertilizerFamily: 'canna-coco',
    growWeek: 3
  },
  {
    id: 2,
    name: 'Grow Room 2',
    light: 0,
    humidity: 58,
    temperature: 21.2,
    lightSetting: 80,
    humiditySetting: 58,
    temperatureSetting: 21,
    irrigation: false,
    lightCycleHours: 12,
    lightOnAt: '06:00:00',
    lightOn: true,
    cycleStartDate: '2026-09-18',
    fertilizerFamily: 'canna-coco',
    growWeek: 6
  },
  {
    id: 3,
    name: 'Grow Room 3',
    light: 75,
    humidity: 70,
    temperature: 26.8,
    lightSetting: 75,
    humiditySetting: 70,
    temperatureSetting: 26,
    irrigation: true,
    lightCycleHours: 18,
    lightOnAt: '06:00:00',
    lightOn: true,
    cycleStartDate: '2026-08-29',
    fertilizerFamily: 'sensi-coco',
    growWeek: 9
  }
];

/** Format a date-ish DB value as 'YYYY-MM-DD'. */
function toDateOnly(value: any): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Map a DB row to the API room shape, including scheduler and grow week output. */
function toRoom(row: any): Room {
  const lightCycleHours = Number(row.light_cycle_hours ?? 12);
  const lightOnAt: string = row.light_on_at ? String(row.light_on_at).slice(0, 8) : '06:00:00';
  const cycleStartDate = toDateOnly(row.cycle_start_date);
  return {
    id: row.id,
    name: row.name,
    light: Number(row.light ?? 0),
    humidity: Number(row.humidity ?? 0),
    temperature: Number(row.temperature ?? 0),
    lightSetting: Number(row.light_setting ?? 0),
    humiditySetting: Number(row.humidity_setting ?? 0),
    temperatureSetting: Number(row.temperature_setting ?? 0),
    irrigation: Boolean(row.irrigation_setting),
    lightCycleHours,
    lightOnAt,
    lightOn: isLightOn(lightCycleHours, lightOnAt),
    cycleStartDate,
    fertilizerFamily: row.fertilizer_family ? String(row.fertilizer_family) : null,
    growWeek: cycleStartDate ? computeGrowWeek(cycleStartDate) : null
  };
}

export class SensorService {
  async getAllRooms(): Promise<Room[]> {
    try {
      const [rows] = await db.query('SELECT * FROM rooms');
      return (rows as any[]).map(toRoom);
    } catch (error) {
      console.log('DB not available, using mock data');
      return mockRooms;
    }
  }

  async getRoomData(roomId: string): Promise<Room> {
    try {
      const [rows] = await db.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
      const rooms = rows as any[];
      if (rooms.length === 0) {
        throw new Error('Room not found');
      }
      return toRoom(rooms[0]);
    } catch (error) {
      if ((error as Error).message === 'Room not found') {
        throw error;
      }
      console.log('DB not available, using mock data');
      const room = mockRooms.find((r) => r.id === parseInt(roomId, 10));
      if (!room) {
        throw new Error('Room not found');
      }
      return room;
    }
  }

  /**
   * Time-series history for a room (GET /api/rooms/:id/history).
   * Reads the sensors table between from/to (inclusive) and pivots the
   * per-type rows into one HistoryPoint per reading timestamp.
   * Throws on DB failure or unknown room; returns [] for an empty range.
   */
  async getRoomHistory(roomId: number, from: Date, to: Date): Promise<HistoryPoint[]> {
    const conn = await db.getConnection();
    try {
      const [roomRows] = await conn.query('SELECT id FROM rooms WHERE id = ?', [roomId]);
      if ((roomRows as any[]).length === 0) {
        throw new Error('Room not found');
      }

      const [rows] = await conn.query(
        'SELECT type, value, created_at FROM sensors WHERE room_id = ? AND created_at >= ? AND created_at <= ? ORDER BY created_at ASC',
        [roomId, from, to]
      );

      const points = new Map<number, HistoryPoint>();
      for (const row of rows as any[]) {
        const ts = new Date(row.created_at).getTime();
        let point = points.get(ts);
        if (!point) {
          point = { timestamp: ts };
          points.set(ts, point);
        }
        const value = Number(row.value);
        switch (row.type) {
          case 'temperature':
            point.temperature = value;
            break;
          case 'humidity':
            point.humidity = value;
            break;
          case 'light':
            point.light = value;
            break;
          case 'irrigation':
            point.irrigation = Boolean(value);
            break;
        }
      }
      return Array.from(points.values());
    } finally {
      conn.release();
    }
  }

  /**
   * Persist an incoming Pi sensor reading:
   * - one row per metric in the sensors table (time series)
   * - latest values on the rooms table (live dashboard state)
   * Runs in a single transaction; throws on DB failure or unknown room.
   */
  async recordSensorData(roomId: number, data: SensorReading): Promise<void> {
    const entries: Array<{ type: string; value: number }> = [];
    if (typeof data.temperature === 'number') entries.push({ type: 'temperature', value: data.temperature });
    if (typeof data.humidity === 'number') entries.push({ type: 'humidity', value: data.humidity });
    if (typeof data.light === 'number') entries.push({ type: 'light', value: data.light });
    if (entries.length === 0) return;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [roomRows] = await conn.query('SELECT id FROM rooms WHERE id = ? FOR UPDATE', [roomId]);
      if ((roomRows as any[]).length === 0) {
        throw new Error('Room not found');
      }

      for (const entry of entries) {
        await conn.query('INSERT INTO sensors (room_id, type, value) VALUES (?, ?, ?)', [
          roomId,
          entry.type,
          entry.value
        ]);
      }

      const updates = entries.map((entry) => `${entry.type} = ?`).join(', ');
      await conn.query(
        `UPDATE rooms SET ${updates} WHERE id = ?`,
        [...entries.map((entry) => entry.value), roomId]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback().catch(() => undefined);
      throw error;
    } finally {
      conn.release();
    }
  }
}
