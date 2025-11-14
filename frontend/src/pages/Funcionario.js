// src/pages/Funcionario.js
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
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
  const [mostrarPainelFiltros, setMostrarPainelFiltros] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // helper para campos booleanos tipo PJ/MEI
  const isMarcado = (valor) => {
    if (valor === true) return true;
    if (typeof valor === 'string') {
      const v = valor.trim().toLowerCase();
      return v === 'true' || v === 'sim' || v === '1';
    }
    if (typeof valor === 'number') {
      return valor === 1;
    }
    return false;
  };

  const isMeiFuncionario = (f) => {
    if (!f) return false;
    if (isMarcado(f.mei)) return true;

    // considera qualquer contrato que contenha "mei" (ex.: "Mei", "MEI", "MEI PJ", etc.)
    const contratoNorm = (f.contrato ?? '')
      .toString()
      .trim()
      .toLowerCase();

    return contratoNorm.includes('mei');
  };

  const fetchData = () => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/funcionarios/`)
      .then((res) => {
        const normalizados = (res.data || []).map((f) => ({
          ...f,
          mei: isMeiFuncionario(f),
        }));
        setFuncionarios(normalizados);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const aplicarFiltrosLocais = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/funcionarios`
        );

        let lista = (res.data || []).map((f) => ({
          ...f,
          mei: isMeiFuncionario(f),
        }));

        if (situacaoSelecionada) {
          const sitNorm = situacaoSelecionada
            .toString()
            .trim()
            .toLowerCase();

          if (sitNorm === 'pj') {
            lista = lista.filter((f) => isMarcado(f.pj));
          } else if (sitNorm === 'mei') {
            lista = lista.filter((f) => isMeiFuncionario(f));
          } else {
            lista = lista.filter(
              (f) =>
                (f.situacao ?? '')
                  .toString()
                  .trim()
                  .toLowerCase() === sitNorm
            );
          }
        }

        if (categoriaSelecionada) {
          lista = lista.filter((f) => f.categoria === categoriaSelecionada);
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

          lista = lista.filter(
            (f) => calcularStatusCNH(f.validade_cnh) === statusSelecionado
          );
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
        `${process.env.REACT_APP_API_URL}/api/funcionarios/filtro?busca=${encodeURIComponent(
          filtro
        )}`
      );
      const normalizados = (response.data || []).map((f) => ({
        ...f,
        mei: isMeiFuncionario(f),
      }));
      setFuncionarios(normalizados);
      setTimeout(
        () => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }),
        100
      );
    } catch (error) {
      alert('Erro ao filtrar dados.');
    }
  };

  // ---------- AJUSTES DE EXPORTAÇÃO ----------
  const CAMPOS_ORDEM = [
    'nome',
    'profissao',
    'sexo',
    'situacao',
    'contrato',
    'pj',
    'data_nascimento',
    'data_admissao',
    'data_demissao',
    'dataUltimoServicoPrestado',
    'telefone',
    'endereco',
    'complemento',
    'bairro',
    'municipio',
    'estado',
    'cep',
    'banco',
    'agencia',
    'conta',
    'pix',
    'email',
    'cpf',
    'rg',
    'estado_civil',
    'filhos',
    'cnh',
    'categoria',
    'emissao_cnh',
    'validade_cnh',
    'indicado',
    'nome_familiar',
    'contato_familiar',
    'observacao',
    'updatedAt',
    'data_envio_utc',
    'data_envio_local',
  ];

  const CAMPOS_DATA_BR = new Set([
    'data_nascimento',
    'validade_cnh',
    'data_admissao',
    'data_demissao',
    'dataUltimoServicoPrestado',
    'emissao_cnh',
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
      .map((f) => CAMPOS_ORDEM.map((k) => mapValorCampo(k, f)));
  };

  const exportarCSV = () => {
    if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
      alert('Nenhum dado disponível para exportar.');
      return;
    }
    const rows = prepararLinhasOrdenadas(funcionarios);
    const csv = Papa.unparse({
      fields: CAMPOS_ORDEM,
      data: rows,
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
    const aoa = [CAMPOS_ORDEM, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Funcionários');
    XLSX.writeFile(workbook, 'funcionarios.xlsx');
  };

  return (
    <div className="pagina-cadastro-funcionario">
      <h1 style={{ textAlign: 'center' }}>🧑‍💼Cadastro de Funcionários</h1>

      {/* BARRA AZUL COM FILTRO, NOVO, ÍCONE E EXPORTAR */}
      <div
        style={{
          background: '#181893',
          padding: '30px',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          borderRadius: '12px',
          alignItems: 'center',
        }}
      >
        <input
          style={{ width: '300px' }}
          type="text"
          placeholder="Filtrar por qualquer campo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button className="botao" onClick={handleFiltrar}>
          Filtrar
        </button>
        <button className="botao" onClick={limparTodosFiltros}>
          Limpar Filtro
        </button>
        <button
          className="botao"
          onClick={() => {
            setFuncionarioSelecionado(null);
            setMostrarFormulario(true);
            setTimeout(() => formularioRef.current?.dispararNovo(), 100);
          }}
        >
          Novo
        </button>

        {/* ÍCONE DO FILTRO (MOSTRA/OCULTA QUADROS DE SITUAÇÃO/STATUS/CATEGORIA) */}
        <img
          src="/filtro.png"
          alt="Mostrar/ocultar filtros avançados"
          style={{ width: '40px', height: '40px', cursor: 'pointer' }}
          onClick={() => setMostrarPainelFiltros((prev) => !prev)}
        />

        {/* BOTÃO EXPORTAR AO LADO DO FILTRO, COM AS MESMAS CLASSES DE ESTILIZAÇÃO */}
        <div className="exportar-container" style={{ marginBottom: 0 }}>
          <div className="exportar-dropdown">
            <button
              className="botao"
              ref={tabelaRef}
              onClick={() => setExportOpen((v) => !v)}
            >
              Exportar ▾
            </button>
            {exportOpen && (
              <div className="exportar-menu">
                <button className="botao" onClick={exportarCSV}>
                  Exportar .CSV
                </button>
                <br />
                <button className="botao" onClick={exportarXLSX}>
                  Exportar .XLSX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUADROS DE SITUAÇÃO / STATUS / CATEGORIA – INICIAM OCULTOS E SÃO CONTROLADOS PELO ÍCONE */}
      {mostrarPainelFiltros && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'start',
            gap: '30px',
            padding: '10px',
          }}
        >
          <SituacaoFuncionario
            funcionarios={funcionarios}
            onFiltrarSituacao={(situacao) => {
              setSituacaoSelecionada((prev) =>
                prev === situacao ? null : situacao
              );
              if (situacaoSelecionada !== situacao) {
                setTimeout(
                  () =>
                    tabelaRef.current?.scrollIntoView({
                      behavior: 'smooth',
                    }),
                  100
                );
              }
            }}
            situacaoSelecionada={situacaoSelecionada}
          />

          <StatusCNH
            funcionarios={funcionarios}
            onFiltrarStatusCNH={(status) => {
              setStatusSelecionado((prev) =>
                prev === status ? null : status
              );
              if (statusSelecionado !== status) {
                setTimeout(
                  () =>
                    tabelaRef.current?.scrollIntoView({
                      behavior: 'smooth',
                    }),
                  100
                );
              }
            }}
            statusSelecionado={statusSelecionado}
          />

          <CategoriaCNH
            onFiltrarCategoria={(categoria) => {
              setCategoriaSelecionada((prev) =>
                prev === categoria ? null : categoria
              );
              if (categoriaSelecionada !== categoria) {
                setTimeout(
                  () =>
                    tabelaRef.current?.scrollIntoView({
                      behavior: 'smooth',
                    }),
                  100
                );
              }
            }}
            categoriaSelecionada={categoriaSelecionada}
          />
        </div>
      )}

      <div ref={nomeRef}></div>

      {/* FORMULÁRIO – começa oculto, aparece no botão NOVO e some após Salvar ou Cancelar */}
      <div
        style={{
          padding: '0',
          borderRadius: '12px',
          display: mostrarFormulario ? 'block' : 'none',
        }}
      >
        <FormularioFuncionario
          ref={formularioRef}
          funcionario={funcionarioSelecionado}
          onNovo={() => {
            setFuncionarioSelecionado(null);
          }}
          onSalvar={() => {
            fetchData();
            setFuncionarioSelecionado(null);
            setMostrarFormulario(false);
          }}
          onCancelar={() => {
            setFuncionarioSelecionado(null);
            setMostrarFormulario(false);
          }}
        />
      </div>

      {/* TABELA */}
      <div
        style={{
          padding: '0px',
        }}
      >
        <TabelaFuncionarios
          funcionarios={funcionarios}
          onEditar={(func) => {
            setFuncionarioSelecionado(func);
            setMostrarFormulario(true);
            setTimeout(
              () => nomeRef.current?.scrollIntoView({ behavior: 'smooth' }),
              100
            );
          }}
        />
      </div>
    </div>
  );
};

export default Funcionario;
