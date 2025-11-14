// src/pages/Comercial/CadastroPedidosPSL.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CadastroPedidosPSL.css';
import axios from 'axios';
import FormularioPedidosPSL from '../../components/comercial/FormularioPedidosPSL';
import TabelaPedidosPSL from '../../components/comercial/TabelaPedidosPSL';
import { OCORRENCIA_PSL } from '../../utils/FormUtilsComercial';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const RAW = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
const API_ROOT = RAW || '';
const API = `${API_ROOT}${/\/api$/.test(API_ROOT) ? '' : '/api'}`;

const stripAccents = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/gi, 'c');
const firstUpperRestLower = (s = '') =>
  s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

export default function CadastroPedidosPSL() {
  const [itens, setItens] = useState([]);
  const [filiaisBase, setFiliaisBase] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [pslSelecionado, setPslSelecionado] = useState(null);
  const [dataDe, setDataDe] = useState('');
  const [dataAte, setDataAte] = useState('');
  const [filialFiltro, setFilialFiltro] = useState('Todos');
  const [distritalFiltro, setDistritalFiltro] = useState('Todos');
  const [ocorrenciaFiltro, setOcorrenciaFiltro] = useState('Todos');
  const [exportOpen, setExportOpen] = useState(false);

  const formularioRef = useRef(null);

  const ocorrenciaOptions = useMemo(() => {
    return [...OCORRENCIA_PSL]
      .map((label) => ({
        label,
        value: firstUpperRestLower(stripAccents(label))
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, []);

  const fetchFiliais = async () => {
    try {
      let url = `${API}/filiais`;
      let resp = await fetch(url);
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

  useEffect(() => { fetchFiliais(); }, []);

  const filiaisOptions = useMemo(() => {
    const set = new Set((filiaisBase || []).map(f => (f?.filial || '').trim()).filter(Boolean));
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [filiaisBase]);

  const distritaisOptions = useMemo(() => {
    const set = new Set((filiaisBase || []).map(f => (f?.distrital || '').trim()).filter(Boolean));
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
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

  useEffect(() => { buscar({}); }, []);

  const scrollToTabela = () => document.getElementById('tabela-psl')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToFormulario = () => document.getElementById('form-psl')?.scrollIntoView({ behavior: 'smooth' });

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

  const limparTodosFiltros = async () => {
    setFiltro('');
    setDataDe('');
    setDataAte('');
    setFilialFiltro('Todos');
    setDistritalFiltro('Todos');
    setOcorrenciaFiltro('Todos');
    await buscar({});
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

  const onSaved = async () => { await aplicarFiltros({ scroll: false }); };

  // ---------- EXPORTAÇÃO ----------
  const prepararDadosExportacao = () => {
    if (!Array.isArray(itens) || itens.length === 0) return null;
    return itens.map(({ _id, createdAt, updatedAt, __v, ...rest }) => rest);
  };

  const exportarPedidosCSV = () => {
    const dados = prepararDadosExportacao();
    if (!dados) return window.alert('Nenhum dado disponível para exportar.');

    const csv = Papa.unparse(dados);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'psl_pedidos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPedidosXLSX = () => {
    const dados = prepararDadosExportacao();
    if (!dados) return window.alert('Nenhum dado disponível para exportar.');

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PSL');
    XLSX.writeFile(workbook, 'psl_pedidos.xlsx');
  };

  return (
    <div className="pagina-cadastro-psl">
      <h1 className="titulo-pagina">📑 PSL (Pedidos sem Loc)</h1>

      {/* BARRA SUPERIOR CORRIGIDA COM BORDER-RADIUS */}
      <div
        style={{
          background: '#181893',
          padding: '30px',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          borderRadius: '12px'
        }}
      >
        <input
          style={{ width: '300px' }}
          type="text"
          placeholder="Filtrar por qualquer campo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button className="botao" onClick={handleFiltrar}>Filtrar</button>
        <button className="botao" onClick={limparTodosFiltros}>Limpar Filtro</button>
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

      {/* FILTROS SUPERIORES */}
      <div className="filtros-superiores filtros-psl">
        <div className="filtro-bloco">
          <label>De</label>
          <input type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)} />
        </div>

        <div className="filtro-bloco">
          <label>Até</label>
          <input type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} />
        </div>

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
            {filiaisOptions.map(x => (
              <option key={x} value={stripAccents(x)}>{x}</option>
            ))}
          </select>
        </div>

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
            {distritaisOptions.map(x => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Ocorrência</label>
          <select
            value={ocorrenciaFiltro}
            onChange={(e) => {
              const val = e.target.value;
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

      {/* FORMULÁRIO */}
      <div id="form-psl">
        <FormularioPedidosPSL
          ref={formularioRef}
          filiais={filiaisBase}
          onSaved={onSaved}
        />
      </div>

      {/* EXPORTAR */}
      <div className="exportar-container">
        <div className="exportar-dropdown">
          <button className="botao" onClick={() => setExportOpen(v => !v)}>
            Exportar ▾
          </button>
          {exportOpen && (
            <div className="exportar-menu">
              <button className="botao" onClick={exportarPedidosCSV}>Exportar .CSV</button><br />
              <button className="botao" onClick={exportarPedidosXLSX}>Exportar .XLSX</button>
            </div>
          )}
        </div>
      </div>

      {/* TABELA */}
      <div id="tabela-psl">
        <TabelaPedidosPSL itens={itens} onEdit={onEdit} />
      </div>

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
