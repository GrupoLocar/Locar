// backend/model/Filial.js
import mongoose from 'mongoose';

const FilialSchema = new mongoose.Schema({
  cliente: { type: String, required: true, trim: true, maxlength: 100 },
  filial: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
  distrital: { type: String, required: true, trim: true, maxlength: 70 },
  razao_social: { type: String, required: true, trim: true, maxlength: 100 },
  cnpj: { type: String, required: true, trim: true, maxlength: 18, unique: true },
  insc_estadual: { type: String, trim: true, maxlength: 11 },
  responsavel: { type: String, required: true, trim: true, maxlength: 100 },
  cargo: { type: String, required: true, trim: true, maxlength: 70 },
  telefone: { type: String, required: true, trim: true, maxlength: 14 },
  email: { type: String, required: true, trim: true, maxlength: 100 },
  endereco: { type: String, required: true, trim: true, maxlength: 100 },
  complemento: { type: String, required: true, trim: true, maxlength: 70 },
  cidade: { type: String, required: true, trim: true, maxlength: 70 },
  bairro: { type: String, required: true, trim: true, maxlength: 70 },
  estado: { type: String, required: true, trim: true, uppercase: true, maxlength: 2 },
  cep: { type: String, required: true, trim: true, maxlength: 10 },
  observacao: { type: String, trim: true, maxlength: 100 },
}, {
  timestamps: true,
  collection: 'filiais'
});

// Índice único para CNPJ (se ainda não existir)
FilialSchema.index({ cnpj: 1 }, { unique: true });

const Filial = mongoose.models.Filial || mongoose.model('Filial', FilialSchema);
export default Filial;
