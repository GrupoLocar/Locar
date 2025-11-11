import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    acao:     { type: String, required: true },
    timestamp:{ type: Date,   default: Date.now }
  },
  { timestamps: false }       // já temos o campo timestamp manual
);

const Log = mongoose.model('Log', logSchema);
export default Log;
