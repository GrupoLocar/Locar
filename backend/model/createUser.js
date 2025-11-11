import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../model/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve caminho absoluto do .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hashedPassword = await bcrypt.hash('Financeiro', 12);
  await User.create({ username: 'Financeiro', password: hashedPassword, email: 'financeiro@Financeiro.com', role: 'rh' });
  console.log('Usuário criado: Financeiro / Financeiro');
  mongoose.disconnect();
}).catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
});
