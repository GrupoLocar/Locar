import express from 'express';
import path from 'path';
import fs from 'fs';
import uploadDropbox from '../middlewares/uploadDropbox.js';
import {
  getPorSituacao,
  getFuncionarios,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
  filtroGenerico,
  getStatusCNHEstatistica,
  getFuncionariosPorStatusCNH,
  normalizarBodyMiddleware,
  criarFuncionarioComAnexos,
  buscarCep
} from '../controllers/funcionarioController.js';
import * as funcionarioController from '../controllers/funcionarioController.js';
import { setPerfilIdealFuncionarios } from '../controllers/funcionarioController.js';
import { getConfiguracaoPerfilIdeal } from '../controllers/funcionarioController.js';

const router = express.Router();

// Garantir que a pasta de uploads existe
const ANEXOS_DIR = path.join('C:', 'Users', 'contr', 'Dropbox', 'uploads');
fs.mkdirSync(ANEXOS_DIR, { recursive: true });

/* ----------------------------------------------------------
   Middleware opcional de datas — pode ser expandido depois
----------------------------------------------------------- */
const normalizarDatas = (req, res, next) => {
  next();
};

/* ----------------------------------------------------------
   Rotas com upload de anexos
----------------------------------------------------------- */

// Criar funcionário com anexos
router.post(
  '/com-anexos',
  uploadDropbox,
  normalizarBodyMiddleware,
  criarFuncionarioComAnexos
);

// Atualizar funcionário com anexos
router.put(
  '/com-anexos/:id',
  uploadDropbox,
  normalizarBodyMiddleware,
  updateFuncionario
);

// Upload local simples (arquivo único)
router.post('/upload', (req, res) => {
  return res.status(501).json({ erro: 'Não implementado nesta versão.' });
});

/* ----------------------------------------------------------
   Serviço de CEP (DEVE vir antes de rotas com :id)
----------------------------------------------------------- */
router.get('/cep/:cep', buscarCep);
router.get('/cep', buscarCep); // aceita ?cep=XXXXXXXX

/* ----------------------------------------------------------
   Demais rotas da API de funcionários
----------------------------------------------------------- */

// Listar todos
router.get('/', getFuncionarios);

// Criar funcionário (sem anexos)
router.post('/', normalizarBodyMiddleware, createFuncionario);

// Atualizar funcionário (sem anexos)
router.put('/:id', normalizarBodyMiddleware, updateFuncionario);

// Excluir funcionário
router.delete('/:id', deleteFuncionario);

// Filtro genérico
router.get('/filtro', filtroGenerico);

// Dashboard
router.get('/estatisticas', funcionarioController.getEstatisticasFuncionarios);

// Perfil Ideal
router.get('/perfil-ideal-config', getConfiguracaoPerfilIdeal);

// Quadro de Definição do Perfil Ideal de Contratação
router.post('/perfil-ideal', setPerfilIdealFuncionarios);

// Busca do Perfil Ideal de Contratação definido no Quadro
router.get('/perfil-ideal', funcionarioController.getPerfilIdealFuncionarios);

// Estatísticas de status CNH
router.get('/estatisticas-cnh', getStatusCNHEstatistica);

// Filtrar por status CNH (ex: Prazo, Vencido)
router.get('/funcionarios-status/:status', getFuncionariosPorStatusCNH);

// Compatível com query ?situacao=...
router.get('/situacao', getPorSituacao);

export default router;
