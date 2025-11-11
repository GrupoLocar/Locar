import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, unique: true },
    submenus: [String]
  },
  { timestamps: true }
);

const Module = mongoose.model('Module', moduleSchema);
export default Module;
