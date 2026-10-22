import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import roomsRoutes from './routes/rooms';
import authRoutes from './routes/auth';
import { authenticate } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', authenticate, roomsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});