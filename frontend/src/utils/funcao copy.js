// Funções simples de formatação de datas, CPF,rg,cep,cnh/remoção de máscara:
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '').slice(0, 11);
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatRG = (rg) => {
  const numeric = rg.replace(/\D/g, '').slice(0, 9);
  if (numeric.length <= 2) return numeric;
  if (numeric.length <= 5) return `${numeric.slice(0, 2)}.${numeric.slice(2)}`;
  if (numeric.length <= 8) return `${numeric.slice(0, 2)}.${numeric.slice(2, 5)}.${numeric.slice(5)}`;
  return `${numeric.slice(0, 2)}.${numeric.slice(2, 5)}.${numeric.slice(5, 8)}-${numeric.slice(8)}`;
};

export const formatTelefone = (tel) => {
  if (!tel) return '';
  const cleaned = tel.replace(/\D/g, '').slice(0, 11);
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1)$2-$3');
};

export const formatCEP = (cep) => {
  const numeric = cep.replace(/\D/g, '');
  if (numeric.length <= 2) return numeric;
  if (numeric.length <= 5) return `${numeric.slice(0, 2)}.${numeric.slice(2)}`;
  return `${numeric.slice(0, 2)}.${numeric.slice(2, 5)}-${numeric.slice(5, 8)}`;
};

export const formatCNH = (cnh) => {
  return cnh.replace(/\D/g, '').slice(0, 11);
};

// Converte "2025-07-01T00:00:00.000Z" para "dd-mm-aaaa"
export const formatDateToDDMMYYYY = (valor) => {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d)) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}-${mes}-${ano}`;
};

// Converte "dd-mm-aaaa" para "aaaa-mm-dd"
export const convertToDateOnly = (valor) => {
  if (!valor) return '';
  const [dia, mes, ano] = valor.split('-');
  return `${ano}-${mes}-${dia}`;
};

// === Converte qualquer coisa em "yyyy-mm-dd" ===
export const formatDateInput = (valor) => {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
};

export function formatDateISO(data) {
  if (!data) return null;
  const partes = data.split("-");
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  const dateObj = new Date(`${ano}-${mes}-${dia}T00:00:00Z`);
  return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
}

export function formatToYYYYMMDD(data) {
  if (!data) return null;
  const partes = data.split("-");
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  return `${ano}-${mes}-${dia}`;
}

export function formatLocalDateTime(dateInput) {
  const date = new Date(dateInput || Date.now());

  if (isNaN(date.getTime())) {
    console.error("Data inválida em formatLocalDateTime:", dateInput);
    return null;
  }

  const pad = (n) => (n < 10 ? "0" + n : n);
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// Converte "dd-mm-aaaa" => "aaaa-mm-dd"
export function formatToISODateOnly(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const [dd, mm, yyyy] = dateStr.split("-");
  return `${yyyy}-${mm}-${dd}`;
}

export const removerAcentos = (texto) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C");
};

export const capitalizarTexto = (texto) => {
  if (!texto) return '';
  return removerAcentos(texto.toLowerCase()).replace(/(^\w|\s\w)/g, l => l.toUpperCase());
};

export const capitalizarNomeProprio = (texto) => {
  if (!texto) return '';
  return removerAcentos(texto.toLowerCase())
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
};

