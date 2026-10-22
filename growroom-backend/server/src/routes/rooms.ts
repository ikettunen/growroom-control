import { Router } from 'express';
import { RoomsController } from '../controllers/roomsController';

const router = Router();
const roomsController = new RoomsController();

router.get('/', roomsController.getRooms.bind(roomsController));
router.get('/:id', roomsController.getRoomData.bind(roomsController));
router.put('/:id', roomsController.updateRoomSettings.bind(roomsController));

export default router;