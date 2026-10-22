import { Request, Response } from 'express';
import { SensorService } from '../services/sensorService';
import { ControlService } from '../services/controlService';

export class RoomsController {
    private sensorService: SensorService;
    private controlService: ControlService;

    constructor() {
        this.sensorService = new SensorService();
        this.controlService = new ControlService();
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
            res.status(500).json({ message: 'Error retrieving room data', error });
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