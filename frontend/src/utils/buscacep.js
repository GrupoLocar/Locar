// \frontend\src\utils\buscacep.js

// Mantém apenas números
export function onlyDigits(s) {
    return String(s || '').replace(/\D/g, '');
  }
  
  // CEP válido: 8 dígitos
  export function isValidCep(s) {
    return onlyDigits(s).length === 8;
  }
  
  // Remove acentos e troca ç/Ç -> c/C
  export function removeDiacritics(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
  }
  
  // Title Case básico
  export function toTitle(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/\b(\p{L})(\p{L}*)/gu, (_, a, b) => a.toUpperCase() + b);
  }
  
  // Chama ViaCEP no browser
  export async function fetchViaCep(cep) {
    const pure = onlyDigits(cep).slice(0, 8);
    if (!isValidCep(pure)) throw new Error('CEP inválido');
  
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
  
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${pure}/json/`, { signal: ctrl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data?.erro) throw new Error('CEP não encontrado');
  
      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: (data.uf || '').toUpperCase(),
        cep: data.cep || pure,
        service: 'viacep'
      };
    } finally {
      clearTimeout(timer);
    }
  }
  
  /**
   * Busca CEP e retorna campos normalizados:
   * - endereco/bairro/cidade em Title Case, porém SEM acentos e SEM ç
   * - estado em 2 letras maiúsculas
   * - cep apenas dígitos (8)
   */
  export async function buscarCepFormatado(cep) {
    const result = await fetchViaCep(cep);
  
    const endereco = removeDiacritics(toTitle(result.street));
    const bairro   = removeDiacritics(toTitle(result.neighborhood));
    const cidade   = removeDiacritics(toTitle(result.city));
    const estado   = removeDiacritics(String(result.state || '').toUpperCase()).slice(0, 2);
  
    return {
      endereco,
      bairro,
      cidade,
      estado,
      cep: onlyDigits(result.cep).slice(0, 8)
    };
  }
  