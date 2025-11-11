// backend/controllers/tipoFornecedorController.js
import TipoFornecedor from '../model/tipoFornecedor.js';

// Normaliza: primeira letra maiúscula, demais minúsculas (mantém números e espaços)
function titleCase(str = '') {
  const s = String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // tira acentos
  return s
    .toLowerCase()
    .replace(/\b([a-zà-ú])([a-zà-ú0-9]*)/gi, (_, p1, p2) => p1.toUpperCase() + p2);
}

export async function listarTipos(req, res) {
  try {
    const docs = await TipoFornecedor.find().sort({ tipoFornecedor: 1 }).lean();
    res.json(docs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao listar tipos de fornecedor' });
  }
}

export async function criarTipo(req, res) {
  try {
    let { categoria = '', tipoFornecedor = '' } = req.body || {};
    categoria = titleCase(categoria);
    tipoFornecedor = titleCase(tipoFornecedor);

    if (!categoria || !tipoFornecedor) {
      return res.status(400).json({ erro: 'Informe categoria e tipoFornecedor.' });
    }

    // Evita duplicados simples (categoria + tipoFornecedor)
    const jaExiste = await TipoFornecedor.findOne({ categoria, tipoFornecedor }).lean();
    if (jaExiste) {
      return res.status(200).json(jaExiste);
    }

    const novo = await TipoFornecedor.create({ categoria, tipoFornecedor });
    res.status(201).json(novo);
  } catch (e) {
    console.error(e);
    res.status(400).json({ erro: 'Erro ao criar tipo de fornecedor' });
  }
}

export async function atualizarTipo(req, res) {
  try {
    const { id } = req.params;
    let { categoria = '', tipoFornecedor = '' } = req.body || {};
    categoria = titleCase(categoria);
    tipoFornecedor = titleCase(tipoFornecedor);

    if (!categoria || !tipoFornecedor) {
      return res.status(400).json({ erro: 'Informe categoria e tipoFornecedor.' });
    }

    const doc = await TipoFornecedor.findByIdAndUpdate(
      id,
      { categoria, tipoFornecedor },
      { new: true }
    );

    if (!doc) return res.status(404).json({ erro: 'Registro não encontrado' });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(400).json({ erro: 'Erro ao atualizar tipo de fornecedor' });
  }
}
