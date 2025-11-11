import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  updateUserPassword
} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/senha', updateUserPassword);

console.log('[userRoutes] Carregado');

export default router;
