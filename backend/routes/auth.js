import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔐 Tentando login com usuário:', username);

    if (!username || !password) {
      console.log('⚠️ Username ou senha ausentes');
      return res.status(400).json({ message: 'Username e senha são obrigatórios' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      console.log('❌ Usuário não encontrado:', username);
      return res.status(401).json({ message: 'Usuário ou senha inválidos' });
    }

    // Logs de comparação manual com bcrypt
    // console.log('🟡 Password digitada:', password);
    // console.log('🟡 Password no banco:', user.password);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    // console.log('🟢 Resultado do compare direto com bcrypt:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Senha incorreta para usuário:', username);
      return res.status(401).json({ message: 'Usuário ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'segredo',
      { expiresIn: '1d' }
    );

    console.log('✅ Login bem-sucedido para usuário:', username);

    res.json({
      token,
      usuario: {
        _id: user._id,
        username: user.username,
        nome: user.nome,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('🔥 Erro no login:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

export default router;

