// src/components/comercial/FormularioFornecedor.js
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import '../../components/FormularioFuncionario.css'; // mantém o estilo base atual
import './FormularioFornecedor.css';                 // centralização/ajustes do form/fieldset
import Swal from 'sweetalert2';
import {
  limitesFornecedor,
  formatCNPJ,
  formatInscEstadual,
  formatTelefone,
  removerAcentosECedilha,
  normalizarTextoCapitalizado,
  validarEmailBasico,
} from '../../utils/FormUtilsComercial';
import { selects } from '../../utils/FormUtils'; // opcoesBanco
import { getInputStyle } from '../../utils/InputStyles'; // ⬅️ AJUSTE: usa getInputStyle
import { buscarCepFormatado } from '../../utils/buscacep';

const CAMPOS_ORDEM = [
  'codigo_fornecedor', 'tipoFornecedor', 'razao_social', 'cnpj', 'insc_estadual',
  'responsavel', 'cargo', 'telefone', 'email', 'endereco', 'complemento', 'cidade',
  'bairro', 'estado', 'cep', 'banco', 'agencia', 'conta', 'pix', 'observacao'
];

const OPCIONAIS = new Set(['insc_estadual', 'complemento', 'observacao', 'banco', 'agencia', 'conta', 'pix']);

const str = (v) => (v === null || v === undefined) ? '' : String(v);
const CODIGO_FORN_W = { width: '160px' };
const LIM_EXTRA = { banco: 60, agencia: 10, conta: 25, pix: 35 };

const formatCEPMask = (v = '') => {
  const s = String(v || '').replace(/\D/g, '').slice(0, 8);
  if (s.length <= 5) return s.replace(/^(\d{2})(\d)/, '$1.$2');
  return s
    .replace(/^(\d{2})(\d{3})(\d{0,3}).*/, (_, a, b, c) => `${a}.${b}${c ? '-' + c : ''}`);
};

const blankFornecedor = (seedCodigo = '') => ({
  codigo_fornecedor: seedCodigo || '',
  tipoFornecedor: '',
  razao_social: '',
  cnpj: '',
  insc_estadual: '',
  responsavel: '',
  cargo: '',
  telefone: '',
  email: '',
  endereco: '',
  complemento: '',
  cidade: '',
  bairro: '',
  estado: '',
  cep: '',
  banco: '',
  agencia: '',
  conta: '',
  pix: '',
  observacao: ''
});

const FormularioFornecedor = forwardRef((
  { fornecedor = {}, onSalvar, onNovo, getNextCodigoFornecedor },
  ref
) => {
  const formRef = useRef(null);
  const fornecedorRef = useRef(null);
  const DadosfornecedorRef = useRef(null);
  const refs = useRef({});

  const [dados, setDados] = useState(blankFornecedor());
  const [opcoesTipoFornecedor, setOpcoesTipoFornecedor] = useState([]);

  // Modal: Gerenciar Tipos de Fornecedor
  const [showModalTipo, setShowModalTipo] = useState(false);
  const [modalLista, setModalLista] = useState([]);
  const [modalItem, setModalItem] = useState({ _id: null, tipoFornecedor: '' });
  const modalTipoInputRef = useRef(null);

  const scrollTopo = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollAteDadosFornecedor = () => DadosfornecedorRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Carrega valores da coleção tipoFornecedor
  const carregarTiposFornecedor = async () => {
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_URL}/api/tipoFornecedor`);
      const out = await resp.json();
      const arr = Array.isArray(out) ? out : [];
      const nomes = arr
        .map(r => str(r.tipoFornecedor))
        .filter(Boolean)
        .map(v => normalizarTextoCapitalizado(v));
      const unique = Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
      setOpcoesTipoFornecedor(unique);
      setModalLista(arr);
    } catch (e) {
      console.error(e);
      setOpcoesTipoFornecedor([]);
      setModalLista([]);
    }
  };

  useEffect(() => {
    carregarTiposFornecedor();
  }, []);

  useImperativeHandle(ref, () => ({
    dispararNovo: ({ seed } = {}) => handleNovo({ notifyParent: false, seed }),
    limparEIrTopo: async () => limparEIrTopo()
  }));

  useEffect(() => {
    if (fornecedor && Object.keys(fornecedor).length) {
      const merged = { ...blankFornecedor(), ...fornecedor };
      setDados(merged);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        refs.current.tipoFornecedor?.focus?.();
      }, 50);
    } else {
      setDados(blankFornecedor());
    }
  }, [fornecedor]);

  const limparCampos = (seedCodigo = '') => setDados(blankFornecedor(seedCodigo));

  const limparEIrFormulario = (seedCodigo = '') => {
    limparCampos(seedCodigo);
    setTimeout(() => {
      scrollAteDadosFornecedor();
      refs.current.tipoFornecedor?.focus?.();
    }, 100);
  };

  const limparEIrTopo = async () => {
    let nextCodigo = '';
    if (typeof getNextCodigoFornecedor === 'function') {
      try { nextCodigo = await Promise.resolve(getNextCodigoFornecedor()); } catch { nextCodigo = ''; }
    }
    limparCampos(nextCodigo);
    setTimeout(() => { scrollTopo(); }, 100);
  };

  const handleNovo = async ({ notifyParent = true, seed } = {}) => {
    let nextCodigo = seed?.codigo_fornecedor || '';
    if (!nextCodigo && typeof getNextCodigoFornecedor === 'function') {
      try {
        nextCodigo = await Promise.resolve(getNextCodigoFornecedor());
      } catch { nextCodigo = ''; }
    }
    limparEIrFormulario(nextCodigo);
    if (notifyParent) onNovo?.();
  };

  const handleChange = async (e) => {
    const { name } = e.target;
    const raw = e.target.value ?? '';
    let value = raw;

    if (name === 'codigo_fornecedor') return;

    const isSelectLike = ['banco', 'tipoFornecedor'].includes(name);
    if (!isSelectLike) value = removerAcentosECedilha(value);

    switch (name) {
      case 'cnpj':
        value = formatCNPJ(value).slice(0, limitesFornecedor.cnpj);
        break;
      case 'insc_estadual':
        value = formatInscEstadual(value).slice(0, limitesFornecedor.insc_estadual);
        break;
      case 'telefone':
        value = formatTelefone(value).slice(0, limitesFornecedor.telefone);
        break;
      case 'cep': {
        const so = String(raw || '').replace(/\D/g, '').slice(0, 8);
        value = formatCEPMask(so);
        if (so.length === 8) {
          try {
            const { endereco, bairro, cidade, estado, cep } = await buscarCepFormatado(so);
            setDados(prev => ({
              ...prev,
              endereco,
              bairro,
              cidade,
              estado,
              cep: formatCEPMask(cep)
            }));
          } catch (err) {
            console.warn('Falha ao buscar CEP:', err?.message || err);
          }
        }
        break;
      }
      case 'email':
        value = value.toLowerCase().slice(0, limitesFornecedor.email);
        break;
      case 'estado':
        value = String(raw).replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
        break;
      case 'cidade':
        value = normalizarTextoCapitalizado(String(raw)).slice(0, limitesFornecedor.cidade);
        break;
      case 'tipoFornecedor':
        value = normalizarTextoCapitalizado(raw).slice(0, 100);
        break;
      case 'banco':
        value = String(raw).slice(0, LIM_EXTRA.banco);
        break;
      case 'agencia':
        value = String(raw).replace(/\D/g, '').slice(0, LIM_EXTRA.agencia);
        break;
      case 'conta':
        value = String(removerAcentosECedilha(raw)).replace(/[^A-Za-z0-9.-]/g, '').slice(0, LIM_EXTRA.conta);
        break;
      case 'pix':
        value = String(removerAcentosECedilha(raw)).slice(0, LIM_EXTRA.pix);
        break;
      case 'razao_social':
      case 'responsavel':
      case 'cargo':
      case 'bairro':
        value = value.replace(/[^A-Za-z\s]/g, '');
        value = normalizarTextoCapitalizado(value).slice(0, limitesFornecedor[name]);
        break;
      case 'endereco':
      case 'complemento':
      case 'observacao':
        value = value.replace(/[^A-Za-z0-9\s]/g, '');
        value = normalizarTextoCapitalizado(value).slice(0, limitesFornecedor[name]);
        break;
      default:
        value = normalizarTextoCapitalizado(value).slice(0, limitesFornecedor[name] || 100);
        break;
    }
    setDados((prev) => ({ ...prev, [name]: value }));
  };

  const labelsFornecedor = {
    codigo_fornecedor: 'Código do Fornecedor',
    tipoFornecedor: 'Tipo de Fornecedor',
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
    banco: 'Banco',
    agencia: 'Agência',
    conta: 'Conta',
    pix: 'PIX',
    observacao: 'Observação'
  };

  const validarObrigatorios = () => {
    for (const campo of CAMPOS_ORDEM) {
      if (OPCIONAIS.has(campo)) continue;
      if (campo === 'codigo_fornecedor') continue; // gerado
      const v = str(dados[campo]).trim();
      if (!v) {
        refs.current[campo]?.focus?.();
        Swal.fire({ title: 'Grupo Locar', text: `Preencha o campo obrigatório: ${labelsFornecedor[campo]}`, icon: 'info' });
        return false;
      }
    }
    if (str(dados.codigo_fornecedor).trim() && !/^FORN-\d{10}$/.test(dados.codigo_fornecedor)) {
      refs.current.codigo_fornecedor?.focus?.();
      Swal.fire({ title: 'Grupo Locar', text: 'Código do Fornecedor deve seguir o formato FORN-0000000001 (10 dígitos).', icon: 'info' });
      return false;
    }
    const digitosCNPJ = str(dados.cnpj).replace(/\D/g, '');
    if (digitosCNPJ.length !== 14) {
      refs.current.cnpj?.focus?.();
      Swal.fire({ title: 'Grupo Locar', text: 'CNPJ deve conter 14 dígitos.', icon: 'info' });
      return false;
    }
    const digitosCEP = str(dados.cep).replace(/\D/g, '');
    if (digitosCEP.length !== 8) {
      refs.current.cep?.focus?.();
      Swal.fire({ title: 'Grupo Locar', text: 'CEP deve conter 8 dígitos.', icon: 'info' });
      return false;
    }
    const digitosTel = str(dados.telefone).replace(/\D/g, '');
    if (digitosTel.length !== 11) {
      refs.current.telefone?.focus?.();
      Swal.fire({ title: 'Grupo Locar', text: 'Telefone deve conter 11 dígitos (DDD+9).', icon: 'info' });
      return false;
    }
    if (!validarEmailBasico(dados.email || '')) {
      refs.current.email?.focus?.();
      Swal.fire({ title: 'Grupo Locar', text: 'Informe um e-mail válido.', icon: 'info' });
      return false;
    }
    if (str(dados.estado).length !== 2) {
      refs.current.estado?.focus?.();
      Swal.fire({ title: 'Grupo Locar', text: 'Estado deve ter 2 letras (UF).', icon: 'info' });
      return false;
    }
    return true;
  };

  const salvar = async () => {
    if (!validarObrigatorios()) return;

    const edicao = Boolean(dados._id);
    const url = edicao
      ? `${process.env.REACT_APP_API_URL}/api/fornecedores/${dados._id}`
      : `${process.env.REACT_APP_API_URL}/api/fornecedores`;
    const metodo = edicao ? 'PUT' : 'POST';

    try {
      let payload = { ...dados };
      if (!str(payload.codigo_fornecedor).trim() && typeof getNextCodigoFornecedor === 'function') {
        try {
          const maybe = await Promise.resolve(getNextCodigoFornecedor());
          if (/^FORN-\d{10}$/.test(maybe)) {
            payload.codigo_fornecedor = maybe;
            setDados(prev => ({ ...prev, codigo_fornecedor: maybe }));
          }
        } catch {}
      }

      const resp = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let out;
      try { out = await resp.json(); } catch { out = {}; }

      if (!resp.ok) {
        const raw = str(out?.message || out?.erro);
        let mensagemAmigavel = raw;
        if (/codigo_fornecedor/i.test(raw) && /(required|valid|validation|match|Path)/i.test(raw)) {
          mensagemAmigavel = 'Código do Fornecedor não foi preenchido.';
        }
        throw new Error(mensagemAmigavel || 'Falha ao salvar fornecedor');
      }

      Swal.fire({ title: 'Grupo Locar', text: 'Dados salvos com sucesso.', icon: 'success' })
        .then(() => {
          limparEIrTopo();
          onSalvar?.(out);
        });

    } catch (e) {
      console.error(e);
      Swal.fire({ title: 'Erro', text: e.message || 'Falha ao salvar fornecedor', icon: 'error' });
    }
  };

  // Largura vinda do InputStyles (com fallback antigo)
  const larguraCampo = (campo) => {
    // tenta pegar do util central
    const styleFromUtil = typeof getInputStyle === 'function' ? getInputStyle(campo) : undefined;
    if (styleFromUtil) return styleFromUtil;

    // fallbacks antigos (mantidos)
    if (campo === 'codigo_fornecedor') return { width: '16ch' };
    if (campo === 'cnpj') return { width: '18ch' };
    if (campo === 'insc_estadual') return { width: '11ch' };
    if (campo === 'telefone') return { width: '14ch' };
    if (campo === 'cep') return { width: '12ch' };
    if (campo === 'estado') return { width: '7ch', minWidth: '7ch' };
    if (campo === 'banco') return { width: '28ch' };
    if (campo === 'bairro') return { width: '40ch' };
    if (campo === 'endereco') return { width: '40ch' };
    if (campo === 'cargo') return { width: '40ch' };
    if (campo === 'agencia') return { width: '12ch' };
    if (campo === 'conta') return { width: '20ch' };
    if (campo === 'pix') return { width: '28ch' };
    if (campo === 'razao_social') return { width: '40ch' };
    return undefined;
  };

  // Modal TipoFornecedor
  const abrirModalTipo = () => {
    setModalItem({ _id: null, tipoFornecedor: '' });
    setShowModalTipo(true);
    setTimeout(() => {
      modalTipoInputRef.current?.focus();
      modalTipoInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const fecharModalTipo = () => setShowModalTipo(false);

  const editarItemModal = (item) => {
    setModalItem({ _id: item._id, tipoFornecedor: item.tipoFornecedor || '' });
    setShowModalTipo(true);
    setTimeout(() => {
      modalTipoInputRef.current?.focus();
      modalTipoInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const salvarItemModal = async () => {
    try {
      const body = { categoria: 'Geral', tipoFornecedor: normalizarTextoCapitalizado(modalItem.tipoFornecedor || '') };
      const isEdit = Boolean(modalItem._id);
      const url = isEdit
        ? `${process.env.REACT_APP_API_URL}/api/tipoFornecedor/${modalItem._id}`
        : `${process.env.REACT_APP_API_URL}/api/tipoFornecedor`;
      const method = isEdit ? 'PUT' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('Falha ao salvar tipoFornecedor');

      await carregarTiposFornecedor();
      fecharModalTipo();
      Swal.fire({ title: 'OK', text: 'Registro salvo.', icon: 'success' });
    } catch (e) {
      console.error(e);
      Swal.fire({ title: 'Erro', text: 'Não foi possível salvar o tipo de fornecedor.', icon: 'error' });
    }
  };

  const novoItemModal = () => {
    setModalItem({ _id: null, tipoFornecedor: '' });
    setTimeout(() => {
      modalTipoInputRef.current?.focus();
      modalTipoInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  };

  return (
    <form ref={formRef}>
      <div ref={DadosfornecedorRef}></div>

      <div className="form-section-wrap">{/* centraliza horizontalmente */}
        <fieldset className="secao">
          <legend>Dados do fornecedor</legend>

          <div className="grid-container">
            {CAMPOS_ORDEM.map((campo) => {
              const isTextArea = campo === 'observacao';

              if (isTextArea) {
                return (
                  <div className="campo" key={campo}>
                    <label htmlFor={campo}>{labelsFornecedor[campo]}</label>
                    <textarea
                      name={campo}
                      value={dados[campo] || ''}
                      onChange={handleChange}
                      rows={4}
                      maxLength={limitesFornecedor[campo] || 100}
                      ref={(el) => (refs.current[campo] = el)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                );
              }

              // tipoFornecedor (select + gerenciar)
              if (campo === 'tipoFornecedor') {
                return (
                  <div className="campo" key={campo}>
                    <label htmlFor={campo}>{labelsFornecedor[campo]}</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        name={campo}
                        id={campo}
                        value={dados[campo] || ''}
                        onChange={handleChange}
                        ref={(el) => (refs.current[campo] = el)}
                        required
                        style={{ minWidth: 220 }}
                      >
                        <option value="">Selecione</option>
                        {opcoesTipoFornecedor.map((op) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="botao"
                        onClick={abrirModalTipo}
                        title="Gerenciar tipos de fornecedor"
                        aria-label="Gerenciar tipos de fornecedor"
                      >
                        🧑‍🔧
                      </button>
                    </div>
                  </div>
                );
              }

              // banco (select de opcoesBanco)
              if (campo === 'banco') {
                return (
                  <div className="campo" key={campo}>
                    <label htmlFor={campo}>{labelsFornecedor[campo]}</label>
                    <select
                      name={campo}
                      id={campo}
                      value={dados[campo] || ''}
                      onChange={handleChange}
                      ref={(el) => (refs.current[campo] = el)}
                      style={larguraCampo('banco')}
                    >
                      <option value="">Selecione</option>
                      {(selects?.opcoesBanco || []).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              // cidade & estado agora são inputs (strings)
              if (campo === 'cidade' || campo === 'estado') {
                return (
                  <div className="campo" key={campo}>
                    <label htmlFor={campo}>{labelsFornecedor[campo]}</label>
                    <input
                      type="text"
                      name={campo}
                      value={dados[campo] || ''}
                      onChange={handleChange}
                      ref={(el) => (refs.current[campo] = el)}
                      required={campo === 'estado' || campo === 'cidade'}
                      style={larguraCampo(campo)}
                      placeholder={campo === 'estado' ? 'UF' : ''}
                      maxLength={campo === 'estado' ? 2 : (limitesFornecedor[campo] || 100)}
                    />
                  </div>
                );
              }

              // Demais campos padrão
              return (
                <div className="campo" key={campo}>
                  <label htmlFor={campo}>{labelsFornecedor[campo]}</label>
                  <input
                    ref={campo === 'fornecedor' ? fornecedorRef : (el) => (refs.current[campo] = el)}
                    type="text"
                    name={campo}
                    value={dados[campo] || ''}
                    onChange={handleChange}
                    maxLength={campo === 'codigo_fornecedor' ? 15 : (limitesFornecedor[campo] || 100)}
                    placeholder={
                      campo === 'codigo_fornecedor'
                        ? 'FORN-0000000000'
                        : campo === 'email'
                          ? 'nome@empresa.com'
                          : campo === 'estado'
                            ? 'UF'
                            : campo === 'cep'
                              ? '00.000-000'
                              : ''
                    }
                    disabled={campo === 'codigo_fornecedor'}
                    readOnly={campo === 'codigo_fornecedor'}
                    style={
                      campo === 'codigo_fornecedor'
                        ? { width: '16ch', ...CODIGO_FORN_W, background: '#f5f5f5' }
                        : larguraCampo(campo)
                    }
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="botoes">
        <button type="button" className="btnSalvar" onClick={salvar}>Salvar</button>
        <button type="button" className="btnNovo" onClick={() => handleNovo()}>Novo</button>
      </div>

      {/* Modal: Gerenciar Tipos de Fornecedor */}
      {showModalTipo && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
          onClick={fecharModalTipo}
        >
          <div
            style={{ background: '#fff', padding: 16, borderRadius: 8, minWidth: 520, maxHeight: '50vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Gerenciar Tipos de Fornecedor</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 30, marginBottom: 30 }}>
              <div>
                <label>Tipo de Fornecedor </label>
                <input
                  ref={modalTipoInputRef}
                  type="text"
                  value={modalItem.tipoFornecedor}
                  onChange={(e) => setModalItem(s => ({ ...s, tipoFornecedor: e.target.value }))}
                  style={{ width: `40ch` }}
                  maxLength={100}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button type="button" className="botao" onClick={salvarItemModal}>Salvar</button>
              <button type="button" className="botao" onClick={novoItemModal} title="Novo tipo de fornecedor">Novo</button>
              <button type="button" className="botao" onClick={fecharModalTipo} style={{ backgroundColor: '#181893', color: '#fff' }}>Fechar</button>
            </div>

            <hr />

            <h4>Registros</h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabela-default" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#efefef' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Tipo de Fornecedor</th>
                    <th style={{ textAlign: 'center', padding: 8 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {modalLista.length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: 12 }}>Sem registros</td></tr>
                  ) : modalLista.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>{normalizarTextoCapitalizado(r.tipoFornecedor || '')}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        <button className="botao" onClick={() => editarItemModal(r)}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </form>
  );
});

export default FormularioFornecedor;
