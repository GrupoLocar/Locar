// src/pages/Comercial/CadastroFornecedores.js
import React, { useRef, useState, useEffect, useMemo } from "react";
import "./CadastroFornecedores.css";
// ❌ Removido: import { MUNICIPIOS_RJ } from "../../utils/FormUtilsComercial";
import TabelaFornecedores from "../../components/comercial/TabelaFornecedores";
import FormularioFornecedor from "../../components/comercial/FormularioFornecedor";
import axios from "axios";
import Swal from "sweetalert2";

const API_HOST = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const API = `${API_HOST}/api`;

const CadastroFornecedores = () => {
  // Filtros/inputs
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("Todos");
  const [filtroTipoFornecedor, setFiltroTipoFornecedor] = useState("Todos");
  const [filtroResponsavel, setFiltroResponsavel] = useState("Todos");

  // ✅ Novo: segue padrão do CadastroClientes ("" = Todas)
  const [filtroCidade, setFiltroCidade] = useState("");

  // Lista e item selecionado
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresBase, setFornecedoresBase] = useState([]);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  // refresh para a tabela
  const [refreshKey, setRefreshKey] = useState(0);

  // refs
  const anchorFormRef = useRef(null);
  const anchorTabelaRef = useRef(null);
  const formularioRef = useRef(null);
  const filtroTextoRef = useRef(null);

  // --- Carrega todos
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

  // Gera próximo codigo_fornecedor localmente
  const computeNextCodigoFromList = () => {
    const seqs = (fornecedoresBase || [])
      .map(f => String(f?.codigo_fornecedor || ''))
      .map(code => {
        const m = code.match(/^FORN-(\d{1,})$/);
        if (m && m[1]) return parseInt(m[1], 10);
        const m2 = code.match(/^FORN-(\d{10})$/);
        if (m2 && m2[1]) return parseInt(m2[1], 10);
        return 0;
      });
    const max = seqs.length ? Math.max(...seqs) : 0;
    const next = String((max || 0) + 1).padStart(10, '0');
    return `FORN-${next}`;
  };

  // Opções ordenadas alfabeticamente para os filtros
  const fornecedoresOptions = useMemo(() => {
    const set = new Set(
      (fornecedoresBase || [])
        .map(f => (f?.fornecedor || f?.razao_social || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [fornecedoresBase]);

  const tipoFornecedorOptions = useMemo(() => {
    const set = new Set(
      (fornecedoresBase || [])
        .map(f => (f?.tipoFornecedor || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [fornecedoresBase]);

  const responsaveisOptions = useMemo(() => {
    const set = new Set(
      (fornecedoresBase || [])
        .map(f => (f?.responsavel || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [fornecedoresBase]);

  // ✅ Novo: opções dinâmicas de cidade a partir de fornecedoresBase
  const opcoesCidade = useMemo(() => {
    return [...new Set((fornecedoresBase || []).map(c => c.cidade).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [fornecedoresBase]);

  // filtro composto para a tabela
  const filtroComposto = [
    filtroTexto?.trim(),
    filtroFornecedor !== "Todos" ? filtroFornecedor : "",
    filtroTipoFornecedor !== "Todos" ? filtroTipoFornecedor : "",
    filtroResponsavel !== "Todos" ? filtroResponsavel : "",
    filtroCidade || "" // "" = Todas
  ].filter(Boolean).join(" ").trim();

  // atualiza a tabela sempre que o filtro composto muda
  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [filtroComposto]);

  const rolarParaTabela = () =>
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const handleFiltrar = () => {
    rolarParaTabela();
  };

  const limparTodosFiltrosLocal = () => {
    setFiltroTexto("");
    setFiltroFornecedor("Todos");
    setFiltroTipoFornecedor("Todos");
    setFiltroResponsavel("Todos");
    setFiltroCidade(""); // "" = Todas
    setFornecedores(fornecedoresBase);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleLimparFiltros = () => {
    fetchTodos();
    limparTodosFiltrosLocal();
    setTimeout(() => {
      formularioRef.current?.limparEIrTopo?.();
      filtroTextoRef.current?.focus();
    }, 100);
  };

  // Handlers dos selects: aplicam filtro e descem; se escolher "Todos/Todas", limpam tudo
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

  // ❗ Mantida por compatibilidade (não usada no JSX), delega para a nova função
  const onChangeCidade = (e) => onChangeFiltroCidade(e.target.value);

  // ✅ Novo: mesma lógica do CadastroClientes ("" = Todas), usando fornecedoresBase
  const onChangeFiltroCidade = (valor) => {
    if (valor === "") {
      limparTodosFiltrosLocal();
      return;
    }
    setFiltroCidade(valor);
    // limpa filtros relacionados, como no exemplo de clientes
    setFiltroFornecedor("Todos");
    setFiltroResponsavel("Todos");

    let lista = [...fornecedoresBase];
    lista = lista.filter(c => (c.cidade || "") === valor);
    setFornecedores(lista);
    setTimeout(() => anchorTabelaRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleExportar = (tipo) => {
    console.log("Exportar:", tipo);
  };

  // salvar/novo
  const handleSalvar = async () => {
    try {
      await fetchTodos();
      setFornecedorSelecionado(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    }
  };

  // "Novo" da página já mostra codigo_fornecedor
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

  return (
    <div className="pagina-cadastro-fornecedores">
      <h1 className="titulo-pagina">🪪 Cadastro de Fornecedores</h1>

      {/* Faixa filtro texto */}
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

      {/* Filtros: Fornecedor, Tipo de Fornecedor, Responsável, Cidade */}
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

        {/* ✅ Cidade: agora usa opções dinâmicas de fornecedoresBase e "" = Todas */}
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

      {/* Âncora do formulário */}
      <div ref={anchorFormRef} />

      <div className="formulario-container">
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

      {/* Cabeçalho centralizado da Tabela */}
      <div className="cabecalho-tabela">
        <h2 className="subtitulo">Tabela de Fornecedores</h2>
      </div>

      {/* Tabela */}
      <div ref={anchorTabelaRef} className="tabela-wrapper">
        <TabelaFornecedores
          filtro={filtroComposto}
          refreshKey={refreshKey}
          fornecedores={fornecedores}
          onEditar={(f) => {
            setFornecedorSelecionado(f);
            setTimeout(() => anchorFormRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }}
          onExportar={handleExportar}
        />
      </div>

      {/* Voltar ao topo */}
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
