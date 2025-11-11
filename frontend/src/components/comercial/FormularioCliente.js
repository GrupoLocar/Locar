import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  camposCliente, labelsCliente, limites,
  normalizarInput, validarEmail
} from '../../utils/FormUtilsComercial';
import { getInputStyle } from '../../utils/InputStyles'; // Larguras: cnpj, insc_estadual, telefone, cep, estado, etc.
import { onlyDigits, buscarCepFormatado } from '../../utils/buscacep'; // CEP + autofill (endereco, cidade, bairro, estado sem acentos)
import './FormularioCliente.css';

const CODIGO_W = { width: '160px' };

// Mantém a mesma ordem usada no backend / demais trechos
const ALL_FIELDS_ORDERED = [
  'codigo_cliente', 'cliente', 'razao_social', 'cnpj', 'insc_estadual', 'responsavel', 'cargo', 'telefone',
  'email', 'endereco', 'complemento', 'cidade', 'bairro', 'estado', 'cep', 'observacao',
];

// Estado “vazio” com todas as chaves
const EMPTY_DATA = ALL_FIELDS_ORDERED.reduce((acc, k) => {
  acc[k] = '';
  return acc;
}, {});
EMPTY_DATA.estado = '';

// Normalização completa (preserva _id se existir)
const normalizeAll = (data) => {
  const out = ALL_FIELDS_ORDERED.reduce((acc, k) => {
    acc[k] = normalizarInput(k, data?.[k] ?? '');
    return acc;
  }, {});
  if (data && data._id) out._id = data._id;
  return out;
};

// Formata CEP: "00.000-000" (aceita parcial enquanto digita)
const formatCepMask = (digits) => {
  const d = onlyDigits(digits).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}-${d.slice(5)}`;
};

const FormularioCliente = forwardRef((
  {
    cliente = {},
    onSalvar,
    onNovo,
    getNextCodigoCliente
  },
  ref
) => {
  const [dados, setDados] = useState(EMPTY_DATA);
  const refs = useRef({});
  const clienteRef = useRef(null);
  const formularioRef = useRef(null);

  useImperativeHandle(ref, () => ({
    dispararNovo: (seed) => handleNovo({ notifyParent: false, seed })
  }));

  useEffect(() => {
    if (cliente && Object.keys(cliente).length) {
      const merged = { ...EMPTY_DATA, ...cliente };
      const norm = normalizeAll(merged);
      norm._id = cliente._id || merged._id;
      if (!norm.estado) norm.estado = '';
      setDados(norm);
      setTimeout(() => {
        formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        clienteRef.current?.focus();
      }, 50);
    } else {
      setDados({ ...EMPTY_DATA, estado: '' });
    }
  }, [cliente]);

  // Consulta CEP (quando tiver 8 dígitos) e preenche endereço/bairro/cidade/estado (sem acentos/ç).
  // Após o preenchimento, garantimos o CEP formatado em "00.000-000".
  const preencherPorCep = async (cepInput) => {
    const raw = onlyDigits(cepInput);
    if (raw.length !== 8) return;

    try {
      const { endereco, bairro, cidade, estado, cep } = await buscarCepFormatado(raw);
      const cepFormatado = formatCepMask(cep || raw); // <-- garante a máscara correta
      setDados(prev => ({
        ...prev,
        endereco: endereco || prev.endereco,
        bairro:   bairro   || prev.bairro,
        cidade:   cidade   || prev.cidade,
        estado:   estado   || prev.estado,
        cep:      cepFormatado
      }));
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Grupo Locar',
        text: `Não foi possível consultar o CEP: ${err?.message || err}`,
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'cep') {
      // Mantém máscara "00.000-000"
      const digits = onlyDigits(value).slice(0, 8);
      const masked = formatCepMask(digits);
      setDados(prev => ({ ...prev, cep: masked }));

      // Quando completar 8 dígitos, consulta e preenche automaticamente
      if (digits.length === 8) preencherPorCep(digits);
      return;
    }

    if (name === 'estado') {
      // Força 2 letras maiúsculas; largura virá de getInputStyle('estado')
      value = String(value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
      setDados(prev => ({ ...prev, estado: value }));
      return;
    }

    const v = normalizarInput(name, value);
    setDados(prev => ({ ...prev, [name]: v }));
  };

  const handleNovo = async ({ notifyParent = true, seed } = {}) => {
    let nextCodigo = seed?.codigo_cliente || '';
    if (!nextCodigo && typeof getNextCodigoCliente === 'function') {
      try {
        nextCodigo = await Promise.resolve(getNextCodigoCliente());
      } catch {
        nextCodigo = '';
      }
    }

    setDados({ ...EMPTY_DATA, estado: '', codigo_cliente: nextCodigo });
    setTimeout(() => {
      formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      clienteRef.current?.focus();
    }, 100);

    if (notifyParent) onNovo?.();
  };

  const salvar = async () => {
    if (!dados.codigo_cliente || !String(dados.codigo_cliente).trim()) {
      refs.current['codigo_cliente']?.focus?.();
      Swal.fire({
        title: 'Grupo Locar',
        text: 'Código Cliente não informado.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
      return;
    }

    const obrigatorios = [
      'cliente', 'razao_social', 'cnpj',
      'responsavel', 'cargo', 'telefone', 'email',
      'endereco', 'complemento', 'cidade', 'bairro', 'estado', 'cep'
    ];

    const dadosNorm = normalizeAll({ ...dados, _id: dados._id });

    for (const campo of obrigatorios) {
      if (!dadosNorm[campo]) {
        refs.current[campo]?.focus?.();
        Swal.fire({
          title: 'Grupo Locar',
          text: `Preencha o campo obrigatório: ${labelsCliente[campo] || campo}`,
          icon: 'info',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    if (!validarEmail(dadosNorm.email)) {
      refs.current.email?.focus?.();
      Swal.fire({ title: 'Grupo Locar', text: 'Informe um e-mail válido.', icon: 'info', confirmButtonText: 'OK' });
      return;
    }

    try {
      const idAtual = dados._id || dadosNorm._id;
      const metodo = idAtual ? 'put' : 'post';
      const url = idAtual
        ? `${process.env.REACT_APP_API_URL}/api/clientes/${idAtual}`
        : `${process.env.REACT_APP_API_URL}/api/clientes`;

      const payloadOut = ALL_FIELDS_ORDERED.reduce((acc, k) => {
        acc[k] = dadosNorm[k] ?? '';
        return acc;
      }, {});

      const res = await fetch(url, {
        method: metodo.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadOut)
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = String(payload?.erro || payload?.message || '').toLowerCase();
        if (msg.includes('codigo_cliente') && msg.includes('required')) {
          throw new Error('Código Cliente não informado.');
        }
        throw new Error(payload?.erro || 'Erro ao salvar cliente');
      }

      Swal
        .fire({ title: 'Grupo Locar', text: 'Dados salvos com sucesso.', icon: 'success', confirmButtonText: 'OK' })
        .then(() => handleNovo());
      onSalvar?.(payload);
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Erro', text: err.message || 'Erro ao salvar cliente', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  return (
    <>
      <form ref={formularioRef}>
        <fieldset className="secao">
          <legend>Dados do Cliente</legend>

          <div className="grid-container">
            {[...new Set(['codigo_cliente', ...camposCliente])]
              .filter(c => c !== 'filial' && c !== 'distrital')
              .map((campo) => (
                <div key={campo} className="campo">
                  <label htmlFor={campo}>
                    {campo === 'codigo_cliente' ? 'Código do Cliente' : (labelsCliente[campo] || campo)}
                  </label>

                  {campo === 'codigo_cliente' ? (
                    <input
                      ref={(el) => (refs.current[campo] = el)}
                      name="codigo_cliente"
                      value={dados.codigo_cliente || ''}
                      readOnly
                      disabled
                      style={{ ...CODIGO_W, background: '#f5f5f5' }}
                      title="Gerado automaticamente (não editável)"
                    />
                  ) : campo === 'observacao' ? (
                    <textarea
                      ref={(el) => (refs.current[campo] = el)}
                      name={campo}
                      value={dados[campo]}
                      maxLength={limites[campo]}
                      rows={3}
                      onChange={handleChange}
                      style={getInputStyle(campo)}
                    />
                  ) : (
                    <input
                      ref={campo === 'cliente' ? clienteRef : (el) => (refs.current[campo] = el)}
                      type={campo === 'email' ? 'email' : 'text'}
                      name={campo}
                      value={campo === 'cep' ? (dados.cep || '') : dados[campo]}
                      maxLength={campo === 'estado' ? 2 : limites[campo]}
                      style={getInputStyle(campo)}   // <- larguras vindas de InputStyles.js
                      onChange={handleChange}
                      placeholder={
                        campo === 'estado' ? 'UF'
                        : campo === 'cep' ? '00.000-000'
                        : undefined
                      }
                    />
                  )}
                </div>
              ))}
          </div>
        </fieldset>

        <div className="botoes">
          <button type="button" className="btnSalvar" onClick={salvar}>Salvar</button>
          <button type="button" className="btnNovo" onClick={() => handleNovo()}>Novo</button>
        </div>
      </form>
    </>
  );
});

export default FormularioCliente;
