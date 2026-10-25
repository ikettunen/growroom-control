import { Request, Response } from 'express';
import { SensorService } from '../services/sensorService';
import { ControlService } from '../services/controlService';
import { FertilizerService } from '../services/fertilizerService';
import { SensorReading } from '../types';

const DEFAULT_HISTORY_HOURS = 24;
const DEFAULT_BUCKET_LITERS = 10;
const MAX_BUCKET_LITERS = 1000;

export class RoomsController {
    private sensorService: SensorService;
    private controlService: ControlService;
    private fertilizerService: FertilizerService;

    constructor() {
        this.sensorService = new SensorService();
        this.controlService = new ControlService();
        this.fertilizerService = new FertilizerService();
    }

    public async getRooms(req: Request, res: Response): Promise<void> {
        try {
            const rooms = await this.sensorService.getAllRooms();
            res.status(200).json(rooms);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving rooms', error });
        }
    }

    public async getRoomData(req: Request, res: Response): Promise<void> {
        const roomId = req.params.id;
        try {
            const roomData = await this.sensorService.getRoomData(roomId);
            res.status(200).json(roomData);
        } catch (error) {
            if ((error as Error).message === 'Room not found') {
                res.status(404).json({ message: 'Room not found' });
                return;
            }
            res.status(500).json({ message: 'Error retrieving room data', error });
        }
    }

    /**
     * GET /api/rooms/:id/history?from=&to=
     * Sensor readings time series for one room, pivoted per timestamp.
     * from/to accept ISO 8601 strings (default: last 24 h).
     */
    public async getRoomHistory(req: Request, res: Response): Promise<void> {
        const roomId = parseInt(req.params.id, 10);
        if (isNaN(roomId) || roomId <= 0) {
            res.status(400).json({ message: 'Invalid room id' });
            return;
        }

        const to = req.query.to ? new Date(String(req.query.to)) : new Date();
        const from = req.query.from
            ? new Date(String(req.query.from))
            : new Date(to.getTime() - DEFAULT_HISTORY_HOURS * 60 * 60 * 1000);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            res.status(400).json({ message: 'Invalid from/to: expected ISO 8601 dates' });
            return;
        }
        if (from >= to) {
            res.status(400).json({ message: 'from must be before to' });
            return;
        }

        try {
            const history = await this.sensorService.getRoomHistory(roomId, from, to);
            res.status(200).json(history);
        } catch (error) {
            if ((error as Error).message === 'Room not found') {
                res.status(404).json({ message: 'Room not found' });
                return;
            }
            console.error('Failed to retrieve room history:', error);
            res.status(503).json({ message: 'Storage unavailable, history not retrievable' });
        }
    }

    /**
     * GET /api/rooms/:id/fertilizer?bucketSize=<L>[&week=<n>][&family=<id>]
     * Fertilizer schedule for a room's current grow week (from cycle_start_date),
     * scaled to the bucket size. Optional overrides: week and family.
     */
    public async getRoomFertilizer(req: Request, res: Response): Promise<void> {
        const roomId = req.params.id;

        let bucketSize = DEFAULT_BUCKET_LITERS;
        if (req.query.bucketSize !== undefined) {
            const parsed = Number(req.query.bucketSize);
            if (isNaN(parsed) || parsed <= 0 || parsed > MAX_BUCKET_LITERS) {
                res.status(400).json({ message: 'Invalid bucketSize: expected liters as a positive number (max ' + MAX_BUCKET_LITERS + ')' });
                return;
            }
            bucketSize = parsed;
        }

        try {
            const room = await this.sensorService.getRoomData(roomId);

            const familyId = String(req.query.family ?? room.fertilizerFamily ?? '');
            if (!familyId) {
                res.status(400).json({ message: 'Room has no fertilizer family; set fertilizerFamily via PUT /api/rooms/' + roomId + ' or pass ?family=' });
                return;
            }
            const family = this.fertilizerService.getFamily(familyId);
            if (!family) {
                res.status(404).json({ message: 'Unknown fertilizer family: ' + familyId });
                return;
            }

            let week = room.growWeek;
            if (req.query.week !== undefined) {
                const parsed = parseInt(String(req.query.week), 10);
                if (isNaN(parsed) || parsed < 1) {
                    res.status(400).json({ message: 'Invalid week' });
                    return;
                }
                week = parsed;
            }
            if (week === null || week === undefined) {
                res.status(400).json({ message: 'Room has no cycle start date; set cycleStartDate via PUT /api/rooms/' + roomId + ' or pass ?week=' });
                return;
            }
            if (week > family.weeks.length) {
                res.status(400).json({
                    message: 'Room is in week ' + week + ' but family ' + familyId + ' only covers weeks 1-' + family.weeks.length + ' (pass ?week= to override)'
                });
                return;
            }

            const schedule = this.fertilizerService.calculate(familyId, bucketSize, week);
            res.status(200).json({
                room: {
                    id: room.id,
                    name: room.name,
                    cycleStartDate: room.cycleStartDate,
                    growWeek: room.growWeek,
                    fertilizerFamily: familyId,
                    totalWeeks: family.weeks.length
                },
                schedule
            });
        } catch (error) {
            if ((error as Error).message === 'Room not found') {
                res.status(404).json({ message: 'Room not found' });
                return;
            }
            console.error('Failed to calculate room fertilizer schedule:', error);
            res.status(500).json({ message: 'Error calculating fertilizer schedule', error });
        }
    }

    /**
     * POST /api/rooms/:id/sensors
     * Receives sensor readings from a room's Raspberry Pi and persists them.
     * Body: { temperature?: number, humidity?: number, light?: number }
     */
    public async receiveSensorData(req: Request, res: Response): Promise<void> {
        const roomId = parseInt(req.params.id, 10);
        if (isNaN(roomId) || roomId <= 0) {
            res.status(400).json({ message: 'Invalid room id' });
            return;
        }

        const body = req.body ?? {};
        const data: SensorReading = {};
        for (const key of ['temperature', 'humidity', 'light'] as const) {
            const raw = body[key];
            if (raw !== undefined && raw !== null && raw !== '') {
                const value = Number(raw);
                if (isNaN(value)) {
                    res.status(400).json({ message: 'Invalid value for ' + key + ': must be a number' });
                    return;
                }
                data[key] = value;
            }
        }

        if (data.temperature === undefined && data.humidity === undefined && data.light === undefined) {
            res.status(400).json({ message: 'No valid sensor values provided (expected temperature, humidity and/or light)' });
            return;
        }

        try {
            await this.sensorService.recordSensorData(roomId, data);
            res.status(201).json({ message: 'Sensor data recorded' });
        } catch (error) {
            if ((error as Error).message === 'Room not found') {
                res.status(404).json({ message: 'Room not found' });
                return;
            }
            console.error('Failed to record sensor data:', error);
            res.status(503).json({ message: 'Storage unavailable, sensor data not recorded' });
        }
    }

    public async updateRoomSettings(req: Request, res: Response): Promise<void> {
        const roomId = req.params.id;
        const settings = req.body;
        try {
            await this.controlService.updateRoomSettings(roomId, settings);
            res.status(200).json({ message: 'Room settings updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating room settings', error });
        }
    }
}
