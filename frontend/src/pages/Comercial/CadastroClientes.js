import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import FormularioCliente from "../../components/comercial/FormularioCliente";
import TabelaClientes from "../../components/comercial/TabelaClientes";
import "./CadastroClientes.css";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const API_HOST = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const API = `${API_HOST}/api`;

const ALL_FIELDS_ORDERED = [
  "codigo_cliente", "cliente", "razao_social", "cnpj", "insc_estadual",
  "responsavel", "cargo", "telefone", "email", "endereco",
  "complemento", "cidade", "bairro", "estado", "cep", "observacao",
];

const CadastroClientes = () => {
  const [filtroTexto, setFiltroTexto] = useState("");

  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");

  const [clientes, setClientes] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const formularioRef = useRef(null);
  const anchorFormRef = useRef(null);
  const anchorTabelaRef = useRef(null);

  const fetchTodos = async () => {
    try {
      const { data } = await axios.get(`${API}/clientes`);
      setClientesBase(data || []);
      setClientes(data || []);
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Erro",
        text: "Não foi possível carregar clientes.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // ---------- NOVO: gera próximo codigo_cliente localmente ----------
  const computeNextCodigoFromList = () => {
    const seqs = (clientesBase || [])
      .map(c => String(c?.codigo_cliente || ''))
      .map(code => {
        const m = code.match(/^CLI-(\d{1,})$/);
        if (m && m[1]) return parseInt(m[1], 10);
        const m2 = code.match(/^CLI-(\d{10})$/);
        if (m2 && m2[1]) return parseInt(m2[1], 10);
        return 0;
      });
    const max = seqs.length ? Math.max(...seqs) : 0;
    const next = String((max || 0) + 1).padStart(10, '0');
    return `CLI-${next}`;
  };

  const handleFiltrarTexto = async () => {
    try {
      const url = `${API}/clientes/filtro?busca=${encodeURIComponent(filtroTexto)}`;
      const { data } = await axios.get(url);
      let lista = data || [];

      if (filtroCliente) {
        lista = lista.filter(c => (c.cliente || "") === filtroCliente);
      } else if (filtroResponsavel) {
        lista = lista.filter(c => (c.responsavel || "") === filtroResponsavel);
      } else if (filtroCidade) {
        lista = lista.filter(c => (c.cidade || "") === filtroCidade);
      }

      setClientes(lista);
      setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      console.error(e);
      Swal.fire({ title: "Erro", text: "Erro ao filtrar.", icon: "error", confirmButtonText: "OK" });
    }
  };

  const limparTodosFiltrosLocal = async () => {
    setFiltroTexto("");
    setFiltroCliente("");
    setFiltroResponsavel("");
    setFiltroCidade("");
    setClientes(clientesBase);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleLimparFiltros = async () => {
    await fetchTodos();
    await limparTodosFiltrosLocal();
  };

  // ---------- AJUSTE: "Novo" da página já mostra codigo_cliente ----------
  const handleNovoGlobal = () => {
    const nextCode = computeNextCodigoFromList();
    const seed = { codigo_cliente: nextCode };

    setClienteSelecionado(seed);
    if (formularioRef.current?.dispararNovo) {
      // passa seed para o formulário
      formularioRef.current.dispararNovo({ seed });
    }
    setTimeout(() => anchorFormRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleAposSalvar = async () => {
    await fetchTodos();
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const exportarClientesCSV = () => {
    if (!Array.isArray(clientes) || clientes.length === 0) {
      Swal.fire("Aviso", "Nenhum dado disponível para exportar.", "info");
      return;
    }
    const ordenados = clientes.map(row => {
      const out = {};
      ALL_FIELDS_ORDERED.forEach(k => { out[k] = row?.[k] ?? ""; });
      return out;
    });
    const csv = Papa.unparse(ordenados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "clientes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarClientesXLSX = () => {
    if (!Array.isArray(clientes) || clientes.length === 0) {
      Swal.fire("Aviso", "Nenhum dado disponível para exportar.", "info");
      return;
    }
    const ordenados = clientes.map(row => {
      const out = {};
      ALL_FIELDS_ORDERED.forEach(k => { out[k] = row?.[k] ?? ""; });
      return out;
    });
    const worksheet = XLSX.utils.json_to_sheet(ordenados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    XLSX.writeFile(workbook, "clientes.xlsx");
  };

  const opcoesCliente = [...new Set((clientesBase || []).map(c => c.cliente).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
  const opcoesResponsavel = [...new Set((clientesBase || []).map(c => c.responsavel).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
  const opcoesCidade = [...new Set((clientesBase || []).map(c => c.cidade).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));

  const onChangeFiltroCliente = (valor) => {
    if (valor === "") {
      limparTodosFiltrosLocal();
      return;
    }
    setFiltroCliente(valor);
    setFiltroResponsavel("");
    setFiltroCidade("");
    let lista = [...clientesBase];
    lista = lista.filter(c => (c.cliente || "") === valor);
    setClientes(lista);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const onChangeFiltroResponsavel = (valor) => {
    if (valor === "") {
      limparTodosFiltrosLocal();
      return;
    }
    setFiltroResponsavel(valor);
    setFiltroCliente("");
    setFiltroCidade("");
    let lista = [...clientesBase];
    lista = lista.filter(c => (c.responsavel || "") === valor);
    setClientes(lista);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const onChangeFiltroCidade = (valor) => {
    if (valor === "") {
      limparTodosFiltrosLocal();
      return;
    }
    setFiltroCidade(valor);
    setFiltroCliente("");
    setFiltroResponsavel("");
    let lista = [...clientesBase];
    lista = lista.filter(c => (c.cidade || "") === valor);
    setClientes(lista);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="pagina-cadastro-clientes">
      <h1 className="titulo-pagina">📋 Cadastro de Clientes</h1>

      <div className="barra-filtro-texto">
        <input
          className="input-filtro-texto"
          type="text"
          placeholder="Filtrar por qualquer campo..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
        <button className="botao" onClick={handleFiltrarTexto}>Filtrar</button>
        <button className="botao" onClick={handleLimparFiltros}>Limpar Filtros</button>
        <button className="botao" onClick={handleNovoGlobal}>Novo</button>
      </div>

      <div className="filtros-superiores">
        <div className="filtro-bloco">
          <label>Cliente</label>
          <select value={filtroCliente} onChange={(e) => onChangeFiltroCliente(e.target.value)}>
            <option value="">Todos</option>
            {opcoesCliente.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Responsável</label>
          <select value={filtroResponsavel} onChange={(e) => onChangeFiltroResponsavel(e.target.value)}>
            <option value="">Todos</option>
            {opcoesResponsavel.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
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

      <div ref={anchorFormRef}>
        <br></br>
      </div>

      <div className="formulario-container">
        <FormularioCliente
          ref={formularioRef}
          cliente={clienteSelecionado}
          onSalvar={handleAposSalvar}
          onNovo={handleNovoGlobal}
          // ⬇️ NOVO: para que o botão "Novo" do próprio formulário também gere e exiba o código
          getNextCodigoCliente={() => computeNextCodigoFromList()}
        />
      </div>

      <div className="cabecalho-tabela">
        <h2 className="subtitulo">Tabela de Clientes</h2>
      </div>

      <div className="exportar-container">
        <div className="exportar-dropdown">
          <button className="botao" onClick={() => setExportOpen((v) => !v)}>
            Exportar
          </button>
          {exportOpen && (
            <div className="exportar-menu">
              <button className="botao" onClick={exportarClientesCSV}>Exportar CSV</button><br />
              <button className="botao" onClick={exportarClientesXLSX}>Exportar XLSX</button>
            </div>
          )}
        </div>
      </div>

      <div ref={anchorTabelaRef} className="tabela-wrapper">
        <TabelaClientes
          clientes={clientes}
          onEditar={(c) => {
            setClienteSelecionado(c);
            setTimeout(() => {
              anchorFormRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
        />
      </div>

      <button
        type="button"
        className="btn-voltar-topo"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <img
          alt="Voltar ao topo"
          src="/static/media/topo.863932826c4e0661af20.png"
        />
      </button>
    </div>
  );
};

export default CadastroClientes;
