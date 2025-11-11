import mongoose from 'mongoose';

const perfilIdealSchema = new mongoose.Schema({
  idade_min: Number,
  idade_max: Number,
  tempo_habilitacao_min: Number,
  estado_civil: String,
  filhos_min: Number
}, { collection: 'perfil_ideal', timestamps: true });

export default mongoose.model('PerfilIdeal', perfilIdealSchema);
