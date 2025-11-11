import express from 'express';
import syncFuncionarios from '../scripts/syncFuncionarios.js';

const router = express.Router();

router.post('/sincronizar-funcionarios', async (req, res) => {
  console.log('🛠 ROTA DE SINCRONIZAÇÃO FOI ACIONADA');
  try {
    console.log('➡ Chamando syncFuncionarios...');
    await syncFuncionarios();
    console.log('✅ syncFuncionarios executada');
    res.status(200).json({ message: 'Sincronização finalizada com sucesso.' });
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Erro na sincronização.', detalhe: error.message });
  }
});

export default router;
