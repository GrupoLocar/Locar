// src/pages/Comercial/CadastroFilial.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CadastroFilial.css';
// ❌ Removido o uso do MUNICIPIOS_RJ no filtro de cidade
// import { MUNICIPIOS_RJ } from '../../utils/FormUtilsComercial';
import TabelaFilial from '../../components/comercial/TabelaFilial';
import FormularioFilial from '../../components/comercial/FormularioFilial';
import axios from 'axios';
import Swal from 'sweetalert2';

// ==== Base API (robusta) ====
const RAW = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
const API_ROOT = RAW || '';
const API = `${API_ROOT}${/\/api$/.test(API_ROOT) ? '' : '/api'}`;

export default function CadastroFilial() {
  // Barra principal (texto livre)
  const [filtro, setFiltro] = useState('');

  // Filtros por select (mantidos)
  const [selFilial, setSelFilial] = useState('Todos');
  const [selDistrital, setSelDistrital] = useState('Todas');
  const [selResponsavel, setSelResponsavel] = useState('Todos');

  // 🔄 Novo estado de cidade no padrão do CadastroClientes ("" = Todas)
  const [filtroCidade, setFiltroCidade] = useState('');

  // Dados
  const [filiaisBase, setFiliaisBase] = useState([]);
  const [filiais, setFiliais] = useState([]); // mantido (útil para gerar opções e compatibilidade)
  const [filialSelecionada, setFilialSelecionada] = useState(null);

  // alias apenas para usar o bloco JSX solicitado literalmente
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  // refs
  const formularioRef = useRef(null);
  const anchorTabelaRef = useRef(null);
  const anchorFormRef = useRef(null);

  // refresh da tabela
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Opções ordenadas (mantidas)
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

  // ✅ Novo: opções de cidade a partir de filiaisBase (como em CadastroClientes)
  const opcoesCidade = useMemo(() => {
    return [...new Set((filiaisBase || []).map(c => c.cidade).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [filiaisBase]);

  // Filtro composto (texto + selects)
  // ⚠️ substituí selCidade por filtroCidade ("" = Todas)
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
    setFiltroCidade(''); // limpa cidade (Todas)
    setFilialSelecionada(null);
    setFuncionarioSelecionado(null);
    setFiliais(filiaisBase); // restaura base local (compatível com o padrão de clientes)
    setTimeout(() => formularioRef.current?.limparEIrTopo?.(), 100);
  };

  // Versões que limpam e aplicam (mantidas)
  const onChangeFilial = e => { const v = e.target.value; if (v === 'Todos') return limparTodosFiltros(); setSelFilial(v); rolarParaTabela(); };
  const onChangeDistrital = e => { const v = e.target.value; if (v === 'Todas') return limparTodosFiltros(); setSelDistrital(v); rolarParaTabela(); };
  const onChangeResponsavel = e => { const v = e.target.value; if (v === 'Todos') return limparTodosFiltros(); setSelResponsavel(v); rolarParaTabela(); };

  // ✅ Novo: filtro de cidade no mesmo padrão do CadastroClientes ("" = Todas)
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
    // zera outros filtros de cidade/cliente/responsável (mantemos os selects padrões como estão)
    // Aqui seguimos o padrão de clientes, mas preservando os selects de Filial/Distrital/Responsável existentes.
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

  return (
    <div className="pagina-cadastro-filial">
      <h1 className="titulo-pagina">🏬 Cadastro de Filial</h1>

      {/* === Barra principal (código fornecido) === */}
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
        <button className="botao" onClick={() => {
          setFuncionarioSelecionado(null);
          setTimeout(() => formularioRef.current?.dispararNovo(), 100);
        }}>
          Novo
        </button>
      </div>

      {/* === Filtros: Filial / Distrital / Responsável / Cidade === */}
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

        {/* ✅ Cidade agora segue o padrão de CadastroClientes: opções de filiaisBase e "" = Todas */}
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

      {/* === Formulário === */}
      <div ref={anchorFormRef} />
      <div className="formulario-container">
        <section style={{ marginTop: 16 }}>
          <FormularioFilial
            ref={formularioRef}
            filial={filialSelecionada}
            onSalvar={handleSalvar}
            onNovo={handleNovo}
          />
        </section>
      </div>

      {/* === Tabela === */}
      <div className="cabecalho-tabela">
        <h2 className="subtitulo">Tabela de Filial</h2>
      </div>

      <div ref={anchorTabelaRef} className="tabela-wrapper">
        <TabelaFilial
          // continua usando filtroComposto (inclui filtroCidade quando escolhido)
          filtro={filtroComposto}
          refreshKey={refreshKey}
          onEditar={(r) => {
            setFilialSelecionada(r);
            setTimeout(() => anchorFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}
        />
      </div>

      {/* Voltar ao topo (mesmo de Fornecedores) */}
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
