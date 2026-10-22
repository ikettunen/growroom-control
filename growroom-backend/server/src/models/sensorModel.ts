import { Schema, model } from 'mongoose';

const sensorSchema = new Schema({
  roomId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Room',
  },
  temperature: {
    type: Number,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  },
  light: {
    type: Number,
    required: true,
  },
  irrigation: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Sensor = model('Sensor', sensorSchema);

export default Sensor;