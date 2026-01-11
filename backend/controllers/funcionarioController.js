import Funcionario from '../model/funcionario.js';
import PerfilIdeal from '../model/PerfilIdeal.js';
import fs from 'fs';
import path from 'path';
import { normalizarBody, normalizarFuncionario, removerAcentos } from '../utils/funcao.js';

const UPLOAD_FOLDER = path.join('C:/Users/tigru/Dropbox/uploads');

/* -------------------------------------------
   Utilitários simples para datas
-------------------------------------------- */
function toDate(value) {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const maskCEP = (v) => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}-${d.slice(5)}`;
};

/* -------------------------------------------
   CEP: serviço de busca (server-side)
   Retorna: { endereco, bairro, cidade, estado, cep }
-------------------------------------------- */
export const buscarCep = async (req, res) => {
  try {
    const raw = req.params.cep || req.query.cep || '';
    const cep = onlyDigits(raw).slice(0, 8);
    if (cep.length !== 8) {
      return res.status(400).json({ erro: 'CEP inválido. Use 8 dígitos.' });
    }

    // Node 18+ possui fetch nativo
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!resp.ok) return res.status(502).json({ erro: 'Falha ao consultar ViaCEP' });

    const data = await resp.json();
    if (data?.erro) return res.status(404).json({ erro: 'CEP não encontrado' });

    const payload = {
      endereco: removerAcentos(data.logradouro || ''),
      bairro: removerAcentos(data.bairro || ''),
      cidade: removerAcentos(data.localidade || ''),
      estado: String(data.uf || '').toUpperCase(),
      cep: maskCEP(cep)
    };

    return res.json(payload);
  } catch (err) {
    console.error('Erro em buscarCep:', err);
    return res.status(500).json({ erro: 'Erro ao buscar CEP' });
  }
};

export const getPorSituacao = async (req, res) => {
  const { situacao } = req.query;
  const docs = await Funcionario.find(situacao ? { situacao } : {}).lean();
  const normalizados = docs.map(normalizarFuncionario);
  res.json(normalizados);
};

export const getFuncionarios = async (_, res) => {
  try {
    const funcionarios = await Funcionario.find().lean();
    const normalizados = funcionarios.map(normalizarFuncionario);
    res.json(normalizados);
  } catch (err) {
    console.error('Erro ao buscar funcionários:', err);
    res.status(500).json({ message: 'Erro ao buscar funcionários', error: err.message });
  }
};

export const criarFuncionarioComAnexos = async (req, res) => {
  try {
    const dados = normalizarBody(req.body);

    const arquivos = req.body.arquivos || {};
    dados.arquivos = {
      cnh_arquivo: arquivos.cnh_arquivo || [],
      comprovante_residencia: arquivos.comprovante_residencia || [],
      nada_consta: arquivos.nada_consta || [],
      comprovante_mei: arquivos.comprovante_mei || [],
      curriculo: arquivos.curriculo || []
    };

    const funcionario = new Funcionario(dados);
    await funcionario.save();

    res.status(201).json(normalizarFuncionario(funcionario));
  } catch (err) {
    console.error('Erro ao criar funcionário com anexos:', err);
    res.status(500).json({
      message: 'Erro ao criar funcionário com anexos',
      error: err.message
    });
  }
};

export const createFuncionario = async (req, res) => {
  try {
    const funcionario = new Funcionario(normalizarBody(req.body));
    await funcionario.save();
    res.status(201).json(normalizarFuncionario(funcionario));
  } catch (err) {
    console.error('Erro ao criar funcionário:', err);
    res.status(400).json({ message: 'Erro ao criar funcionário', error: err.message });
  }
};

export const updateFuncionario = async (req, res) => {
  try {
    const dados = normalizarBody(req.body);

    const funcionarioExistente = await Funcionario.findById(req.params.id).lean();
    if (!funcionarioExistente) {
      return res.status(404).send('Funcionário não encontrado');
    }

    const arquivosAtualizados = {};
    const tiposArquivos = [
      'cnh_arquivo',
      'comprovante_residencia',
      'nada_consta',
      'comprovante_mei',
      'curriculo'
    ];

    for (const tipo of tiposArquivos) {
      arquivosAtualizados[tipo] = [];

      // ✅ Mantidos informados no corpo da requisição
      const mantidos = req.body[`${tipo}_existente[]`] || req.body[`${tipo}_existente`];
      const mantidosArray = Array.isArray(mantidos) ? mantidos : mantidos ? [mantidos] : [];

      // ✅ Novos arquivos recebidos via multer
      const novosArquivos = req.files?.[tipo] || [];
      const novosNomes = [];

      for (const file of novosArquivos) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const nomeBase = removerAcentos(dados.nome || 'Sem_Nome')
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^\w\s]/gi, '');

        const nomeFinal = `${timestamp}_${nomeBase}-${tipo}${ext}`;
        const destino = path.join(UPLOAD_FOLDER, nomeFinal);

        fs.renameSync(file.path, destino);
        novosNomes.push(nomeFinal);
      }

      // ✅ Junta mantidos e novos (sem duplicar)
      const conjuntoFinal = new Set([...mantidosArray, ...novosNomes]);
      arquivosAtualizados[tipo] = Array.from(conjuntoFinal);

      // 🧹 Remove os arquivos antigos que não foram mantidos
      const antigos = funcionarioExistente.arquivos?.[tipo] || [];
      const paraRemover = antigos.filter(nome => !arquivosAtualizados[tipo].includes(nome));

      for (const nome of paraRemover) {
        if (!nome.startsWith('http')) {
          const caminho = path.join(UPLOAD_FOLDER, nome);
          if (fs.existsSync(caminho)) {
            try {
              fs.unlinkSync(caminho);
              console.log(`🗑️ Arquivo excluído: ${nome}`);
            } catch (err) {
              console.warn(`⚠️ Erro ao excluir arquivo ${nome}:`, err.message);
            }
          }
        }
      }
    }

    // ✅ Atualiza o campo arquivos no objeto de dados
    dados.arquivos = arquivosAtualizados;

    // ✅ Salva a atualização no banco
    const funcionarioAtualizado = await Funcionario.findByIdAndUpdate(
      req.params.id,
      dados,
      { new: true, runValidators: true }
    );

    res.json(normalizarFuncionario(funcionarioAtualizado));
  } catch (err) {
    console.error('Erro ao atualizar funcionário:', err);
    res.status(400).json({ message: 'Erro ao atualizar funcionário', error: err.message });
  }
};

export const deleteFuncionario = async (req, res) => {
  try {
    const funcionario = await Funcionario.findByIdAndDelete(req.params.id);
    if (!funcionario) return res.status(404).send('Funcionario não encontrado');
    res.sendStatus(204);
  } catch (err) {
    console.error('Erro ao deletar funcionário:', err);
    res.status(400).json({ message: 'Erro ao deletar funcionário', error: err.message });
  }
};

export const filtroGenerico = async (req, res) => {
  try {
    const busca = (req.query.busca || '').trim();

    // Se não houver termo, retorna tudo
    if (!busca) {
      const todos = await Funcionario.find({}).lean();
      return res.json(todos.map(normalizarFuncionario));
    }

    // Regex para campos de texto
    const regex = new RegExp(busca, 'i');

    // ------------------------------
    // 1) Campos de TEXTO a pesquisar
    //    (NÃO inclui 'pj', pois é boolean)
    // ------------------------------
    const camposTexto = [
      'nome', 'sexo', 'profissao', 'situacao', 'contrato', 'telefone', 'email',
      'endereco', 'complemento', 'bairro', 'municipio', 'estado', 'cep',
      'banco', 'agencia', 'conta', 'pix', 'cpf', 'rg', 'estado_civil',
      'cnh', 'categoria', 'nome_familiar', 'contato_familiar', 'indicado', 'observacao',
      'arquivos.cnh_arquivo', 'arquivos.comprovante_residencia',
      'arquivos.nada_consta', 'arquivos.comprovante_mei', 'arquivos.curriculo'
    ];

    const orRegex = camposTexto.map(campo => ({ [campo]: regex }));

    // ------------------------------
    // 2) Tratamento OPCIONAL para 'pj'
    //    Suporta: "pj:true", "pj:false", "pj:sim", "pj:nao", "pj=1", "pj=0"
    // ------------------------------
    const buscaLower = busca.toLowerCase();

    // extrai par chave:valor se vier nesse formato
    // exemplos aceitos: "pj:true", "pj=false", "pj=sim", "pj nao"
    let filtroPj = null;
    const pjPatterns = [
      /^pj\s*[:=]\s*(true|false|1|0|sim|não|nao)$/,
      /^(true|false|1|0|sim|não|nao)\s*[:=]\s*pj$/,
      /^pj\s+(true|false|1|0|sim|não|nao)$/
    ];

    for (const rx of pjPatterns) {
      const m = buscaLower.match(rx);
      if (m) {
        const v = m[1]; // o valor capturado
        filtroPj = ['true', '1', 'sim', 'sí', 'si'].includes(v) ? true
                 : ['false', '0', 'nao', 'não', 'no'].includes(v) ? false
                 : null;
        break;
      }
    }

    const consulta = filtroPj === null
      ? { $or: orRegex }            // busca normal por texto
      : { $and: [{ pj: filtroPj }, { $or: orRegex }] }; // filtra por pj + texto

    const funcionarios = await Funcionario.find(consulta).lean();
    return res.json(funcionarios.map(normalizarFuncionario));
  } catch (err) {
    console.error('Erro no filtro genérico:', err);
    res.status(500).json({ message: 'Erro ao buscar dados', error: err.message });
  }
};


// export const filtroGenerico = async (req, res) => {
//   try {
//     const busca = req.query.busca || '';
//     const regex = new RegExp(busca, 'i');
//     const termo = busca.trim();

//     if (!termo) {
//       const todos = await Funcionario.find({}).lean();
//       return res.json(todos.map(normalizarFuncionario));
//     }

//     const seguro = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//     const funcionarios = await Funcionario.find({
//       $or: [
//         { nome: regex }, { sexo: regex }, { profissao: regex }, { situacao: regex }, { contrato: regex }, { pj: regex }, { telefone: regex },
//         { email: regex }, { endereco: regex }, { complemento: regex }, { bairro: regex }, { municipio: regex },
//         { cep: regex }, { banco: regex }, { agencia: regex }, { conta: regex },
//         { pix: regex }, { cpf: regex }, { rg: regex }, { estado_civil: regex },
//         { cnh: regex }, { categoria: regex }, { nome_familiar: regex }, { contato_familiar: regex },
//         { indicado: regex }, { observacao: regex },
//         { 'arquivos.cnh_arquivo': regex }, { 'arquivos.comprovante_residencia': regex },
//         { 'arquivos.nada_consta': regex }, { 'arquivos.comprovante_mei': regex }, { 'arquivos.curriculo': regex },
//       ]
//     }).lean();

//     res.json(funcionarios.map(normalizarFuncionario));
//   } catch (err) {
//     console.error('Erro no filtro genérico:', err);
//     res.status(500).json({ message: 'Erro ao buscar dados', error: err.message });
//   }
// };

export const getFuncionariosPorStatusCNH = async (req, res) => {
  try {
    const { status } = req.params;

    const funcionarios = await Funcionario.find().lean();
    const filtrarStatus = (validade) => {
      if (!validade) return null;
      const dias = Math.ceil((new Date(validade) - new Date()) / 864e5);
      if (dias < 0) return 'Vencido';
      if (dias <= 30) return 'A Vencer';
      return 'Prazo';
    };

    const filtrados = funcionarios
      .filter((f) => filtrarStatus(f.validade_cnh) === status)
      .map(normalizarFuncionario);

    res.json(filtrados);
  } catch (err) {
    console.error('Erro ao filtrar por status CNH:', err);
    res.status(500).json({ erro: 'Erro ao filtrar por status CNH', error: err.message });
  }
};

export const getStatusCNHEstatistica = async (_, res) => {
  try {
    const funcionarios = await Funcionario.find().lean();
    const contagem = { Vencido: 0, 'A Vencer': 0, Prazo: 0 };

    funcionarios.forEach((f) => {
      const dias = Math.ceil((new Date(f.validade_cnh) - new Date()) / 864e5);
      let status = null;

      if (!f.validade_cnh) return;
      if (dias < 0) status = 'Vencido';
      else if (dias <= 30) status = 'A Vencer';
      else status = 'Prazo';

      if (status) contagem[status]++;
    });

    res.json(contagem);
  } catch (err) {
    console.error('Erro ao calcular estatísticas de CNH:', err);
    res.status(500).json({ erro: 'Erro ao calcular estatísticas de CNH', message: err.message });
  }
};

export const getEstatisticasFuncionarios = async (req, res) => {
  try {
    const funcionarios = await Funcionario.find();

    const contarPorCampo = (campo, normalizar = false) => {
      const contagem = {};

      for (const f of funcionarios) {
        let valor = f[campo] ?? 'Não informado';

        if (normalizar && campo === 'filhos') {
          // Limpa espaços, letras e corrige casos como '01', ' 1 ', 'Ñ', 'Nã', etc.
          valor = String(valor).trim().replace(/\D/g, '');
          if (!valor) {
            valor = 'Não informado';
          } else if (valor.length > 2) {
            valor = 'Não informado';
          }
        }

        contagem[valor] = (contagem[valor] || 0) + 1;
      }

      return Object.entries(contagem).map(([key, count]) => ({
        [campo]: key,
        count,
      }));
    };

    const resposta = {
      estado_civil: contarPorCampo('estado_civil'),
      sexo: contarPorCampo('sexo'),
      filhos: contarPorCampo('filhos', true),
    };

    res.json(resposta);
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    res.status(500).json({ erro: 'Erro ao gerar estatísticas dos funcionários' });
  }
};

export const setPerfilIdealFuncionarios = async (req, res) => {
  try {
    const { idade_min, idade_max, tempo_habilitacao_min, estado_civil, filhos_min } = req.body;

    const atualizado = await PerfilIdeal.findOneAndUpdate(
      {},
      {
        idade_min,
        idade_max,
        tempo_habilitacao_min,
        estado_civil,
        filhos_min
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({ message: 'Perfil ideal atualizado com sucesso', doc: atualizado });
  } catch (err) {
    console.error('Erro ao salvar perfil ideal:', err);
    res.status(500).json({ erro: 'Erro ao salvar perfil ideal', message: err.message });
  }
};

export const getConfiguracaoPerfilIdeal = async (req, res) => {
  try {
    const config = await PerfilIdeal.findOne().sort({ updatedAt: -1 });
    if (!config) {
      return res.status(404).json({ message: 'Nenhuma configuração registrada ainda.' });
    }
    res.json(config);
  } catch (err) {
    console.error('Erro ao buscar configuração do perfil ideal:', err);
    res.status(500).json({ message: 'Erro ao buscar configuração', error: err.message });
  }
};

export const getPerfilIdealFuncionarios = async (req, res) => {
  try {
    const config = await PerfilIdeal.findOne().sort({ updatedAt: -1 });

    if (!config) {
      return res.status(404).json({ erro: 'Perfil ideal ainda não foi configurado.' });
    }

    const funcionarios = await Funcionario.find().lean();
    const hoje = new Date();

    const calcularIdade = (nascimento) => {
      if (!nascimento) return 0;
      const dataNasc = new Date(nascimento);
      let idade = hoje.getFullYear() - dataNasc.getFullYear();
      const mes = hoje.getMonth() - dataNasc.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
        idade--;
      }
      return idade;
    };
    
    const normalizarNumeroFilhos = (valor) => {
      if (!valor) return 0;
      valor = String(valor).trim().replace(/\D/g, '');
      if (!valor || valor.length > 2) return 0;
      return parseInt(valor);
    };
    
    const calcularTempoHabilitacao = (emissao) => {
      if (!emissao) return 0;
      const dataEmissao = new Date(emissao);
      let anos = hoje.getFullYear() - dataEmissao.getFullYear();
      const mes = hoje.getMonth() - dataEmissao.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < dataEmissao.getDate())) {
        anos--;
      }
      return Math.max(0, anos);
    };
    
    const perfilIdeal = funcionarios.filter(f => {
      const idade = calcularIdade(f.data_nascimento);
      const tempoHabilitacao = calcularTempoHabilitacao(f.emissao_cnh);
      const filhos = normalizarNumeroFilhos(f.filhos);

      return (
        idade >= config.idade_min &&
        idade <= config.idade_max &&
        tempoHabilitacao >= config.tempo_habilitacao_min &&
        f.estado_civil === config.estado_civil &&
        filhos >= config.filhos_min
      );
    });

    res.json(perfilIdeal.map(f => ({
      ...normalizarFuncionario(f),
      idade: calcularIdade(f.data_nascimento),
      tempoHabilitacao: calcularTempoHabilitacao(f.emissao_cnh),
      categoria_cnh: f.categoria || ''
    })));
  } catch (err) {
    console.error('Erro ao buscar perfil ideal:', err);
    res.status(500).json({ erro: 'Erro ao buscar perfil ideal', message: err.message });
  }
};

export const normalizarBodyMiddleware = (req, _res, next) => {
  req.body = normalizarBody(req.body || {});
  next();
};

export {
  // getPorSituacao,
  // getFuncionarios,
  // createFuncionario,
  // updateFuncionario,
  // deleteFuncionario,
  // filtroGenerico,
  // getStatusCNHEstatistica,
  // getFuncionariosPorStatusCNH,
  // normalizarBodyMiddleware,
  // normalizarBody
};
