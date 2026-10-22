import db from '../db/mysql';
import { Room } from '../types';

// Mock data for development
const mockRooms: Room[] = [
  {
    id: 1,
    name: 'Grow Room 1',
    light: 100,
    humidity: 65,
    temperature: 24.5,
    irrigation: false
  },
  {
    id: 2,
    name: 'Grow Room 2',
    light: 0,
    humidity: 58,
    temperature: 21.2,
    irrigation: false
  },
  {
    id: 3,
    name: 'Grow Room 3',
    light: 75,
    humidity: 70,
    temperature: 26.8,
    irrigation: true
  }
];

export class SensorService {
  async getAllRooms(): Promise<Room[]> {
    try {
      const [rows] = await db.query('SELECT * FROM rooms');
      return rows as Room[];
    } catch (error) {
      console.log('DB not available, using mock data');
      return mockRooms;
    }
  }

  async getRoomData(roomId: string): Promise<Room> {
    try {
      const [rows] = await db.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
      const rooms = rows as Room[];
      if (rooms.length === 0) {
        throw new Error('Room not found');
      }
      return rooms[0];
    } catch (error) {
      console.log('DB not available, using mock data');
      const room = mockRooms.find(r => r.id === parseInt(roomId));
      if (!room) {
        throw new Error('Room not found');
      }
      return room;
    }
  }
}