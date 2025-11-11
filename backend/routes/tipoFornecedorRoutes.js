// backend/routes/tipoFornecedorRoutes.js
import { Router } from 'express';
import {
  listarTipos,
  criarTipo,
  atualizarTipo
} from '../controllers/tipoFornecedorController.js';

const router = Router();

router.get('/', listarTipos);
router.post('/', criarTipo);
router.put('/:id', atualizarTipo);

export default router;
