import mongoose from 'mongoose';

const funcionarioSchema = new mongoose.Schema(
  {
    nome: String,
    sexo: String,
    profissao: String,
    situacao: String,
    contrato: String,
    pj: { type: Boolean, default: false },
    telefone: String,
    data_admissao: Date,
    data_demissao: Date,
    data_nascimento: Date,
    email: String,
    endereco: String,
    complemento: String,
    bairro: String,
    municipio: String,
    estado: String,
    cep: String,
    banco: String,
    agencia: String,
    conta: String,
    pix: String,
    cpf: { type: String, unique: true },
    rg: String,
    estado_civil: String,
    filhos: Number,
    cnh: String,
    categoria: String,
    emissao_cnh: Date,
    validade_cnh: Date,
    statusCNH: String,
    nome_familiar: String,
    contato_familiar: String,
    indicado: String,
    observacao: String,
    dataUltimoServicoPrestado: { type: Date, default: () => new Date('1900-01-01') },
    arquivos: {
      type: Object,
      default: {
        cnh_arquivo: [],
        comprovante_residencia: [],
        nada_consta: [],
        comprovante_mei: [],
        curriculo: []
      }
    },
    data_envio_utc: Date,
    data_envio_local: Date
  },
  {
    timestamps: true
  }
);

funcionarioSchema.virtual('idade').get(function () {
  if (!this.data_nascimento) return null;
  const today = new Date();
  const birthDate = new Date(this.data_nascimento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

funcionarioSchema.virtual('diasVencimentoCNH').get(function () {
  if (!this.validade_cnh) return null;
  const today = new Date();
  const validade = new Date(this.validade_cnh);
  const diffTime = validade - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

funcionarioSchema.set('toJSON', { virtuals: true });
funcionarioSchema.set('toObject', { virtuals: true });

const Funcionario = mongoose.model('Funcionario', funcionarioSchema);

export default Funcionario;
