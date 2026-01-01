import mongoose from 'mongoose';
import { MONGODB_URL } from './configs/index.js';

mongoose.set('strictQuery', true);

const connectToMongo = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connection successfully with DB...');
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
  }
};

export default connectToMongo;
