// backend/model/fornecedor.js
import mongoose from 'mongoose';

const FornecedorSchema = new mongoose.Schema({
  codigo_fornecedor: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^FORN-\d{10}$/ // ex.: FORN-0000000001
  },

  // renomeado de 'fornecedor' para 'tipoFornecedor'
  tipoFornecedor: { type: String, required: true, trim: true },

  razao_social:  { type: String, required: true, trim: true },
  cnpj:          { type: String, required: true, unique: true, trim: true },
  insc_estadual: { type: String, trim: true },
  responsavel:   { type: String, required: true, trim: true },
  cargo:         { type: String, required: true, trim: true },
  telefone:      { type: String, required: true, trim: true },
  email:         { type: String, required: true, trim: true, lowercase: true },
  endereco:      { type: String, required: true, trim: true },
  complemento:   { type: String, trim: true },
  cidade:        { type: String, required: true, trim: true },
  bairro:        { type: String, required: true, trim: true },
  estado:        { type: String, required: true, trim: true, uppercase: true, minlength: 2, maxlength: 2 },
  cep:           { type: String, required: true, trim: true },
  banco:   { type: String, trim: true, maxlength: 60 },
  agencia: { type: String, trim: true, maxlength: 10 },
  conta:   { type: String, trim: true, maxlength: 25 },
  pix:     { type: String, trim: true, maxlength: 35 },

  observacao:    { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model('Fornecedor', FornecedorSchema);
