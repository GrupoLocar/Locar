// ESM
import Psl from '../model/Psl.js';

// util: remover acentos/ç
const stripAccents = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c');

// util: primeira letra maiúscula, restante minúsculas
const firstUpperRestLower = (s = '') =>
  s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const sanitizeIncoming = (payload) => {
  const out = { ...payload };

  // normalizar textos (exceção: filial não recebe TitleCase, apenas remover acentos)
  if (out.filial) out.filial = stripAccents(String(out.filial).trim());
  if (out.distrital) out.distrital = firstUpperRestLower(stripAccents(String(out.distrital).trim()));
  if (out.ocorrencia_psl) out.ocorrencia_psl = firstUpperRestLower(stripAccents(String(out.ocorrencia_psl).trim()));
  if (out.observacao) out.observacao = firstUpperRestLower(stripAccents(String(out.observacao).trim()));

  // garantir ISO em UTC (ex: "2025-07-09T18:22:06.000Z")
  if (out.data) {
    const d = new Date(out.data);
    if (!isNaN(d.getTime())) out.data = d.toISOString();
  }
  return out;
};

/**
 * Converte uma data de filtro vinda como:
 *  - "YYYY-MM-DD" -> interpreta como meia-noite local em America/Sao_Paulo
 *  - "YYYY-MM-DDTHH:mm[:ss]" -> usa como está
 * Se asEndExclusive=true, retorna o instante do INÍCIO do dia seguinte em America/Sao_Paulo,
 * garantindo intervalo [start, end) que inclui TODO o dia final local.
 */
const parseFilterDate = (value, asEndExclusive = false) => {
  if (!value) return null;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);

  if (isDateOnly) {
    // Brasil (sem DST atualmente): -03:00
    const base = new Date(`${value}T00:00:00-03:00`); // meia-noite local SP
    if (asEndExclusive) {
      // dia seguinte, 00:00:00 local SP
      const next = new Date(base.getTime());
      next.setDate(next.getDate() + 1);
      return next; // usado com $lt
    }
    return base; // usado com $gte
  }

  // Se vier com horário, usamos o valor direto
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  if (asEndExclusive) {
    // pequeno incremento para tornar exclusivo (evita cortar registros do mesmo segundo)
    return new Date(d.getTime() + 1);
  }
  return d;
};

export const criarPsl = async (req, res) => {
  try {
    const body = sanitizeIncoming(req.body);
    const { data, filial, distrital, ocorrencia_psl } = body;
    if (!data || !filial || !distrital || !ocorrencia_psl) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
    const doc = await Psl.create(body);
    res.status(201).json(doc);
  } catch (err) {
    console.error('criarPsl error:', err);
    res.status(500).json({ error: 'Erro ao criar PSL.' });
  }
};

export const atualizarPsl = async (req, res) => {
  try {
    const { id } = req.params;
    const body = sanitizeIncoming(req.body);
    const updated = await Psl.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json(updated);
  } catch (err) {
    console.error('atualizarPsl error:', err);
    res.status(500).json({ error: 'Erro ao atualizar PSL.' });
  }
};

export const obterPsl = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Psl.findById(id);
    if (!doc) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json(doc);
  } catch (err) {
    console.error('obterPsl error:', err);
    res.status(500).json({ error: 'Erro ao obter PSL.' });
  }
};

export const listarPsl = async (req, res) => {
  try {
    const {
      q,
      filial,
      distrital,
      ocorrencia_psl,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // ====== Período ======
    // Intervalo fechado no último dia local: [início, inícioDoDiaSeguinte)
    if (startDate || endDate) {
      filter.data = {};

      const gte = parseFilterDate(startDate, false);
      const lt  = parseFilterDate(endDate, true);

      if (gte) filter.data.$gte = gte;
      if (lt)  filter.data.$lt  = lt;
    }

    // ====== Filtros diretos (ignorar "Todos/Todas") ======
    const notAll = (v) => v && !/^tod(a|o)s?$/i.test(v);
    if (notAll(filial)) filter.filial = stripAccents(String(filial).trim());
    if (notAll(distrital)) filter.distrital = firstUpperRestLower(stripAccents(String(distrital).trim()));
    if (notAll(ocorrencia_psl))
      filter.ocorrencia_psl = firstUpperRestLower(stripAccents(String(ocorrencia_psl).trim()));

    // ====== Busca livre (q) ======
    if (q && String(q).trim().length) {
      const term = stripAccents(String(q).trim());
      const rx = new RegExp(term, 'i');
      filter.$or = [
        { filial: rx },
        { distrital: rx },
        { ocorrencia_psl: rx },
        { observacao: rx },
      ];
    }

    // Ordenação padrão (mantida): data desc + createdAt desc
    const itens = await Psl.find(filter).sort({ data: -1, createdAt: -1 });
    res.json(itens);
  } catch (err) {
    console.error('listarPsl error:', err);
    res.status(500).json({ error: 'Erro ao listar PSL.' });
  }
};
