// Aplicar máscara (00)00000-0000 para telefone e contato_familiar
export const formatTelefone = (v) => {
  const cleaned = v.replace(/\D/g, '').slice(0, 11);
  return cleaned.length <= 10
    ? cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1)$2-$3')
    : cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1)$2-$3');
};

// Aplicar máscara 00.000-000 para CEP
export const formatCEP = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2-$3')
    .slice(0, 10);
};

// Aplica máscara 000.000.000-00 para CPF
export const formatCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
    .slice(0, 14);
};

// Aplica máscara 00.000.000-0 para RG
export const formatRG = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
    .slice(0, 12);
};

export const camposOrdenados = [
  '_id', 'nome', 'sexo', 'profissao', 'situacao', 'contrato', 'pj', 'data_admissao', 'data_nascimento', 'telefone',
  'email', 'endereco', 'complemento', 'bairro', 'municipio', 'cep', 'banco', 'agencia', 'conta', 'pix', 'cpf',
  'rg', 'estado_civil', 'filhos', 'cnh', 'categoria', 'emissao_cnh', 'validade_cnh', 'nome_familiar', 'contato_familiar',
  'indicado', 'observacao', 'dataUltimoServicoPrestado', 'cnh_arquivo', 'comprovante_residencia', 'nada_consta',
  'comprovante_mei', 'curriculo', 'createdAt', 'updatedAt', 'data_envio_utc', 'data_envio_local'
];

export const camposDesabilitados = [
  '_id', 'diasVencimentoCNH', 'dataUltimoServicoPrestado', 'createdAt', 'updatedAt', 'data_envio_utc', 'data_envio_local'
];

export const labels = {
  _id: 'ID', nome: 'Nome', sexo: 'Sexo', profissao: 'Profissão', situacao: 'Situação', data_admissao: 'Data de Admissão',
  data_nascimento: 'Data de Nascimento', contrato: 'Contrato', pj: 'PJ', telefone: 'Telefone', email: 'Email', endereco: 'Endereço',
  complemento: 'Complemento', bairro: 'Bairro', municipio: 'Cidade', cep: 'CEP', banco: 'Banco', agencia: 'Agência',
  conta: 'Conta', pix: 'PIX', cpf: 'CPF', rg: 'RG', estado_civil: 'Estado Civil', filhos: 'Número de Filhos',
  cnh: 'Número da CNH', categoria: 'Categoria da CNH', emissao_cnh: '1ª Habilitação:', validade_cnh: 'Validade da CNH', nome_familiar: 'Nome do Familiar',
  contato_familiar: 'Contato do Familiar', dataUltimoServicoPrestado: 'Data do Último Serviço Prestado',
  indicado: 'Indicado por', observacao: 'Observação', cnh_arquivo: 'Arquivo da CNH', comprovante_residencia: 'Comprovante de Residência',
  nada_consta: 'Nada Consta da CNH', comprovante_mei: 'Comprovante do MEI', curriculo: 'Currículo',
  createdAt: 'Criado em', updatedAt: 'Atualizado em', data_envio_utc: 'Envio (UTC)', data_envio_local: 'Envio (Local)'
};

export const limites = {
  nome: 80, profissao: 30, telefone: 15, email: 60, endereco: 100, complemento: 60, bairro: 80, municipio: 80, cep: 10, agencia: 10, conta: 25, pix: 80, cpf: 14,
  rg: 12, estado_Civil: 11, filhos: 1, cnh: 11, categoria: 2, nome_familiar: 80, contato_familiar: 15, indicado: 80, observacao: 500
};

export const selects = {
  opcoesSexo: ['Masculino', 'Feminino'],
  opcoesContrato: ['Comum', 'Mei'],
  opcoesSituacao: ['Ativo', 'Inativo', 'Bloqueado', 'Aprovar', 'Entrevistar'],
  opcoesBanco: [ '001 – Banco do Brasil', '021 – Banestes – Banco do Estado do Espírito Santo', '033 – Banco Santander (Brasil) S.A.',
    '041 – Banco do Estado do Rio Grande do Sul (Banrisul)', '074 – Banco J. Safra S.A.', '075 – Banco CR2 S.A.',
    '077 – Banco Intermedium S.A.', '104 – Caixa Econômica Federal', '197 – Stone Instituição de Pagamento S.A.',
    '218 – Banco BS2 S.A.', '237 – Banco Bradesco S.A.', '260 – Nu Pagamentos S.A.', '290 – PagSeguro Internet Instituição de Pagamento S.A.',
    '318 – Banco BMG S.A.', '336 – Banco C6 S.A.', '341 – Itaú Unibanco S.A.', '380 – PicPay Instituição de Pagamento S.A.',
    '399 – HSBC Bank Brasil S.A.', '422 – Banco Safra S.A.', '477 – Citibank N.A. (filial)', '536 – Neon Pagamentos S.A. – Instituição de Pagamento',
    '637 – Banco Sofisa S.A.', '655 – Banco Votorantim S.A.', '707 – Banco Daycoval S.A.', '745 – Banco Citibank S.A.',
    '746 – Banco Modal S.A.', '748 – Banco Cooperativo Sicredi S.A.', '756 – Banco Cooperativo do Brasil – Bancoob'
      ],
  opcoesEstado_civil: ['Casado(A)', 'Solteiro(A)', 'Separado(A)', 'Divorciado(A)', 'Viúvo(A)'],
  opcoesCategoria: ['Ab', 'Ac', 'Ad', 'Ae', 'B', 'C', 'D', 'E']
};
