import { Router } from 'express';
import { listar, filtroLivre, criar, atualizar } from '../controllers/clienteController.js';

const router = Router();
router.get('/', listar);
router.get('/filtro', filtroLivre);
router.post('/', criar);
router.put('/:id', atualizar);

export default router;
