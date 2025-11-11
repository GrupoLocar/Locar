export function normalizarTextoCapitalizado(str) {
  if (!str) return '';
  str = removerAcentosECedilha(str.toLowerCase());
  // Primeira letra de cada palavra maiúscula
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
}

export function validarEmailBasico(email) {
  if (!email) return false;
  const rx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return rx.test(email);
}

// ======= Sanitização base =======
export const removerAcentosECedilha = (str = '') =>
  String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c');

// Apenas números
export const soNumeros = (v = '') => (v || '').replace(/\D/g, '');

// Apenas letras (A-Z) e espaço
export const letrasEspacos = (v = '') =>
  removerAcentosECedilha(v)
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();

// Apenas letras (A-Z), sem espaço (p/ FILIAL/ESTADO base)
export const letrasSemEspaco = (v = '') =>
  removerAcentosECedilha(v).replace(/[^a-zA-Z]/g, '');

// Letras+espaços+números (para endereço/observação)
export const letrasEspacosNumeros = (v = '') =>
  removerAcentosECedilha(v)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();

// ======= Title Case básico =======
const toTitleCase = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

// ======= Máscaras =======
export const formatCNPJ = (v = '') => {
  const s = soNumeros(v).slice(0, 14);
  return s
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// (99)99999-9999  → sem espaço, 14 chars incluindo parênteses e hífen
export const formatTelefone = (v = '') => {
  const s = soNumeros(v).slice(0, 11);
  if (s.length <= 10) {
    return s
      .replace(/^(\d{2})(\d)/, '($1)$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return s
    .replace(/^(\d{2})(\d)/, '($1)$2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

// 99.999.99-9 (inscrição estadual)
export const formatInscEstadual = (v = '') => {
  const s = soNumeros(v).slice(0, 9);
  return s
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{2})(\d{1,2})$/, '$1-$2');
};

// 99.999-999 (CEP)
export const formatCEP = (v = '') => {
  const s = soNumeros(v).slice(0, 8);
  return s.replace(/^(\d{2})(\d{3})(\d{1,3})?$/, (m, a, b, c = '') =>
    c ? `${a}.${b}-${c}` : `${a}.${b}`
  );
};

// ======= Limites =======
export const limites = {
  cliente: 80, razao_social: 100, cnpj: 18, insc_estadual: 11, filial: 10, distrital: 70, responsavel: 100,
  cargo: 70, telefone: 14, email: 100, endereco: 100, complemento: 70, cidade: 70,
  bairro: 70, estado: 2, cep: 10, observacao: 100,
};

export const limitesFornecedor = {
  codigo_fornecedor: 10, fornecedor: 100, razao_social: 100, cnpj: 18, insc_estadual: 11,
  responsavel: 100, cargo: 70, telefone: 15, email: 100, endereco: 100, complemento: 70, cidade: 70, bairro: 70,
  estado: 2, cep: 10, observacao: 100
};

// ======= Labels =======
export const labelsCliente = {
  cliente: 'Cliente', razao_social: 'Razão Social', cnpj: 'CNPJ', insc_estadual: 'Inscrição Estadual',
  filial: 'Filial', distrital: 'Distrital', responsavel: 'Responsável', cargo: 'Cargo', telefone: 'Telefone',
  email: 'E-mail', endereco: 'Endereço', complemento: 'Complemento', cidade: 'Cidade', bairro: 'Bairro',
  estado: 'Estado', cep: 'CEP', observacao: 'Observação',
};

// ======= Ordem =======
export const camposCliente = [
  'cliente', 'razao_social', 'cnpj', 'insc_estadual', 'filial', 'distrital', 'responsavel', 'cargo', 'telefone', 'email',
  'endereco', 'complemento', 'cidade', 'bairro', 'estado', 'cep', 'observacao',
];

// ======= Validações =======
export const validarEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');

// ======= Normalização por campo =======
export const normalizarInput = (name, value) => {
  let v = removerAcentosECedilha(String(value || ''));

  switch (name) {
    // Somente letras e espaços (sem números) + Title Case:
    case 'cliente':
    case 'razao_social':
    case 'distrital':
    case 'responsavel':
    case 'cargo':
    case 'cidade':
    case 'bairro':
      return toTitleCase(letrasEspacos(v)).slice(0, limites[name]);

    // Somente letras (sem números, sem espaços) e MAIÚSCULO:
    case 'filial':
      return letrasSemEspaco(v).toUpperCase().slice(0, limites.filial);

    // Estado: 2 letras, MAIÚSCULO
    case 'estado':
      return letrasSemEspaco(v).toUpperCase().slice(0, 2);

    // Aceitam letras+espaços+números + Title Case:
    case 'endereco':
    case 'observacao':
    case 'complemento':
      return toTitleCase(letrasEspacosNumeros(v)).slice(0, limites[name]);

    // Máscaras numéricas:
    case 'cnpj':
      return formatCNPJ(v);
    case 'insc_estadual':
      return formatInscEstadual(v);
    case 'telefone':
      return formatTelefone(v);
    case 'cep':
      return formatCEP(v);

    // E-mail minúsculo
    case 'email':
      return v.toLowerCase().slice(0, limites.email);

    default:
      return v;
  }
};

// ======= UFs =======
export const UF_OPTIONS = [
  'ES', 'MG', 'RJ'
];

// export const UF_OPTIONS = [
//   'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
//   'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
// ];

// ======= Municipios RJ =======
export const MUNICIPIOS_RJ = [
  'Angra dos Reis', 'Aperibe', 'Araruama', 'Areal', 'Armacao dos Buzios', 'Arraial do Cabo',
  'Barra do Pirai', 'Barra Mansa', 'Belford Roxo', 'Bom Jardim', 'Bom Jesus do Itabapoana',
  'Cabo Frio', 'Cachoeiras de Macacu', 'Cambuci', 'Campos dos Goytacazes', 'Cantagalo',
  'Carapebus', 'Cardoso Moreira', 'Carmo', 'Casimiro de Abreu', 'Comendador Levy Gasparian',
  'Conceicao de Macabu', 'Cordeiro', 'Duas Barras', 'Duque de Caxias', 'Engenheiro Paulo de Frontin',
  'Guapimirim', 'Iguaba Grande', 'Itaborai', 'Itaguai', 'Italva', 'Itaocara', 'Itaperuna',
  'Itatiaia', 'Japeri', 'Laje do Muriae', 'Macae', 'Macuco', 'Mage', 'Mangaratiba', 'Marica',
  'Mendes', 'Mesquita', 'Miguel Pereira', 'Miracema', 'Natividade', 'Nilopolis', 'Niteroi',
  'Nova Friburgo', 'Nova Iguacu', 'Paracambi', 'Paraiba do Sul', 'Paraty', 'Paty do Alferes',
  'Petropolis', 'Pinheiral', 'Pirai', 'Porciuncula', 'Porto Real', 'Quatis', 'Queimados',
  'Quissama', 'Resende', 'Rio Bonito', 'Rio Claro', 'Rio das Flores', 'Rio das Ostras',
  'Rio de Janeiro', 'Santa Maria Madalena', 'Santo Antonio de Padua', 'Sao Fidelis',
  'Sao Francisco de Itabapoana', 'Sao Goncalo', 'Sao Joao da Barra', 'Sao Joao de Meriti',
  'Sao Jose de Uba', 'Sao Jose do Vale do Rio Preto', 'Sao Pedro da Aldeia',
  'Sao Sebastiao do Alto', 'Sapucaia', 'Saquarema', 'Seropedica', 'Silva Jardim', 'Sumidouro',
  'Tangua', 'Teresopolis', 'Trajano de Moraes', 'Tres Rios', 'Valenca', 'Varre-Sai', 'Vassouras',
  'Volta Redonda'
];

// ======= Municipios ES =======
export const MUNICIPIOS_ES = ["Agua Doce do Norte", "Aguia Branca", "Alegre", "Alfredo Chaves", "Alto Rio Novo", "Anchieta", "Apiaca", "Aracruz", "Atilio Vivacqua", "Baixo Guandu", "Barra de Sao Francisco", "Boa Esperanca", "Bom Jesus do Norte", "Brejetuba", "Cachoeiro de Itapemirim", "Cariacica", "Castelo", "Colatina", "Conceicao da Barra", "Conceicao do Castelo", "Divino de Sao Lourenco", "Domingos Martins", "Dores do Rio Preto", "Ecoporanga", "Fundao", "Governador Lindenberg", "Guacui", "Guarapari", "Ibatiba", "Ibiracu", "Ibitirama", "Iconha", "Irupi", "Itaguacu", "Itapemirim", "Itarana", "Iuna", "Jaguare", "Jeronimo Monteiro", "Joao Neiva", "Laranja da Terra", "Linhares", "Mantenopolis", "Marataizes", "Marechal Floriano", "Marilandia", "Mimoso do Sul", "Montanha", "Mucurici", "Muniz Freire", "Muqui", "Nova Venecia", "Pancas", "Pedro Canario", "Pinheiros", "Piuma", "Ponto Belo", "Presidente Kennedy", "Rio Bananal", "Rio Novo do Sul", "Santa Leopoldina", "Santa Maria de Jetiba", "Santa Teresa", "Sao Domingos do Norte", "Sao Gabriel da Palha", "Sao Jose do Calcado", "Sao Mateus", "Sao Roque do Canaa", "Serra", "Sooretama", "Vargem Alta", "Venda Nova do Imigrante", "Viana", "Vila Pavao", "Vila Valerio", "Vila Velha", "Vitoria"];

// ======= Municipios MG =======
export const MUNICIPIOS_MG = [];

// Larguras específicas
export const CNPJ_W = { width: '130px' }; // cnpj
export const INSC_W = { width: '80px' }; // insc_estadual
export const CEP_W = { width: '80px' }; // cep
export const FILIAL_W = { width: '100px' }; // filial
export const TEL_W = { width: '100px' }; // telefone
export const ESTADO_W = { width: '60px' }; // select de estado

// Opções de ocorrência PSL (conforme solicitado)
export const OCORRENCIA_PSL = [
  'Apos 19h',
  'Sem Loc',
  'Loc Dia Atendimento',
  '400 km',
  'Emergencia',
  'Pedido Domingo',
];

