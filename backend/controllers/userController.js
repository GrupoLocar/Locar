import User from '../model/User.js';
import bcrypt from 'bcrypt';

// GET /api/usuarios - listar todos os usuários (sem senha)
export const getAllUsers = async (_, res) => {
  try {
    const usuarios = await User.find().select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
};

// POST /api/usuarios - criar novo usuário
export const createUser = async (req, res) => {
  try {
    const { username, password, nome, email, role, permittedModules } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const novoUsuario = new User({
      username,
      password: hashedPassword,
      nome,
      email,
      role,
      permittedModules,
    });
    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar usuário', message: err.message });
  }
};

// PUT /api/usuarios/:id - atualizar dados do usuário (sem alterar senha)
export const updateUser = async (req, res) => {
  try {
    const { username, email, role, permittedModules } = req.body;
    const usuarioAtualizado = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role, permittedModules },
      { new: true }
    );
    res.json(usuarioAtualizado);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao atualizar usuário', message: err.message });
  }
};

// PUT /api/usuarios/:id/senha - atualizar senha
export const updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashed });
    res.json({ message: 'Senha atualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar senha', message: err.message });
  }
};
