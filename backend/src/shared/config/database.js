import mongoose from 'mongoose';
import config from './index.js';


export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri)
    console.log('[MongoDB] connected');
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    throw error;
  }
}
