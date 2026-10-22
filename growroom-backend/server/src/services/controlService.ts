import db from '../db/mysql';
import { ControlSettings } from '../types';

export class ControlService {
  /**
   * Update control setpoints for a room. Settings are stored in dedicated
   * *_setting columns on the rooms table, separate from the live sensor values,
   * so incoming readings never overwrite the setpoints.
   */
  async updateRoomSettings(roomId: string, settings: Partial<ControlSettings>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (settings.light !== undefined) {
      updates.push('light_setting = ?');
      values.push(settings.light);
    }
    if (settings.temperature !== undefined) {
      updates.push('temperature_setting = ?');
      values.push(settings.temperature);
    }
    if (settings.humidity !== undefined) {
      updates.push('humidity_setting = ?');
      values.push(settings.humidity);
    }
    if (settings.irrigation !== undefined) {
      updates.push('irrigation_setting = ?');
      values.push(settings.irrigation ? 1 : 0);
    }
    if (settings.lightCycleHours !== undefined) {
      updates.push('light_cycle_hours = ?');
      values.push(settings.lightCycleHours);
    }
    if (settings.lightOnAt !== undefined) {
      updates.push('light_on_at = ?');
      values.push(settings.lightOnAt);
    }
    if (settings.cycleStartDate !== undefined) {
      updates.push('cycle_start_date = ?');
      values.push(settings.cycleStartDate);
    }
    if (settings.fertilizerFamily !== undefined) {
      updates.push('fertilizer_family = ?');
      values.push(settings.fertilizerFamily);
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
