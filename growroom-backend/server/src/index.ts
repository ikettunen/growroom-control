import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import roomsRoutes from './routes/rooms';
import fertilizerRoutes from './routes/fertilizer';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api/rooms', roomsRoutes);
app.use('/api/fertilizer', fertilizerRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
