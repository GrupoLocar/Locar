// ESM
import { Router } from 'express';
import { criarPsl, atualizarPsl, listarPsl, obterPsl } from '../controllers/pslController.js';

const router = Router();

router.get('/', listarPsl);
router.get('/:id', obterPsl);
router.post('/', criarPsl);
router.put('/:id', atualizarPsl);

export default router;
