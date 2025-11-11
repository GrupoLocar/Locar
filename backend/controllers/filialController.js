// backend/controllers/filialController.js
import Filial from '../model/Filial.js';

const rmAcentos = (s = '') =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/gi, 'c');
const soLetras = (s = '', { espaco = true } = {}) =>
  rmAcentos(s).replace(espaco ? /[^a-zA-Z\s]/g : /[^a-zA-Z]/g, '').replace(/\s{2,}/g, ' ').trim();
const letrasEspacosNumeros = (s = '') =>
  rmAcentos(s).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s{2,}/g, ' ').trim();
const title = (s = '') => soLetras(s, { espaco: true }).toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
const soNum = (s = '') => (s || '').replace(/\D/g, '');
const maskCNPJ = (v = '') => {
  const s = soNum(v).slice(0, 14);
  return s.replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2');
};
const maskIE = (v = '') => {
  const s = soNum(v).slice(0, 9);
  return s.replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/(\d{2})(\d{1,2})$/, '$1-$2');
};
const maskTel = (v = '') => {
  const s = soNum(v).slice(0, 11);
  if (s.length <= 10) return s.replace(/^(\d{2})(\d)/,'($1)$2').replace(/(\d{4})(\d)/,'$1-$2');
  return s.replace(/^(\d{2})(\d)/,'($1)$2').replace(/(\d{5})(\d)/,'$1-$2');
};
const maskCEP = (v = '') => {
  const s = soNum(v).slice(0, 8);
  return s.replace(/^(\d{2})(\d{3})(\d{1,3})?$/, (m, a, b, c = '') => (c ? `${a}.${b}-${c}` : `${a}.${b}`));
};

const normalizarEntrada = (payload = {}) => {
  const out = { ...payload };
  out.cliente = title(payload.cliente || '');
  out.filial = soLetras(payload.filial || '', { espaco: false }).toUpperCase().slice(0, 10);
  out.distrital = title(payload.distrital || '').slice(0, 70);
  out.responsavel = title(payload.responsavel || '').slice(0, 100);
  out.cargo = title(payload.cargo || '').slice(0, 70);
  out.bairro = title(payload.bairro || '').slice(0, 70);
  const lex = (v, max) => letrasEspacosNumeros(v || '').toLowerCase().replace(/\b\w/g, m => m.toUpperCase()).slice(0, max);
  out.razao_social = lex(payload.razao_social, 100);
  out.endereco = lex(payload.endereco, 100);
  out.complemento = lex(payload.complemento, 70);
  out.observacao = lex(payload.observacao || '', 100);
  out.cidade = title(payload.cidade || '').slice(0, 70);
  out.estado = soLetras(payload.estado || '', { espaco: false }).toUpperCase().slice(0, 2);
  out.email = rmAcentos(String(payload.email || '').toLowerCase()).replace(/\s+/g, '').slice(0, 100);
  out.cnpj = maskCNPJ(payload.cnpj || '');
  out.insc_estadual = payload.insc_estadual ? maskIE(payload.insc_estadual) : '';
  out.telefone = maskTel(payload.telefone || '');
  out.cep = maskCEP(payload.cep || '');
  return out;
};

export const listar = async (req, res) => {
  try {
    const { filtro = '', filial, distrital, responsavel, cidade } = req.query;

    const $or = [];
    if (filtro) {
      const re = new RegExp(rmAcentos(String(filtro)), 'i');
      $or.push(
        { cliente: re }, { filial: re }, { distrital: re }, { razao_social: re },
        { cnpj: re }, { insc_estadual: re }, { responsavel: re }, { cargo: re },
        { telefone: re }, { email: re }, { endereco: re }, { complemento: re },
        { cidade: re }, { bairro: re }, { estado: re }, { cep: re }, { observacao: re }
      );
    }

    const and = [];
    if (filial && filial !== 'Todos') and.push({ filial: new RegExp(`^${rmAcentos(filial)}$`, 'i') });
    if (distrital && distrital !== 'Todas') and.push({ distrital: new RegExp(`^${rmAcentos(distrital)}$`, 'i') });
    if (responsavel && responsavel !== 'Todos') and.push({ responsavel: new RegExp(`^${rmAcentos(responsavel)}$`, 'i') });
    if (cidade && cidade !== 'Todas') and.push({ cidade: new RegExp(`^${rmAcentos(cidade)}$`, 'i') });

    const query = and.length || $or.length
      ? { ...(and.length ? { $and: and } : {}), ...( $or.length ? { $or } : {}) }
      : {};

    const itens = await Filial.find(query).sort({ filial: 1 }).lean();
    res.json(itens);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Falha ao listar filiais' });
  }
};

export const criar = async (req, res) => {
  try {
    const dados = normalizarEntrada(req.body || {});
    if (!dados.cliente || !dados.filial || !dados.distrital || !dados.razao_social ||
        !dados.cnpj || !dados.responsavel || !dados.cargo || !dados.telefone ||
        !dados.email || !dados.endereco || !dados.complemento || !dados.cidade ||
        !dados.bairro || !dados.estado || !dados.cep) {
      return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos.' });
    }
    if (soNum(dados.cnpj).length !== 14) return res.status(400).json({ erro: 'CNPJ inválido.' });
    if (soNum(dados.cep).length !== 8) return res.status(400).json({ erro: 'CEP inválido.' });
    const dTel = soNum(dados.telefone).length;
    if (!(dTel === 10 || dTel === 11)) return res.status(400).json({ erro: 'Telefone inválido.' });

    const novo = await Filial.create(dados);
    res.status(201).json(novo);
  } catch (e) {
    console.error(e);
    if (e?.code === 11000 && e?.keyPattern?.cnpj) {
      return res.status(409).json({ erro: 'CNPJ já cadastrado.' });
    }
    res.status(500).json({ erro: 'Falha ao criar filial' });
  }
};

export const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = normalizarEntrada(req.body || {});
    const upd = await Filial.findByIdAndUpdate(id, dados, { new: true });
    if (!upd) return res.status(404).json({ erro: 'Filial não encontrada' });
    res.json(upd);
  } catch (e) {
    console.error(e);
    if (e?.code === 11000 && e?.keyPattern?.cnpj) {
      return res.status(409).json({ erro: 'CNPJ já cadastrado.' });
    }
    res.status(500).json({ erro: 'Falha ao atualizar filial' });
  }
};
