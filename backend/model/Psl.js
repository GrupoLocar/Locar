// ESM
import mongoose from 'mongoose';

const PslSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true, index: true },
    filial: { type: String, required: true, trim: true },
    distrital: { type: String, required: true, trim: true },
    ocorrencia_psl: { type: String, required: true, trim: true },
    observacao: { type: String, default: '', trim: true },
  },
  { timestamps: true, collection: 'psl' }
);

export default mongoose.model('Psl', PslSchema);
