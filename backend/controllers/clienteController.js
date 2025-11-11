// C:\Locar\backend\controllers\clienteController.js
import Cliente from '../model/Cliente.js';

const normalizarTextoBase = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/gi, 'c');

const toTitleCase = (s = '') =>
  String(s).toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

const normalizarPorCampo = (body) => {
  const out = { ...(body || {}) };

  // Sempre remover acentos/ç e trims
  const campos = [
    'cliente','razao_social','cnpj','insc_estadual','filial','distrital',
    'responsavel','cargo','telefone','email','endereco','complemento',
    'cidade','bairro','estado','cep','observacao'
  ];
  for (const k of campos) {
    if (out[k] != null) out[k] = normalizarTextoBase(String(out[k]).trim());
  }

  // Title Case para textos, exceto filial/email/estado
  const titleCaseCampos = [
    'cliente','razao_social','distrital','responsavel','cargo',
    'endereco','complemento','cidade','bairro','observacao'
  ];
  for (const k of titleCaseCampos) {
    if (out[k]) out[k] = toTitleCase(out[k]);
  }

  if (out.email) out.email = out.email.toLowerCase();
  if (out.filial) out.filial = out.filial.toUpperCase();
  if (out.estado) out.estado = out.estado.toUpperCase().slice(0, 2);

  return out;
};

// (opcional) escape de regex p/ filtro livre
const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listar = async (_req, res) => {
  try {
    const lista = await Cliente.find().sort({ cliente: 1 }).lean();
    res.json(lista);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
};

export const filtroLivre = async (req, res) => {
  try {
    const { busca = '' } = req.query;
    if (!busca) {
      const lista = await Cliente.find().sort({ cliente: 1 }).lean();
      return res.json(lista);
    }
    const pattern = escapeRegex(busca);
    const regex = new RegExp(pattern, 'i');

    const lista = await Cliente.find({
      $or: [
        { cliente: regex },
        { razao_social: regex },
        { cnpj: regex },
        { insc_estadual: regex },
        { filial: regex },
        { distrital: regex },
        { responsavel: regex },
        { cargo: regex },
        { telefone: regex },
        { email: regex },
        { endereco: regex },
        { complemento: regex },
        { cidade: regex },
        { bairro: regex },
        { estado: regex },
        { cep: regex },
        { observacao: regex },
      ]
    }).sort({ cliente: 1 }).lean();

    res.json(lista);
  } catch (e) {
    console.error('Erro em filtroLivre:', e);
    res.status(500).json({ erro: 'Erro ao filtrar clientes.' });
  }
};

export const criar = async (req, res) => {
  try {
    const body = normalizarPorCampo(req.body);
    const doc = await Cliente.create(body);
    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000 && e.keyPattern?.cnpj) {
      return res.status(400).json({ erro: 'CNPJ duplicado.' });
    }
    res.status(400).json({ erro: e.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const body = normalizarPorCampo(req.body);
    const doc = await Cliente.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.json(doc);
  } catch (e) {
    if (e.code === 11000 && e.keyPattern?.cnpj) {
      return res.status(400).json({ erro: 'CNPJ duplicado.' });
    }
    res.status(400).json({ erro: e.message });
  }
};
