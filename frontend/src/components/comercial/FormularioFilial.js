import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './FormularioFilial.css';
import Swal from 'sweetalert2';
import {
  limites, normalizarInput, validarEmail,
  removerAcentosECedilha
} from '../../utils/FormUtilsComercial';
import { getInputStyle } from '../../utils/InputStyles';
import { buscarCepFormatado, onlyDigits } from '../../utils/buscacep';

const CAMPOS = [
  'cliente', 'filial', 'distrital', 'razao_social', 'cnpj', 'insc_estadual',
  'responsavel', 'cargo', 'telefone', 'email', 'endereco', 'complemento',
  'cidade', 'bairro', 'estado', 'cep', 'observacao'
];

const OPCIONAIS = new Set(['insc_estadual', 'observacao']);

const blank = () => ({
  cliente: '', filial: '', distrital: '', razao_social: '', cnpj: '', insc_estadual: '',
  responsavel: '', cargo: '', telefone: '', email: '',
  endereco: '', complemento: '', cidade: '', bairro: '', estado: '', cep: '', observacao: ''
});

// CEP -> "00.000-000"
const maskCEP = (v = '') => {
  const s = onlyDigits(v).slice(0, 8);
  if (s.length <= 2) return s;
  if (s.length <= 5) return `${s.slice(0, 2)}.${s.slice(2)}`;
  return `${s.slice(0, 2)}.${s.slice(2, 5)}-${s.slice(5)}`;
};

const FormularioFilial = forwardRef(({ filial = {}, onSalvar, onNovo }, ref) => {
  const [dados, setDados] = useState(blank());
  const refs = useRef({});
  const ancoraDadosRef = useRef(null);

  const scrollAteDados = () => ancoraDadosRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollTopo = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // clientes (select)
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const url = `${process.env.REACT_APP_API_URL}/api/clientes`;
        const resp = await fetch(url);
        const out = await resp.json();
        const nomes = (Array.isArray(out) ? out : [])
          .map(c => String(c?.cliente || '').trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
        setClientes(nomes);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (filial && Object.keys(filial).length) {
      const merged = { ...blank(), ...filial };
      setDados(merged);
      setTimeout(() => {
        scrollAteDados();
        refs.current['cliente']?.focus?.();
      }, 50);
    } else {
      setDados(blank());
    }
  }, [filial]);

  useImperativeHandle(ref, () => ({
    dispararNovo: () => handleNovo(false),
    limparEIrTopo: () => limparEIrTopo()
  }));

  const handleNovo = (notify = true) => {
    setDados(blank());
    setTimeout(() => {
      scrollAteDados();
      refs.current['cliente']?.focus?.();
    }, 80);
    if (notify) onNovo?.();
  };

  const limparEIrTopo = () => {
    setDados(blank());
    setTimeout(() => scrollTopo(), 80);
  };

  const labels = {
    cliente: 'Cliente',
    filial: 'Filial',
    distrital: 'Distrital',
    razao_social: 'Razão Social',
    cnpj: 'CNPJ',
    insc_estadual: 'Inscrição Estadual',
    responsavel: 'Responsável',
    cargo: 'Cargo',
    telefone: 'Telefone',
    email: 'E-mail',
    endereco: 'Endereço',
    complemento: 'Complemento',
    cidade: 'Cidade',
    bairro: 'Bairro',
    estado: 'Estado (UF)',
    cep: 'CEP',
    observacao: 'Observação'
  };

  // estilos: usa InputStyles para cnpj, insc_estadual, telefone, estado, cep
  const styleFor = (campo) => {
    const viaConfig = new Set(['cnpj', 'insc_estadual', 'telefone', 'estado', 'cep', 'filial']);
    if (viaConfig.has(campo)) return getInputStyle(campo);
    return undefined;
  };

  const str = (v) => (v === null || v === undefined) ? '' : String(v);

  const validar = () => {
    for (const c of CAMPOS) {
      if (OPCIONAIS.has(c)) continue;
      const v = str(dados[c]).trim();
      if (!v) {
        refs.current[c]?.focus?.();
        Swal.fire('Grupo Locar', `Preencha o campo obrigatório: ${labels[c]}`, 'info');
        return false;
      }
    }
    const digCNPJ = str(dados.cnpj).replace(/\D/g, '');
    if (digCNPJ.length !== 14) { refs.current.cnpj?.focus?.(); Swal.fire('Grupo Locar', 'CNPJ deve conter 14 dígitos.', 'info'); return false; }
    const digCEP = onlyDigits(dados.cep);
    if (digCEP.length !== 8) { refs.current.cep?.focus?.(); Swal.fire('Grupo Locar', 'CEP deve conter 8 dígitos.', 'info'); return false; }
    const digTel = str(dados.telefone).replace(/\D/g, '');
    if (!(digTel.length === 10 || digTel.length === 11)) { refs.current.telefone?.focus?.(); Swal.fire('Grupo Locar', 'Telefone deve conter 10 ou 11 dígitos.', 'info'); return false; }
    if (!validarEmail(str(dados.email))) { refs.current.email?.focus?.(); Swal.fire('Grupo Locar', 'Informe um e-mail válido.', 'info'); return false; }
    if (str(dados.estado).length !== 2) { refs.current.estado?.focus?.(); Swal.fire('Grupo Locar', 'Estado deve ter 2 letras (UF).', 'info'); return false; }
    return true;
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // campos controlados diretamente para aceitar retorno do buscacep
    if (name === 'estado') {
      const uf = removerAcentosECedilha(value).replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
      return setDados(prev => ({ ...prev, estado: uf }));
    }
    if (name === 'cidade') {
      const txt = removerAcentosECedilha(value).replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ').trim();
      const title = txt.toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
      return setDados(prev => ({ ...prev, cidade: title }));
    }
    if (name === 'cep') {
      const masked = maskCEP(value);
      const digits = onlyDigits(masked);
      setDados(prev => ({ ...prev, cep: masked }));
      if (digits.length === 8) {
        try {
          const info = await buscarCepFormatado(digits);
          setDados(prev => ({
            ...prev,
            cep: maskCEP(info.cep),
            endereco: info.endereco,
            bairro: info.bairro,
            cidade: info.cidade,
            estado: info.estado
          }));
        } catch (err) {
          // mantém apenas máscara; usuário pode completar manualmente
          console.warn('CEP lookup:', err?.message || err);
        }
      }
      return;
    }

    if (name === 'cliente') {
      return setDados(prev => ({ ...prev, cliente: value }));
    }

    const v = normalizarInput(name, value);
    setDados(prev => ({ ...prev, [name]: v }));
  };

  const salvar = async () => {
    if (!validar()) return;

    const isEdit = Boolean(dados._id);
    const url = isEdit
      ? `${process.env.REACT_APP_API_URL}/api/filiais/${dados._id}`
      : `${process.env.REACT_APP_API_URL}/api/filiais`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      const out = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(out?.erro || 'Falha ao salvar filial');

      Swal.fire('Grupo Locar', 'Dados salvos com sucesso.', 'success').then(() => {
        // limpa e notifica pai -> Tabela atualiza automaticamente
        setDados(blank());
        onSalvar?.(out);
        scrollTopo();
      });
    } catch (e) {
      console.error(e);
      Swal.fire('Erro', e.message || 'Falha ao salvar filial', 'error');
    }
  };

  return (
    <form className="form-filial">
      <div ref={ancoraDadosRef}></div>
      <fieldset className="secao">
        <legend>Dados da Filial</legend>

        <div className="grid">
          {CAMPOS.map((campo) => {
            const isTextArea = campo === 'observacao';

            if (campo === 'cliente') {
              return (
                <div className="campo" key={campo}>
                  <label htmlFor={campo}>{labels[campo]}</label>
                  <select
                    name={campo}
                    id={campo}
                    value={dados[campo]}
                    onChange={handleChange}
                    ref={(el) => (refs.current[campo] = el)}
                    required
                    style={{ minWidth: 220 }}
                  >
                    <option value="">Selecione</option>
                    {clientes.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              );
            }

            if (campo === 'cidade' || campo === 'estado') {
              return (
                <div className="campo" key={campo}>
                  <label htmlFor={campo}>{labels[campo]}</label>
                  <input
                    type="text"
                    name={campo}
                    id={campo}
                    value={dados[campo] || ''}
                    onChange={handleChange}
                    ref={(el) => (refs.current[campo] = el)}
                    required={!OPCIONAIS.has(campo)}
                    style={styleFor(campo)}
                    maxLength={campo === 'estado' ? 2 : 70}
                  />
                </div>
              );
            }

            if (isTextArea) {
              return (
                <div className="campo" key={campo}>
                  <label htmlFor={campo}>{labels[campo]}</label>
                  <textarea
                    name={campo}
                    value={dados[campo] || ''}
                    onChange={handleChange}
                    rows={4}
                    maxLength={limites[campo]}
                    ref={(el) => (refs.current[campo] = el)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              );
            }

            return (
              <div className="campo" key={campo}>
                <label htmlFor={campo}>{labels[campo]}</label>
                <input
                  type="text"
                  name={campo}
                  value={dados[campo] || ''}
                  onChange={handleChange}
                  maxLength={limites[campo]}
                  ref={(el) => (refs.current[campo] = el)}
                  placeholder={
                    campo === 'email'
                      ? 'nome@empresa.com'
                      : campo === 'cep'
                        ? '00.000-000'
                        : ''
                  }
                  style={styleFor(campo)}
                />

              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="botoes">
        <button type="button" className="btnSalvar" onClick={salvar}>Salvar</button>
        <button type="button" className="btnNovo" onClick={() => handleNovo(true)}>Novo</button>
      </div>
    </form>
  );
});

export default FormularioFilial;
