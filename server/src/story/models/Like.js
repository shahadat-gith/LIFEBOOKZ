import mongoose from 'mongoose';


const likeSchema = new mongoose.Schema({
  story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
  toJSON: { transform(_doc, ret) { delete ret.__v; ret.id = ret._id; return ret; } },
});

likeSchema.index({ story: 1, user: 1 }, { unique: true });

const Like = mongoose.model('likes', likeSchema);
export default Like;
