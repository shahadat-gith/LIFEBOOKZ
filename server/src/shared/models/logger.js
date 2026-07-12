import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'warn', 'error', 'debug'], default: 'info' },
  message: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  service: { type: String, default: 'lifebookz-api' },
  timestamp: { type: Date, default: Date.now },
});

logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });

const Log = mongoose.model("logs", logSchema)

export default Log;