// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process'; // para executar script Python

// Importação das rotas existentes
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/auth.js';
import logRoutes from './routes/logs.js';
import funcionarioRoutes from './routes/funcionarioRoutes.js';
import syncRouter from './routes/sync.js';
import uploadDropbox from './middlewares/uploadDropbox.js';
import clienteRoutes from './routes/clienteRoutes.js';
import fornecedorRoutes from './routes/fornecedorRoutes.js';
import filialRoutes from './routes/filialRoutes.js';
import pslRoutes from './routes/pslRoutes.js';
import tipoFornecedorRoutes from './routes/tipoFornecedorRoutes.js';

// ✅ Handlers diretos para fallback das rotas de Filial (mesmo controller do subrouter)
import {
  listar as listarFiliais,
  criar as criarFilial,
  atualizar as atualizarFilial,
} from './controllers/filialController.js';

// Importação do modelo para estatísticas
import Funcionario from './model/funcionario.js';

dotenv.config();

// __dirname compatível com ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

/* ========= Instrumentação leve para depurar rotas =========
   - Guarda prefixos montados via app.use()
   - Expõe /__routes para listar tudo que está montado */
const __mountedPrefixes = [];
const __origUse = app.use.bind(app);
app.use = (...args) => {
  if (typeof args[0] === 'string') __mountedPrefixes.push(args[0]);
  return __origUse(...args);
};
const getPathFromRegexp = (regexp) => {
  try {
    const src = String(regexp);
    // Express: /^\/api\/filiais\/?(?=\/|$)/i
    const m = src.match(/^\/\^\\\/(.+?)\\\/\?\(\?=\\\/\|\$\)\/[im]*$/);
    if (m && m[1]) return '/' + m[1].replace(/\\\//g, '/');
  } catch {}
  return '';
};
const collectRoutes = () => {
  const endpoints = [];
  const root = app._router;
  if (!root?.stack) return { prefixes: [...new Set(__mountedPrefixes)], endpoints };

  const walk = (prefix, layer) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).map(x => x.toUpperCase()).join(',');
      endpoints.push(`${methods} ${prefix}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle?.stack) {
      const subPrefix = layer.regexp ? getPathFromRegexp(layer.regexp) : '';
      layer.handle.stack.forEach(h => walk(`${prefix}${subPrefix}`, h));
    }
  };
  root.stack.forEach(l => walk('', l));
  return { prefixes: [...new Set(__mountedPrefixes)], endpoints };
};
// endpoint opcional para consultar rotas
app.get('/__routes', (req, res) => res.json(collectRoutes()));
/* ==================================================================== */

// Diretório para acesso público dos uploads
const UPLOADS_DIR = 'C:/Users/contr/Dropbox/uploads';
app.use('/uploads', express.static(UPLOADS_DIR));

// Middlewares globais
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI, {
  // Avisos do driver (mantidos)
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB conectado');

  // Executar script Python ao iniciar o servidor
  const scriptPath = path.resolve(__dirname, 'scripts', 'sync_atlas_to_local.py');
  console.log(`Executando script de sincronização da base de dados: ${scriptPath}`);
  exec(
    `python -X utf8 "${scriptPath}"`,
    {
      cwd: path.dirname(scriptPath),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro ao executar script Python na inicialização:', error.message);
        console.error('stderr:', stderr);
        return;
      }
      console.log('✅ Script de sincronização executado com sucesso na inicialização');
      console.log('stdout:', stdout);
    }
  );
})
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// ----------------------------------------------------------------
// ROTA DE UPLOAD COM MIDDLEWARE ESPECÍFICO (mantida)
// ----------------------------------------------------------------
import { criarFuncionarioComAnexos } from './controllers/funcionarioController.js';
app.post('/api/funcionarios/com-anexos', uploadDropbox, criarFuncionarioComAnexos);

// Demais rotas já existentes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/sync', syncRouter);

// === CADASTRO DE CLIENTES ===
app.use('/api/clientes', clienteRoutes);

// === CADASTRO DE FORNECEDORES ===
app.use('/api/fornecedores', fornecedorRoutes);

// === NOVO: TIPO DE FORNECEDOR ===
app.use('/api/tipoFornecedor', tipoFornecedorRoutes);

// === CADASTRO DE PSL ===
app.use('/api/psl', pslRoutes);

/* ====================================================================
   CAMADA 1: Middleware wrapper para /api/filiais
   - Intercepta GET /api/filiais (raiz) e responde com listarFiliais
   - Demais caminhos/métodos seguem para o próximo middleware
==================================================================== */
app.use('/api/filiais', (req, res, next) => {
  try {
    const p = (req.path || '').replace(/\/+$/, '');
    if (req.method === 'GET' && (p === '' || p === '/')) {
      return listarFiliais(req, res);
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

/* ====================================================================
   CAMADA 2: Subrouter principal
==================================================================== */
app.use('/api/filiais', filialRoutes);

/* ====================================================================
   CAMADA 3: Rotas explícitas como fallback adicional
   - Garantem resposta mesmo se o subrouter não expor endpoints
==================================================================== */
app.get('/api/filiais', listarFiliais);
app.post('/api/filiais', criarFilial);
app.put('/api/filiais/:id', atualizarFilial);

// (opcional) endpoint de saúde
app.get('/api/filiais/__ping', (req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// Rota de estatísticas de situação (mantida)
app.get('/api/funcionarios/estatisticas/situacao', async (req, res) => {
  try {
    const estatisticas = await Funcionario.aggregate([
      { $group: { _id: '$situacao', total: { $sum: 1 } } }
    ]);
    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ erro: 'Erro ao buscar estatísticas.' });
  }
});

// Rota padrão (raiz) (mantida)
app.get('/', (req, res) => {
  res.send('API GrupoLocar está funcionando');
});

// Opcional: logger para 404s remanescentes (facilita debug se algo ainda capturar antes)
app.use((req, res, next) => {
  console.warn('404 não tratado:', req.method, req.originalUrl);
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Inicialização do servidor (mantida)
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${port}`);
  const { prefixes, endpoints } = collectRoutes();
  console.log('🔧 Prefixos montados via app.use:', prefixes.length ? prefixes : '(nenhum)');
  console.log('🔧 Endpoints detectados:', endpoints.length ? endpoints : '(nenhum)');
});
