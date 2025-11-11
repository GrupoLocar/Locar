const mongoose = require('mongoose');
const dayjs = require('dayjs');
require('dotenv').config();

const Funcionario = require('../model/funcionario');
const { enviarEmailAniversario } = require('../utils/emailService');

const enviarParabens = async (diasAdiante = 0) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hoje = dayjs().add(diasAdiante, 'day');
    const dia = hoje.date();
    const mes = hoje.month() + 1; // janeiro = 0

    const funcionarios = await Funcionario.find({
      data_nascimento: { $exists: true }
    });

    const aniversariantes = funcionarios.filter(func => {
      const data = dayjs(func.data_nascimento);
      return data.date() === dia && (data.month() + 1) === mes;
    });

    for (const f of aniversariantes) {
      if (f.email) {
        await enviarEmailAniversario(f.email, f.nome);
        console.log(`🎉 E-mail enviado para ${f.nome} (${f.email})`);
      }
    }

    if (aniversariantes.length === 0) {
      console.log(`Nenhum aniversariante para ${hoje.format('DD/MM')}`);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Erro ao enviar e-mails de aniversário:', err);
    mongoose.connection.close();
  }
};

module.exports = enviarParabens;
