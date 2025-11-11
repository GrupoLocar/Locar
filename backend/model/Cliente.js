import mongoose from 'mongoose';

const upper = (v) => (typeof v === 'string' ? v.toUpperCase() : v);

// --- Coleção auxiliar para autoincremento ---
const CounterSchema = new mongoose.Schema(
  { _id: { type: String, required: true }, seq: { type: Number, default: 0 } },
  { versionKey: false }
);
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

// Gera próximo código no formato CLI-0000000000
async function gerarProximoCodigoCliente() {
  const ret = await Counter.findByIdAndUpdate(
    { _id: 'cliente' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  const n = String(ret.seq || 1).padStart(10, '0');
  return `CLI-${n}`;
}

const ClienteSchema = new mongoose.Schema({
  // NOVO CAMPO: codigo_cliente
  codigo_cliente: { type: String, required: true, unique: true, index: true, trim: true },

  cliente:       { type: String, required: true, trim: true, maxlength: 80 },
  razao_social:  { type: String, required: true, trim: true, maxlength: 100 },
  cnpj:          { type: String, required: true, index: true, unique: true, trim: true, maxlength: 18 },
  insc_estadual: { type: String, required: false, trim: true, maxlength: 11 },
  responsavel:   { type: String, required: true, trim: true, maxlength: 100 },
  cargo:         { type: String, required: true, trim: true, maxlength: 70 },
  telefone:      { type: String, required: true, trim: true, maxlength: 14 },
  email:         { type: String, required: true, trim: true, maxlength: 100 },
  endereco:      { type: String, required: true, trim: true, maxlength: 100 },
  complemento:   { type: String, required: true, trim: true, maxlength: 70 },
  cidade:        { type: String, required: true, trim: true, maxlength: 70 },
  bairro:        { type: String, required: true, trim: true, maxlength: 70 },
  estado:        { type: String, required: true, trim: true, maxlength: 2, set: upper },
  cep:           { type: String, required: true, trim: true, maxlength: 10 },
  observacao:    { type: String, required: false, trim: true, maxlength: 100 },
}, { timestamps: true });

// Gera o codigo_cliente somente na criação
ClienteSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      if (!this.codigo_cliente) {
        this.codigo_cliente = await gerarProximoCodigoCliente();
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Cliente = mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
export default Cliente;
