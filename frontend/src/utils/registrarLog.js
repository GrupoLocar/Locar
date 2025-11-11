import axios from 'axios';

const registrarLog = async (acao, usuario = 'Desconhecido') => {
  try {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/logs`, {
      usuario,
      acao,
      dataHora: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

export default registrarLog;
