import { Router } from 'express';
import { FertilizerController } from '../controllers/fertilizerController';

const router = Router();
const fertilizerController = new FertilizerController();

router.get('/', fertilizerController.getFamilies.bind(fertilizerController));
router.get('/schedule', fertilizerController.getSchedule.bind(fertilizerController));

export default router;
