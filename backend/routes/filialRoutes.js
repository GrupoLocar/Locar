// backend/routes/filialRoutes.js
import { Router } from 'express';
import { listar, criar, atualizar } from '../controllers/filialController.js';

const router = Router();

router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);

export default router;
