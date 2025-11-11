import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CadastroPedidosPSL.css';
import axios from 'axios';
import FormularioPedidosPSL from '../../components/comercial/FormularioPedidosPSL';
import TabelaPedidosPSL from '../../components/comercial/TabelaPedidosPSL';
import { OCORRENCIA_PSL } from '../../utils/FormUtilsComercial';

// ==== Base API (mesma estratégia usada em Filiais) ====
const RAW = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
const API_ROOT = RAW || '';
const API = `${API_ROOT}${/\/api$/.test(API_ROOT) ? '' : '/api'}`;

// util
const stripAccents = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/gi, 'c');
const firstUpperRestLower = (s = '') =>
  s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

export default function CadastroPedidosPSL() {
  const [itens, setItens] = useState([]);
  const [filiaisBase, setFiliaisBase] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [pslSelecionado, setPslSelecionado] = useState(null);

  // filtros
  const [dataDe, setDataDe] = useState('');
  const [dataAte, setDataAte] = useState('');
  const [filialFiltro, setFilialFiltro] = useState('Todos');
  const [distritalFiltro, setDistritalFiltro] = useState('Todos');
  const [ocorrenciaFiltro, setOcorrenciaFiltro] = useState('Todos');

  const formularioRef = useRef(null);

  // === opções de ocorrência (label para exibição, value normalizado p/ filtro & banco)
  const ocorrenciaOptions = useMemo(() => {
    return [...OCORRENCIA_PSL]
      .map((label) => ({
        label,
        value: firstUpperRestLower(stripAccents(label))
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, []);

  // Carregar filiais com mesma robustez dos componentes de Filial
  const fetchFiliais = async () => {
    try {
      // 1ª tentativa
      let url = `${API}/filiais`;
      let resp = await fetch(url);

      // fallback (caso base já inclua /api, etc.)
      if (!resp.ok && resp.status === 404) {
        const alt = `${API_ROOT || ''}/api/filiais`;
        if (alt !== url) resp = await fetch(alt);
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      setFiliaisBase(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Falha ao carregar filiais', e);
      setFiliaisBase([]);
    }
  };

  useEffect(() => { fetchFiliais(); }, []); // carrega filiais ao iniciar

  const filiaisOptions = useMemo(() => {
    const set = new Set((filiaisBase || []).map(f => (f?.filial || '').trim()).filter(Boolean));
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))];
  }, [filiaisBase]);

  const distritaisOptions = useMemo(() => {
    const set = new Set((filiaisBase || []).map(f => (f?.distrital || '').trim()).filter(Boolean));
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))];
  }, [filiaisBase]);

  const buscar = async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
    if (params.filial && !/^tod(a|o)s?$/i.test(params.filial)) qs.set('filial', params.filial);
    if (params.distrital && !/^tod(a|o)s?$/i.test(params.distrital)) qs.set('distrital', params.distrital);
    if (params.ocorrencia_psl && !/^tod(a|o)s?$/i.test(params.ocorrencia_psl)) qs.set('ocorrencia_psl', params.ocorrencia_psl);

    const url = `${API}/psl${qs.toString() ? `?${qs.toString()}` : ''}`;
    const { data } = await axios.get(url);
    setItens(Array.isArray(data) ? data : []);
  };

  useEffect(() => { buscar({}); }, []); // inicial

  const scrollToTabela = () => document.getElementById('tabela-psl')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToFormulario = () => document.getElementById('form-psl')?.scrollIntoView({ behavior: 'smooth' });

  // Helper: aplica filtros com ou sem scroll
  const aplicarFiltros = async (opts = { scroll: true }) => {
    await buscar({
      q: filtro || undefined,
      startDate: dataDe || undefined,
      endDate: dataAte || undefined,
      filial: filialFiltro,
      distrital: distritalFiltro,
      ocorrencia_psl: ocorrenciaFiltro,
    });
    if (opts.scroll) scrollToTabela();
  };

  const handleFiltrar = async () => aplicarFiltros({ scroll: true });

  // Limpar todos os filtros sem rolar para a tabela
  const limparTodosFiltros = async () => {
    setFiltro('');
    setDataDe('');
    setDataAte('');
    setFilialFiltro('Todos');
    setDistritalFiltro('Todos');
    setOcorrenciaFiltro('Todos');
    await buscar({});
    // sem scroll
  };

  const onAutoFiltro = async (novo) => {
    await buscar({
      q: filtro || undefined,
      startDate: dataDe || undefined,
      endDate: dataAte || undefined,
      filial: novo.filial ?? filialFiltro,
      distrital: novo.distrital ?? distritalFiltro,
      ocorrencia_psl: novo.ocorrencia_psl ?? ocorrenciaFiltro,
    });
    scrollToTabela();
  };

  const onEdit = (registro) => {
    setPslSelecionado(registro);
    scrollToFormulario();
    setTimeout(() => formularioRef.current?.preencher(registro), 50);
  };

  // Após salvar: atualiza a tabela SEM rolar a tela
  const onSaved = async () => { await aplicarFiltros({ scroll: false }); };

  return (
    <div className="pagina-cadastro-psl">
      {/* Título */}
      <h1 className="titulo-pagina">📑 PSL (Pedidos sem Loc)</h1>

      {/* Barra principal (igual ao padrão fornecido) */}
      <div style={{
        background: '#181893',
        padding: '30px',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
      }}>
        <input
          style={{ width: '300px' }}
          type="text"
          placeholder="Filtrar por qualquer campo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button className="botao" onClick={handleFiltrar}>Filtrar</button>
        <button className="botao" onClick={limparTodosFiltros}>Limpar Filtro</button>
        {/* <button className="botao" onClick={handleImport}>Importar</button> */}
        <button
          className="botao"
          onClick={() => {
            setPslSelecionado(null);
            setTimeout(() => formularioRef.current?.dispararNovo(), 80);
          }}
        >
          Novo
        </button>
      </div>

      {/* Filtros (centralizados e com mesmo fundo de .filtros-superiores) */}
      <div className="filtros-superiores filtros-psl">
        {/* Período */}
        <div className="filtro-bloco">
          <label>De</label>
          <input
            type="date"
            value={dataDe}
            onChange={(e) => setDataDe(e.target.value)}
          />
        </div>
        <div className="filtro-bloco">
          <label>Até</label>
          <input
            type="date"
            value={dataAte}
            onChange={(e) => setDataAte(e.target.value)}
          />
        </div>

        {/* Filial */}
        <div className="filtro-bloco">
          <label>Filial</label>
          <select
            value={filialFiltro}
            onChange={(e) => {
              const val = e.target.value;
              setFilialFiltro(val);
              if (/^tod(a|o)s?$/i.test(val)) limparTodosFiltros();
              else onAutoFiltro({ filial: val });
            }}
          >
            {filiaisOptions.map(x => <option key={x} value={stripAccents(x)}>{x}</option>)}
          </select>
        </div>

        {/* Distrital */}
        <div className="filtro-bloco">
          <label>Distrital</label>
          <select
            value={distritalFiltro}
            onChange={(e) => {
              const val = e.target.value;
              setDistritalFiltro(val);
              if (/^tod(a|o)s?$/i.test(val)) limparTodosFiltros();
              else onAutoFiltro({ distrital: firstUpperRestLower(stripAccents(val)) });
            }}
          >
            {distritaisOptions.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        {/* Ocorrência PSL */}
        <div className="filtro-bloco">
          <label>Ocorrência</label>
          <select
            value={ocorrenciaFiltro}
            onChange={(e) => {
              const val = e.target.value; // já vem normalizado nas options
              setOcorrenciaFiltro(val);
              if (/^tod(a|o)s?$/i.test(val)) limparTodosFiltros();
              else onAutoFiltro({ ocorrencia_psl: val });
            }}
          >
            <option value="Todos">Todos</option>
            {ocorrenciaOptions.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Formulário (mesmo visual do form-filial) */}
      <div id="form-psl" className="formulario-container-psl">
        <FormularioPedidosPSL
          ref={formularioRef}
          filiais={filiaisBase}
          onSaved={onSaved}
        />
      </div>

      {/* Título + Tabela */}
      <div className="cabecalho-tabela">
        <h2 className="subtitulo">Tabela de Pedidos Sem Loc</h2>
      </div>

      <div id="tabela-psl" className="tabela-wrapper">
        <TabelaPedidosPSL itens={itens} onEdit={onEdit} />
      </div>

      {/* Voltar ao topo */}
      <button
        type="button"
        className="btn-voltar-topo"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <img alt="Voltar ao topo" src="/static/media/topo.863932826c4e0661af20.png" />
      </button>
    </div>
  );
}
