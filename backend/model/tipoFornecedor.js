// backend/model/tipoFornecedor.js
import mongoose from 'mongoose';

const TipoFornecedorSchema = new mongoose.Schema(
  {
    categoria: { type: String, required: true, trim: true },
    tipoFornecedor: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('TipoFornecedor', TipoFornecedorSchema);

