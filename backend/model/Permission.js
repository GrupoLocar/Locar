import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }]
  },
  { timestamps: true }
);

const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;
