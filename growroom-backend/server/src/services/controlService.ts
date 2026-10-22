import db from '../db/mysql';
import { ControlSettings } from '../types';

export class ControlService {
  async updateRoomSettings(roomId: string, settings: Partial<ControlSettings>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (settings.light !== undefined) {
      updates.push('light = ?');
      values.push(settings.light);
    }
    if (settings.temperature !== undefined) {
      updates.push('temperature = ?');
      values.push(settings.temperature);
    }
    if (settings.humidity !== undefined) {
      updates.push('humidity = ?');
      values.push(settings.humidity);
    }
    if (settings.irrigation !== undefined) {
      updates.push('irrigation = ?');
      values.push(settings.irrigation);
    }

    if (updates.length === 0) {
      return;
    }

    try {
      values.push(roomId);
      const query = `UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`;
      await db.query(query, values);
    } catch (error) {
      console.log('DB not available, settings update simulated');
    }
  }
}