import { Request, Response } from 'express';
import { FertilizerService } from '../services/fertilizerService';

const MAX_BUCKET_LITERS = 1000;

export class FertilizerController {
    private fertilizerService: FertilizerService;

    constructor() {
        this.fertilizerService = new FertilizerService();
    }

    /** GET /api/fertilizer — list available fertilizer families */
    public async getFamilies(req: Request, res: Response): Promise<void> {
        try {
            const families = this.fertilizerService.getFamilies();
            res.status(200).json(families);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving fertilizer families', error });
        }
    }

    /**
     * GET /api/fertilizer/schedule?family=<id>&bucketSize=<liters>[&week=<n>]
     * Returns product dosages scaled to the bucket size, for one week
     * (if week is given) or the full week-by-week schedule.
     */
    public async getSchedule(req: Request, res: Response): Promise<void> {
        const familyId = String(req.query.family ?? '');
        if (!familyId) {
            res.status(400).json({ message: 'Missing family parameter (see GET /api/fertilizer for available families)' });
            return;
        }
        if (!this.fertilizerService.getFamily(familyId)) {
            res.status(404).json({ message: 'Unknown fertilizer family: ' + familyId });
            return;
        }

        const bucketSize = Number(req.query.bucketSize);
        if (req.query.bucketSize === undefined || isNaN(bucketSize) || bucketSize <= 0 || bucketSize > MAX_BUCKET_LITERS) {
            res.status(400).json({ message: 'Invalid bucketSize: expected liters as a positive number (max ' + MAX_BUCKET_LITERS + ')' });
            return;
        }

        let week: number | undefined;
        if (req.query.week !== undefined) {
            const parsed = parseInt(String(req.query.week), 10);
            const family = this.fertilizerService.getFamily(familyId)!;
            if (isNaN(parsed) || parsed < 1 || parsed > family.weeks.length) {
                res.status(400).json({
                    message: 'Invalid week: expected 1-' + family.weeks.length + ' for family ' + familyId
                });
                return;
            }
            week = parsed;
        }

        try {
            const calculation = this.fertilizerService.calculate(familyId, bucketSize, week);
            res.status(200).json(calculation);
        } catch (error) {
            res.status(500).json({ message: 'Error calculating fertilizer schedule', error });
        }
    }
}
