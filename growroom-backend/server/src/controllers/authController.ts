import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/mysql';
import { generateToken } from '../middleware/auth';

// Mock user for when DB is unavailable (matches seed data password)
const mockUser = {
    id: 1,
    email: 'admin@growroom.local',
    password_hash: '$2b$10$VDH7C9oGlopZiC8uKwIKyu5Q5be9OLL/CNM1qOVA5vK/BAicZG6Je',
    name: 'Admin',
    role: 'admin' as const,
};

export class AuthController {
    public async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        let user: typeof mockUser | null = null;

        try {
            const [rows] = await db.query(
                'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
                [email]
            );
            const users = rows as typeof mockUser[];
            user = users[0] ?? null;
        } catch {
            // DB unavailable — fall back to mock user in dev
            if (email === mockUser.email) {
                user = mockUser;
            }
        }

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const token = generateToken({ userId: user.id, email: user.email, role: user.role });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }

    public async me(req: Request, res: Response): Promise<void> {
        const payload = (req as any).user;
        try {
            const [rows] = await db.query(
                'SELECT id, email, name, role FROM users WHERE id = ?',
                [payload.userId]
            );
            const users = rows as any[];
            res.json(users[0] ?? payload);
        } catch {
            res.json({ id: payload.userId, email: payload.email, role: payload.role });
        }
    }
}
