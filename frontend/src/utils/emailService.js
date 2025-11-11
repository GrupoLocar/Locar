const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.locaweb.com.br',
  port: 587,
  secure: false, // false para STARTTLS (porta 587)
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const enviarEmailAniversario = async (destinatario, nome) => {
  const mensagem = `
  🎉 Parabéns pelo seu aniversário! 🎂

  Hoje é um dia especial e queremos aproveitar este momento para lhe desejar muitas felicidades, saúde, conquistas e alegrias em sua vida!

  Que seu novo ciclo seja repleto de realizações e que você continue sendo essa pessoa tão importante para todos nós.

  Aproveite seu dia ao máximo! 🎈

  Feliz Aniversário!

  Atenciosamente,
  Grupo Locar
  `;

  await transporter.sendMail({
    from: `"Grupo Locar" <${process.env.EMAIL_SENDER}>`,
    to: destinatario,
    subject: `🎂 Feliz Aniversário, ${nome}!`,
    text: mensagem
  });
};

module.exports = { enviarEmailAniversario };
