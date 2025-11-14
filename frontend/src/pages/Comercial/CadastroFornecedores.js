import React, { useRef, useState, useEffect, useMemo } from "react";
import "./CadastroFornecedores.css";
import TabelaFornecedores from "../../components/comercial/TabelaFornecedores";
import FormularioFornecedor from "../../components/comercial/FormularioFornecedor";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const API_HOST = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const API = `${API_HOST}/api`;

const CadastroFornecedores = () => {
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("Todos");
  const [filtroTipoFornecedor, setFiltroTipoFornecedor] = useState("Todos");
  const [filtroResponsavel, setFiltroResponsavel] = useState("Todos");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresBase, setFornecedoresBase] = useState([]);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false); // controla dropdown Exportar

  const anchorFormRef = useRef(null);
  const anchorTabelaRef = useRef(null);
  const formularioRef = useRef(null);
  const filtroTextoRef = useRef(null);

  const fetchTodos = async () => {
    try {
      const { data } = await axios.get(`${API}/fornecedores`);
      setFornecedoresBase(data || []);
      setFornecedores(data || []);
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Erro",
        text: "Não foi possível carregar fornecedores.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const computeNextCodigoFromList = () => {
    const seqs = (fornecedoresBase || [])
      .map(f => String(f?.codigo_fornecedor || ""))
      .map(code => {
        const m = code.match(/^FORN-(\d{1,})$/);
        if (m && m[1]) return parseInt(m[1], 10);
        const m2 = code.match(/^FORN-(\d{10})$/);
        if (m2 && m2[1]) return parseInt(m2[1], 10);
        return 0;
      });
    const max = seqs.length ? Math.max(...seqs) : 0;
    const next = String((max || 0) + 1).padStart(10, "0");
    return `FORN-${next}`;
  };

  const fornecedoresOptions = useMemo(() => {
    const set = new Set(
      (fornecedoresBase || [])
        .map(f => (f?.fornecedor || f?.razao_social || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );
  }, [fornecedoresBase]);

  const tipoFornecedorOptions = useMemo(() => {
    const set = new Set(
      (fornecedoresBase || [])
        .map(f => (f?.tipoFornecedor || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );
  }, [fornecedoresBase]);

  const responsaveisOptions = useMemo(() => {
    const set = new Set(
      (fornecedoresBase || [])
        .map(f => (f?.responsavel || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );
  }, [fornecedoresBase]);

  const opcoesCidade = useMemo(() => {
    return [...new Set((fornecedoresBase || []).map(c => c.cidade).filter(Boolean))].sort(
      (a, b) => String(a).localeCompare(String(b))
    );
  }, [fornecedoresBase]);

  const filtroComposto = [
    filtroTexto?.trim(),
    filtroFornecedor !== "Todos" ? filtroFornecedor : "",
    filtroTipoFornecedor !== "Todos" ? filtroTipoFornecedor : "",
    filtroResponsavel !== "Todos" ? filtroResponsavel : "",
    filtroCidade || "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  useEffect(() => {
    setRefreshKey(k => k + 1);
  }, [filtroComposto]);

  const rolarParaTabela = () =>
    setTimeout(
      () => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );

  const handleFiltrar = () => {
    rolarParaTabela();
  };

  const limparTodosFiltrosLocal = () => {
    setFiltroTexto("");
    setFiltroFornecedor("Todos");
    setFiltroTipoFornecedor("Todos");
    setFiltroResponsavel("Todos");
    setFiltroCidade("");
    setFornecedores(fornecedoresBase);
    setTimeout(
      () => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const handleLimparFiltros = () => {
    fetchTodos();
    limparTodosFiltrosLocal();
    setTimeout(() => {
      formularioRef.current?.limparEIrTopo?.();
      filtroTextoRef.current?.focus();
    }, 100);
  };

  const onChangeFornecedor = (e) => {
    const val = e.target.value;
    if (val === "Todos") return handleLimparFiltros();
    setFiltroFornecedor(val);
    rolarParaTabela();
  };

  const onChangeTipoFornecedor = (e) => {
    const val = e.target.value;
    if (val === "Todos") return handleLimparFiltros();
    setFiltroTipoFornecedor(val);
    rolarParaTabela();
  };

  const onChangeResponsavel = (e) => {
    const val = e.target.value;
    if (val === "Todos") return handleLimparFiltros();
    setFiltroResponsavel(val);
    rolarParaTabela();
  };

  const onChangeCidade = (e) => onChangeFiltroCidade(e.target.value);

  const onChangeFiltroCidade = (valor) => {
    if (valor === "") {
      limparTodosFiltrosLocal();
      return;
    }
    setFiltroCidade(valor);
    setFiltroFornecedor("Todos");
    setFiltroResponsavel("Todos");

    let lista = [...fornecedoresBase];
    lista = lista.filter(c => (c.cidade || "") === valor);
    setFornecedores(lista);
    setTimeout(
      () => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const handleExportar = (tipo) => {
    console.log("Exportar:", tipo);
  };

  const handleSalvar = async () => {
    try {
      await fetchTodos();
      setFornecedorSelecionado(null);
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNovo = () => {
    const nextCode = computeNextCodigoFromList();
    const seed = { codigo_fornecedor: nextCode };
    setFornecedorSelecionado(seed);
    setTimeout(() => {
      if (formularioRef.current?.dispararNovo) {
        formularioRef.current.dispararNovo({ seed });
      }
      anchorFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // --------- EXPORTAÇÃO CSV / XLSX (sem _id e updatedAt) ---------
  const prepararDadosExportacao = () => {
    if (!Array.isArray(fornecedores) || fornecedores.length === 0) {
      return null;
    }
    // remove _id e updatedAt de cada registro
    return fornecedores.map(({ _id, updatedAt, ...rest }) => rest);
  };

  const exportarFornecedoresCSV = () => {
    const dados = prepararDadosExportacao();
    if (!dados) {
      Swal.fire("Aviso", "Nenhum dado disponível para exportar.", "info");
      return;
    }
    const csv = Papa.unparse(dados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "fornecedores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarFornecedoresXLSX = () => {
    const dados = prepararDadosExportacao();
    if (!dados) {
      Swal.fire("Aviso", "Nenhum dado disponível para exportar.", "info");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fornecedores");
    XLSX.writeFile(workbook, "fornecedores.xlsx");
  };
  // ---------------------------------------------------------------

  return (
    <div className="pagina-cadastro-fornecedores">
      <h1 className="titulo-pagina">🪪 Cadastro de Fornecedores</h1>
      <div className="barra-filtro-texto">
        <input
          ref={filtroTextoRef}
          className="input-filtro-texto"
          type="text"
          placeholder="Filtrar por qualquer campo..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
        <button className="botao" onClick={handleFiltrar}>Filtrar</button>
        <button className="botao" onClick={handleLimparFiltros}>Limpar Filtro</button>
        <button
          className="botao"
          onClick={() => {
            setFiltroTexto("");
            setFiltroFornecedor("Todos");
            setFiltroTipoFornecedor("Todos");
            setFiltroResponsavel("Todos");
            setFiltroCidade("");
            handleNovo();
          }}
        >
          Novo
        </button>
      </div>

      <div className="filtros-superiores">
        <div className="filtro-bloco">
          <label>Fornecedor</label>
          <select
            value={filtroFornecedor}
            onChange={onChangeFornecedor}
            title="Fornecedor"
            aria-label="Filtro por Fornecedor"
          >
            <option value="Todos">Todos</option>
            {fornecedoresOptions.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Tipo de Fornecedor</label>
          <select
            value={filtroTipoFornecedor}
            onChange={onChangeTipoFornecedor}
            title="Tipo de Fornecedor"
            aria-label="Filtro por Tipo de Fornecedor"
          >
            <option value="Todos">Todos</option>
            {tipoFornecedorOptions.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Responsável</label>
          <select
            value={filtroResponsavel}
            onChange={onChangeResponsavel}
            title="Responsável"
            aria-label="Filtro por Responsável"
          >
            <option value="Todos">Todos</option>
            {responsaveisOptions.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>

        <div className="filtro-bloco">
          <label>Cidade</label>
          <select
            value={filtroCidade}
            onChange={(e) => onChangeFiltroCidade(e.target.value)}
            title="Cidade"
            aria-label="Filtro por Cidade"
          >
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
          <FormularioFornecedor
            ref={formularioRef}
            fornecedor={fornecedorSelecionado}
            onSalvar={handleSalvar}
            onNovo={handleNovo}
            getNextCodigoFornecedor={() => computeNextCodigoFromList()}
          />
        </section>
      </div>

      {/* BOTÃO EXPORTAR – mesmo padrão de CadastroClientes */}
      <div className="exportar-container">
        <div className="exportar-dropdown">
          <button
            className="botao"
            onClick={() => setExportOpen(v => !v)}
          >
            Exportar ▾
          </button>
          {exportOpen && (
            <div className="exportar-menu">
              <button className="botao" onClick={exportarFornecedoresCSV}>Exportar .CSV</button><br />
              <button className="botao" onClick={exportarFornecedoresXLSX}>Exportar .XLSX</button>
            </div>
          )}
        </div>
      </div>

      <div ref={anchorTabelaRef}>
        <TabelaFornecedores
          filtro={filtroComposto}
          refreshKey={refreshKey}
          fornecedores={fornecedores}
          onEditar={(f) => {
            setFornecedorSelecionado(f);
            setTimeout(
              () => anchorFormRef.current?.scrollIntoView({ behavior: "smooth" }),
              100
            );
          }}
          onExportar={handleExportar}
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

export default CadastroFornecedores;
