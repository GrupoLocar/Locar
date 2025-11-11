import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      default: 'usuario',
      enum: ['admin', 'rh', 'usuario', 'Departamento Pessoal', 'Comercial', 'Financeiro', 'Controladoria'],
    },
    permittedModules: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ✅ Hash da senha antes de salvar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Compara a senha digitada com a senha salva
userSchema.methods.comparePassword = async function (passwordDigitada) {
  if (!this.password || !this.password.startsWith('$2b$')) {
    throw new Error('Senha armazenada não está no formato bcrypt');
  }
  return bcrypt.compare(passwordDigitada, this.password);
};

// ✅ Exporta o modelo como ES Module
const User = mongoose.model('User', userSchema);
export default User;

