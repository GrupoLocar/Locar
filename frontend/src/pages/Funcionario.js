import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import FormularioFuncionario from '../components/FormularioFuncionario';
import TabelaFuncionarios from '../components/TabelaFuncionarios';
import SituacaoFuncionario from '../components/SituacaoFuncionario';
import StatusCNH from '../components/StatusCNH';
import CategoriaCNH from '../components/CategoriaCNH';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const Funcionario = () => {
  const nomeRef = useRef(null);
  const tabelaRef = useRef(null);
  const formularioRef = useRef(null);
  const filtroFoiAplicadoRef = useRef(false);

  const [filtro, setFiltro] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [statusSelecionado, setStatusSelecionado] = useState(null);
  const [situacaoSelecionada, setSituacaoSelecionada] = useState(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  const fetchData = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/funcionarios/`)
      .then(res => setFuncionarios(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const aplicarFiltrosLocais = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/funcionarios`);
        let lista = res.data;

        if (situacaoSelecionada) {
          lista = lista.filter(f => f.situacao === situacaoSelecionada);
        }

        if (categoriaSelecionada) {
          lista = lista.filter(f => f.categoria === categoriaSelecionada);
        }

        if (statusSelecionado) {
          const calcularStatusCNH = (validade) => {
            const hoje = new Date();
            const dataValidade = new Date(validade);
            const dias = Math.ceil((dataValidade - hoje) / 864e5);
            if (isNaN(dias)) return '';
            if (dias < 0) return 'Vencido';
            if (dias <= 30) return 'A Vencer';
            return 'Prazo';
          };

          lista = lista.filter(f => calcularStatusCNH(f.validade_cnh) === statusSelecionado);
        }

        setFuncionarios(lista);

      } catch (error) {
        console.error('Erro ao aplicar filtros locais:', error);
      }
    };

    aplicarFiltrosLocais();
  }, [situacaoSelecionada, categoriaSelecionada, statusSelecionado]);

  const limparTodosFiltros = () => {
    setFiltro('');
    setFiltroCategoria(null);
    setStatusSelecionado(null);
    setSituacaoSelecionada(null);
    fetchData();
  };

  const handleFiltrar = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/funcionarios/filtro?busca=${encodeURIComponent(filtro)}`
      );
      setFuncionarios(response.data);
      setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      alert('Erro ao filtrar dados.');
    }
  };

  // ---------- AJUSTES DE EXPORTAÇÃO ----------
  const CAMPOS_ORDEM = [
    'nome', 'profissao', 'sexo', 'situacao', 'contrato', 'pj',
    'data_nascimento', 'data_admissao', 'data_demissao', 'dataUltimoServicoPrestado',
    'telefone', 'endereco', 'complemento', 'bairro', 'municipio', 'estado', 'cep',
    'banco', 'agencia', 'conta', 'pix', 'email', 'cpf', 'rg', 'estado_civil', 'filhos',
    'cnh', 'categoria', 'emissao_cnh', 'validade_cnh',
    'indicado', 'nome_familiar', 'contato_familiar', 'observacao',
    'updatedAt', 'data_envio_utc', 'data_envio_local',
  ];

  const CAMPOS_DATA_BR = new Set([
    'data_nascimento',
    'validade_cnh',
    'data_admissao',
    'data_demissao',
    'dataUltimoServicoPrestado',
    'emissao_cnh'
  ]);

  const formatDateBR = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const mapValorCampo = (k, f) => {
    const raw = f?.[k];
    if (CAMPOS_DATA_BR.has(k)) return formatDateBR(raw);
    if (raw === null || raw === undefined) return '';
    return raw;
  };

  const prepararLinhasOrdenadas = (lista) => {
    // remove _id e arquivos apenas não incluindo-os nas colunas
    return lista
      .slice()
      .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))
      .map(f => CAMPOS_ORDEM.map(k => mapValorCampo(k, f)));
  };

  const exportarCSV = () => {
    if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
      alert('Nenhum dado disponível para exportar.');
      return;
    }
    const rows = prepararLinhasOrdenadas(funcionarios);
    const csv = Papa.unparse({
      fields: CAMPOS_ORDEM,
      data: rows
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'funcionarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarXLSX = () => {
    if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
      alert('Nenhum dado disponível para exportar.');
      return;
    }
    const rows = prepararLinhasOrdenadas(funcionarios);
    const aoa = [CAMPOS_ORDEM, ...rows]; // header + data
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Funcionários');
    XLSX.writeFile(workbook, 'funcionarios.xlsx');
  };
  // ---------- FIM DOS AJUSTES ----------

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
        {/* <button className="botao" onClick={handleImport}>Importar</button> */}
        <button className="botao" onClick={() => {
          setFuncionarioSelecionado(null);
          setTimeout(() => formularioRef.current?.dispararNovo(), 100);
        }}>
          Novo
        </button>
      </div>

      <div style={{
        // background: 'linear-gradient(135deg, #dfe9f3 0%, #f5f7fa 100%)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'start',
        gap: '30px',
        padding: '10px',
      }}>
        <SituacaoFuncionario
          funcionarios={funcionarios}
          onFiltrarSituacao={(situacao) => {
            // toggle somente a situação
            setSituacaoSelecionada(prev => (prev === situacao ? null : situacao));
            // rolar para a tabela quando aplicar algum valor
            if (situacaoSelecionada !== situacao) {
              setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
          }}
          situacaoSelecionada={situacaoSelecionada}
        />

        <StatusCNH
          funcionarios={funcionarios}
          onFiltrarStatusCNH={(status) => {
            // toggle somente o status
            setStatusSelecionado(prev => (prev === status ? null : status));
            if (statusSelecionado !== status) {
              setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
          }}
          statusSelecionado={statusSelecionado}
        />

        <CategoriaCNH
          onFiltrarCategoria={(categoria) => {
            // toggle somente a categoria
            setCategoriaSelecionada(prev => (prev === categoria ? null : categoria));
            if (categoriaSelecionada !== categoria) {
              setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
          }}
          categoriaSelecionada={categoriaSelecionada}
        />

      </div>

      <div ref={nomeRef}></div>

      <div style={{
      // <div className="formulario-container" style={{
        // background: 'linear-gradient(135deg, #f5f7fa, #e2eafc)',
        padding: '0',
        borderRadius: '12px',
      }}>
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

      <h1 style={{ marginTop: '50px', textAlign: 'center' }}>Tabela de Funcionários</h1>

      <div style={{
        marginTop: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        position: 'relative'
      }}>
        <div style={{ position: 'relative' }}>
          <button className="botao" ref={tabelaRef} onClick={() => setExportOpen(!exportOpen)}>
            Exportar Tabela
          </button>
          {exportOpen && (
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '1px solid #ccc',
              borderRadius: '12px',
              padding: '10px',
              zIndex: 999
            }}>
              <button className="botao" onClick={exportarCSV}>Exportar CSV</button><br />
              <button className="botao" onClick={exportarXLSX}>Exportar XLSX</button>
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '20px',
      }}>
        <TabelaFuncionarios
          funcionarios={funcionarios}
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
