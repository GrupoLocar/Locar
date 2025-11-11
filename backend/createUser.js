const mongoose = require('mongoose');
const User = require('./model/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Conectado ao MongoDB');

  const usuarioExistente = await User.findOne({ username: 'rh' });
  if (usuarioExistente) {
    console.log('Usuário rh já existe.');
    process.exit(0);
  }

  const novoUsuario = new User({
    username: 'rh',
    password: 'rh', // texto puro - bcrypt será aplicado no save
    email: 'rh@localhost',
    role: 'rh',
    permittedModules: ['todos']
  });

  await novoUsuario.save();
  console.log('Usuário rh criado com sucesso!');
  process.exit(0);
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});
