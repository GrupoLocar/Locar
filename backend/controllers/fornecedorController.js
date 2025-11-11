// backend/controllers/fornecedorController.js
import Fornecedor from '../model/fornecedor.js';

// helper: calcula próximo código FORN-##########
async function gerarProximoCodigo() {
  const [ultimo] = await Fornecedor.find({
    codigo_fornecedor: { $regex: /^FORN-\d{10}$/ }
  })
    .sort({ codigo_fornecedor: -1 }) // ordenação lexicográfica funciona com zero-padding
    .limit(1)
    .lean();

  let seq = 0;
  if (ultimo?.codigo_fornecedor) {
    const m = /^FORN-(\d{10})$/.exec(ultimo.codigo_fornecedor);
    if (m) seq = parseInt(m[1], 10) || 0;
  }
  const next = String(seq + 1).padStart(10, '0');
  return `FORN-${next}`;
}

export async function listarFornecedores(req, res) {
  try {
    const { filtro = '' } = req.query;
    if (!filtro) {
      const all = await Fornecedor.find().sort({ fornecedor: 1 }).lean();
      return res.json(all);
    }

    const escaped = filtro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');

    const docs = await Fornecedor.find({
      $or: [
        { fornecedor: rx },
        { razao_social: rx },
        { cnpj: rx },
        { insc_estadual: rx },
        { responsavel: rx },
        { cargo: rx },
        { telefone: rx },
        { email: rx },
        { endereco: rx },
        { complemento: rx },
        { cidade: rx },
        { bairro: rx },
        { estado: rx },
        { cep: rx },
        { codigo_fornecedor: rx } // <<< agora como string
      ]
    })
      .sort({ fornecedor: 1 })
      .lean();

    res.json(docs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao listar fornecedores' });
  }
}

export async function criarFornecedor(req, res) {
  try {
    const payload = { ...req.body };

    // Garante codigo_fornecedor válido; se vier vazio/incorrecto, gera um novo
    if (!payload.codigo_fornecedor || !/^FORN-\d{10}$/.test(payload.codigo_fornecedor)) {
      payload.codigo_fornecedor = await gerarProximoCodigo();
    }

    const novo = await Fornecedor.create(payload);
    res.status(201).json(novo);
  } catch (e) {
    console.error(e);
    // evita vazar mensagem técnica
    const friendly = /codigo_fornecedor/i.test(e?.message || '')
      ? 'Código do Fornecedor não foi preenchido.'
      : (e?.message || 'Erro ao criar fornecedor');
    res.status(400).json({ erro: friendly });
  }
}

export async function atualizarFornecedor(req, res) {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    // não permitir mudar o codigo_fornecedor
    if ('codigo_fornecedor' in payload) {
      delete payload.codigo_fornecedor;
    }

    const doc = await Fornecedor.findByIdAndUpdate(id, payload, { new: true });
    if (!doc) return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(400).json({ erro: e.message || 'Erro ao atualizar fornecedor' });
  }
}

export async function obterFornecedor(req, res) {
  try {
    const { id } = req.params;
    const doc = await Fornecedor.findById(id).lean();
    if (!doc) return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(400).json({ erro: 'Erro ao obter fornecedor' });
  }
}
