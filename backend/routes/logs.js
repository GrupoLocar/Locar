// routes/logs.js (ES Module)
import express from 'express';
import Log from '../model/Log.js';

const router = express.Router();

// GET – lista últimos logs
router.get('/', async (_req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    console.error('Erro ao buscar logs:', err);
    res.status(500).json({ message: 'Erro ao buscar logs', error: err.message });
  }
});

// POST – grava novo log
router.post('/', async (req, res) => {
  try {
    const novo = await Log.create(req.body);
    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro ao salvar log:', err);
    res.status(400).json({ message: 'Erro ao salvar log', error: err.message });
  }
});

export default router;
