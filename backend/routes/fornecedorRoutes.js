// backend/routes/fornecedorRoutes.js
import { Router } from 'express';
import {
  listarFornecedores,
  criarFornecedor,
  atualizarFornecedor,
  obterFornecedor
} from '../controllers/fornecedorController.js';

const router = Router();

router.get('/', listarFornecedores);
router.get('/:id', obterFornecedor);
router.post('/', criarFornecedor);
router.put('/:id', atualizarFornecedor);

export default router;
