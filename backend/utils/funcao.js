export const removerAcentos = (texto) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C");
};

// Função que normaliza campos do formulário para salvar no banco
export const normalizarBody = (body = {}) => {
  const camposData = [
    'data_admissao',
    'data_demissao',
    'data_nascimento',
    'validade_cnh',
    'dataUltimoServicoPrestado',
    'emissao_cnh'
  ];

  const dados = { ...body };

  for (const campo in dados) {
    if (typeof dados[campo] === 'string') {
      dados[campo] = dados[campo].trim();
    }

    // Campos numéricos
    if (['filhos'].includes(campo)) {
      dados[campo] = parseInt(dados[campo]) || 0;
    }

    // Datas
    if (camposData.includes(campo) && dados[campo]) {
      const partes = dados[campo].split('-');
      if (partes.length === 3) {
        const [ano, mes, dia] = partes;
        const date = new Date(`${ano}-${mes}-${dia}T00:00:00`);
        if (!isNaN(date.getTime())) {
          dados[campo] = date.toISOString().split('T')[0];
        }
      }
    }
  }

  return dados;
};

// Função que normaliza um funcionário antes de retornar ao frontend
export const normalizarFuncionario = (funcionario = {}) => {
  if (!funcionario || typeof funcionario !== 'object') return funcionario;

  const obj = { ...funcionario };

  // Garantir formato ISO apenas na data
  const formatar = (data) => {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const camposData = [
    'data_admissao',
    'data_demissao',
    'data_nascimento',
    'validade_cnh',
    'dataUltimoServicoPrestado',
    'emissao_cnh'
  ];

  for (const campo of camposData) {
    if (obj[campo]) {
      obj[campo] = formatar(obj[campo]);
    }
  }

  return obj;
};
