const bcrypt = require('bcrypt');

const hash = '$2b$10$ggCFOjVG4wnJfs4e/FWS0eP6eUx.DeRY9GYSqQN1umvYwfHsegQdS'; // hash do admin
const senhaDigitada = 'admin'; // senha em texto plano que você vai testar

bcrypt.compare(senhaDigitada, hash)
  .then(result => {
    console.log('Senha bate?', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro no bcrypt:', err);
    process.exit(1);
  });
