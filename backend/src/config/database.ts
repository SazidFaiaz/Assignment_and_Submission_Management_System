import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/assignment-management';
    
    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export function disconnectDB(): Promise<void> {
  return mongoose.disconnect();
}
