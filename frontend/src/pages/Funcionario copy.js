import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import FormularioFuncionario from '../components/FormularioFuncionario';
import TabelaFuncionarios from '../components/TabelaFuncionarios';
import SituacaoFuncionario from '../components/SituacaoFuncionario';
import StatusCNH from '../components/StatusCNH';
import CategoriaCNH from '../components/CategoriaCNH';
import * as XLSX from "xlsx";
import Papa from "papaparse";

const Funcionario = () => {
  const nomeRef = useRef(null);
  const tabelaRef = useRef(null);
  const [filtro, setFiltro] = useState("");
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroSituacao, setFiltroSituacao] = useState(null);
  const [filtroStatusCNH, setFiltroStatusCNH] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [statusSelecionado, setStatusSelecionado] = useState(null);
  const [situacaoSelecionada, setSituacaoSelecionada] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  const formularioRef = useRef(null);

  const fetchData = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/funcionarios/`)
      .then(res => setFuncionarios(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const limparTodosFiltros = () => {
    setFiltro('');
    setFiltroCategoria(null);
    setSituacaoSelecionada(null);
    setFiltroStatusCNH(null);
    setStatusSelecionado(null);
    setCategoriaSelecionada(null);
    fetchData();
  };

  const handleFiltrarCategoria = (categoria) => {
    limparTodosFiltros();
    setFiltroCategoria(categoria);
    setCategoriaSelecionada(categoria);
    setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleFiltrarStatusCNH = (status) => {
    limparTodosFiltros();
    setStatusSelecionado(status);
    setFiltroStatusCNH(status);
    setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleFiltrarSituacao = (situacao) => {
    limparTodosFiltros();
    setSituacaoSelecionada(situacao);
    setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const calcularStatusCNH = (validade_cnh) => {
    const today = new Date();
    const validade = new Date(validade_cnh);
    const diffTime = validade - today;
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (dias < 0) return 'Vencido';
    if (dias <= 30) return 'A Vencer';
    if (dias > 30) return 'Prazo';
    return '';
  };

  const funcionariosFiltrados = funcionarios
    .filter(f => !filtroCategoria || f.categoria === filtroCategoria)
    .filter(f => !situacaoSelecionada || f.situacao === situacaoSelecionada)
    .filter(f => {
      if (!filtroStatusCNH) return true;
      const statusCalculado = calcularStatusCNH(f.validade_cnh);
      return statusCalculado === filtroStatusCNH;
    })
    .sort((a, b) => (a?.nome ?? '').localeCompare(b?.nome ?? ''));

  const handleFiltrar = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/funcionarios/filtro?busca=${encodeURIComponent(filtro)}`);
      setFuncionarios(response.data);
      setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      alert('Erro ao filtrar dados.');
    }
  };

  const exportarCSV = () => {
    if (!Array.isArray(funcionariosFiltrados) || funcionariosFiltrados.length === 0) {
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    const csv = Papa.unparse(funcionariosFiltrados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "funcionarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarXLSX = () => {
    if (!Array.isArray(funcionariosFiltrados) || funcionariosFiltrados.length === 0) {
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(funcionariosFiltrados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Funcionarios");
    XLSX.writeFile(workbook, "funcionarios.xlsx");
  };

  return (
    <div className="pagina-cadastro-funcionario">
      <h1 style={{ textAlign: 'center' }}>🧑‍💼Cadastro de Funcionários</h1>

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

        <button className="botao" onClick={() => {
          setFuncionarioSelecionado(null);
          setTimeout(() => formularioRef.current?.dispararNovo(), 100);
        }}>
          Novo
        </button>

      </div>

      <div style={{
        background: 'linear-gradient(135deg, #dfe9f3 0%, #f5f7fa 100%)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'start',
        gap: '30px',
        padding: '10px',
      }}>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #dfe9f3 0%, #f5f7fa 100%)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'start',
        gap: '30px',
      }}>
        <SituacaoFuncionario
          funcionarios={funcionarios}
          onFiltrarSituacao={handleFiltrarSituacao}
          situacaoSelecionada={situacaoSelecionada}
        />
        <StatusCNH
          funcionarios={funcionarios}
          onFiltrarStatusCNH={handleFiltrarStatusCNH}
          statusSelecionado={statusSelecionado}
        />
        <CategoriaCNH
          onFiltrarCategoria={handleFiltrarCategoria}
          categoriaSelecionada={categoriaSelecionada}
        />
      </div>

      <div ref={nomeRef}></div>

      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa, #e2eafc)',
        padding: '0px',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
      }} className="formulario-container">
        <FormularioFuncionario
          ref={formularioRef}
          funcionario={funcionarioSelecionado}
          onNovo={() => setFuncionarioSelecionado(null)}
          onSalvar={() => {
            fetchData();
            setFuncionarioSelecionado(null);
          }}
        />
      </div>

      <div>
        <h1 style={{ marginTop: '50px', textAlign: 'center' }}>Tabela de Funcionários</h1>
      </div>

      <div style={{
        marginTop: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        position: 'relative'
      }}>
        <div style={{ position: 'relative' }}>
          <button className="botao" ref={tabelaRef} onClick={() => setExportOpen(!exportOpen)}>Exportar Tabela</button>
          {exportOpen && (
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#f9f9f9',
              border: '1px solid #ccc',
              borderRadius: '12px',
              padding: '10px',
              zIndex: 999
            }}>
              <button onClick={exportarCSV} type="button">Exportar CSV</button><br />
              <button onClick={exportarXLSX} type="button">Exportar XLSX</button>
            </div>
          )}
        </div>

        <div>
          <button className="botao" onClick={limparTodosFiltros}>Limpar Filtro</button>
        </div>
      </div>

      <div className="tabela-wrapper" style={{
        background: 'linear-gradient(135deg, #dfe9f3 0%, #f5f7fa 100%)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <TabelaFuncionarios
          funcionarios={funcionariosFiltrados}
          onEditar={(func) => {
            setFuncionarioSelecionado(func);
            setTimeout(() => nomeRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}
        />
      </div>
    </div>
  );
};

export default Funcionario;
