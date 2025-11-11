const normalizarData = (data) => {
  if (!data) return '';
  try {
    return new Date(data).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const arquivosPadrao = {
  cnh_arquivo: [],
  comprovante_residencia: [],
  nada_consta: [],
  comprovante_mei: [],
  curriculo: []
};

export const normalizarFuncionario = (func) => {
  if (!func || typeof func !== 'object') return {};

  const origem = func._doc || func; // compatível com Mongoose ou .lean()
  return {
    ...origem,
    filhos: /^\d+$/.test(origem.filhos) ? origem.filhos : '0',
    data_admissao: normalizarData(origem.data_admissao),
    data_nascimento: normalizarData(origem.data_nascimento),
    validade_cnh: normalizarData(origem.validade_cnh),
    dataUltimoServicoPrestado: normalizarData(origem.dataUltimoServicoPrestado) || '1900-01-01',
    arquivos: {
      ...arquivosPadrao,
      ...(origem.arquivos || {})
    }
  };
};
