import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CadastroFilial.css';
import TabelaFilial from '../../components/comercial/TabelaFilial';
import FormularioFilial from '../../components/comercial/FormularioFilial';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const RAW = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
const API_ROOT = RAW || '';
const API = `${API_ROOT}${/\/api$/.test(API_ROOT) ? '' : '/api'}`;

export default function CadastroFilial() {
  const [filtro, setFiltro] = useState('');

  const [selFilial, setSelFilial] = useState('Todos');
  const [selDistrital, setSelDistrital] = useState('Todas');
  const [selResponsavel, setSelResponsavel] = useState('Todos');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filiaisBase, setFiliaisBase] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [filialSelecionada, setFilialSelecionada] = useState(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  const formularioRef = useRef(null);
  const anchorTabelaRef = useRef(null);
  const anchorFormRef = useRef(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false); // controla dropdown de exportação

  const fetchFiliais = async () => {
    try {
      const { data } = await axios.get(`${API}/filiais`);
      setFiliaisBase(data || []);
      setFiliais(data || []);
    } catch (e) {
      console.error(e);
      Swal.fire('Erro', 'Não foi possível carregar as filiais.', 'error');
    }
  };

  useEffect(() => {
    fetchFiliais();
  }, []);

  const filiaisOptions = useMemo(() => {
    const set = new Set((filiaisBase || []).map(f => (f?.filial || '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [filiaisBase]);

  const distritaisOptions = useMemo(() => {
    const set = new Set((filiaisBase || []).map(f => (f?.distrital || '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [filiaisBase]);

  const responsaveisOptions = useMemo(() => {
    const set = new Set((filiaisBase || []).map(f => (f?.responsavel || '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [filiaisBase]);

  const opcoesCidade = useMemo(() => {
    return [...new Set((filiaisBase || []).map(c => c.cidade).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [filiaisBase]);

  const filtroComposto = [
    filtro?.trim(),
    selFilial !== 'Todos' ? selFilial : '',
    selDistrital !== 'Todas' ? selDistrital : '',
    selResponsavel !== 'Todos' ? selResponsavel : '',
    filtroCidade || ''
  ].filter(Boolean).join(' ').trim();

  useEffect(() => {
    setRefreshKey(k => k + 1);
  }, [filtroComposto]);

  const rolarParaTabela = () => setTimeout(() => {
    anchorTabelaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);

  const handleFiltrar = () => rolarParaTabela();

  const limparTodosFiltros = () => {
    setFiltro('');
    setSelFilial('Todos');
    setSelDistrital('Todas');
    setSelResponsavel('Todos');
    setFiltroCidade('');
    setFilialSelecionada(null);
    setFuncionarioSelecionado(null);
    setFiliais(filiaisBase);
    setTimeout(() => formularioRef.current?.limparEIrTopo?.(), 100);
  };

  const onChangeFilial = e => {
    const v = e.target.value;
    if (v === 'Todos') return limparTodosFiltros();
    setSelFilial(v);
    rolarParaTabela();
  };

  const onChangeDistrital = e => {
    const v = e.target.value;
    if (v === 'Todas') return limparTodosFiltros();
    setSelDistrital(v);
    rolarParaTabela();
  };

  const onChangeResponsavel = e => {
    const v = e.target.value;
    if (v === 'Todos') return limparTodosFiltros();
    setSelResponsavel(v);
    rolarParaTabela();
  };

  const limparTodosFiltrosLocal = () => {
    setFiltro('');
    setSelFilial('Todos');
    setSelDistrital('Todas');
    setSelResponsavel('Todos');
    setFiltroCidade('');
    setFiliais(filiaisBase);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const onChangeFiltroCidade = (valor) => {
    if (valor === '') {
      limparTodosFiltrosLocal();
      return;
    }
    setFiltroCidade(valor);
    let lista = [...filiaisBase];
    lista = lista.filter(c => (c.cidade || '') === valor);
    setFiliais(lista);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSalvar = async () => {
    await fetchFiliais();
    setRefreshKey(k => k + 1);
  };

  const handleNovo = () => {
    setFilialSelecionada(null);
    setFuncionarioSelecionado(null);
    setTimeout(() => {
      formularioRef.current?.dispararNovo?.();
      anchorFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ---------- FUNÇÕES DE EXPORTAÇÃO (CSV / XLSX) ----------
  const prepararDadosExportacao = () => {
    if (!Array.isArray(filiais) || filiais.length === 0) {
      return null;
    }
    return filiais.map(({ _id, updatedAt, ...rest }) => rest);
  };

  const exportarFiliaisCSV = () => {
    const dados = prepararDadosExportacao();
    if (!dados) {
      Swal.fire('Aviso', 'Nenhum dado disponível para exportar.', 'info');
      return;
    }

    const csv = Papa.unparse(dados);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'filiais.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarFiliaisXLSX = () => {
    const dados = prepararDadosExportacao();
    if (!dados) {
      Swal.fire('Aviso', 'Nenhum dado disponível para exportar.', 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Filiais');
    XLSX.writeFile(workbook, 'filiais.xlsx');
  };
  // ---------- FIM EXPORTAÇÃO ----------

  return (
    <div className="pagina-cadastro-filial">
      <h1 className="titulo-pagina">🏬 Cadastro de Filial</h1>

      <div style={{
        background: '#181893',
        padding: '30px',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        borderRadius: '12px'
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
        <button className="botao" onClick={() => {
          setFuncionarioSelecionado(null);
          setTimeout(() => formularioRef.current?.dispararNovo(), 100);
        }}>
          Novo
        </button>
      </div>

      <div className="filtros-superiores">
        <div className="filtro-bloco">
          <label>Filial</label>
          <select value={selFilial} onChange={onChangeFilial}>
            <option value="Todos">Todos</option>
            {filiaisOptions.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Distrital</label>
          <select value={selDistrital} onChange={onChangeDistrital}>
            <option value="Todas">Todas</option>
            {distritaisOptions.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Responsável</label>
          <select value={selResponsavel} onChange={onChangeResponsavel}>
            <option value="Todos">Todos</option>
            {responsaveisOptions.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Cidade</label>
          <select value={filtroCidade} onChange={(e) => onChangeFiltroCidade(e.target.value)}>
            <option value="">Todas</option>
            {opcoesCidade.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div ref={anchorFormRef} />
      <div>
        <section style={{ marginTop: 16 }}>
          <FormularioFilial
            ref={formularioRef}
            filial={filialSelecionada}
            onSalvar={handleSalvar}
            onNovo={handleNovo}
          />
        </section>
      </div>

      {/* DROPDOWN DE EXPORTAÇÃO (estilos agora no CSS) */}
      <div className="exportar-container">
        <div className="exportar-dropdown">
          <button
            type="button"
            className="botao"
            aria-haspopup="true"
            aria-expanded={exportOpen ? 'true' : 'false'}
            onClick={() => setExportOpen(v => !v)}
          >
            Exportar ▾
          </button>

          {exportOpen && (
            <div className="exportar-menu">
              <button className="botao" onClick={exportarFiliaisCSV}>Exportar .CSV</button><br />
              <button className="botao" onClick={exportarFiliaisXLSX}>Exportar .XLSX</button><br />
            </div>
          )}
        </div>
      </div>

      <div ref={anchorTabelaRef}>
        <TabelaFilial
          filtro={filtroComposto}
          refreshKey={refreshKey}
          onEditar={(r) => {
            setFilialSelecionada(r);
            setTimeout(() => anchorFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}
        />
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
