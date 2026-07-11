import mongoose from 'mongoose';
import { storiesConn } from '../config/database.js';

const logSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'warn', 'error', 'debug'], default: 'info' },
  message: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  service: { type: String, default: 'lifebookz-api' },
  timestamp: { type: Date, default: Date.now },
});

logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });

const Log = storiesConn.model('Log', logSchema);

export default async function log(level, message, meta = {}) {
  try {
    await Log.create({ level, message, meta });
  } catch {
    const prefix = `[${level.toUpperCase()}]`;
    if (level === 'error') console.error(prefix, message, meta);
    else if (level === 'warn') console.warn(prefix, message, meta);
    else console.log(prefix, message, meta);
  }
}

export { Log };
