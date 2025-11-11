// src/pages/ImportarCadastros.js
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import FormularioFuncionario from '../components/FormularioFuncionario';
import TabelaFuncionarios from '../components/TabelaFuncionarios';
import * as XLSX from "xlsx";
import Papa from "papaparse";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { formatCPF, formatRG, formatCNH, formatTelefone, formatCEP, formatDateInput, formatDateISO } from "../utils/funcao";

const unmask = (v) => v ? v.replace(/\D/g, '') : '';

const ImportarCadastros = () => {
    const nomeRef = useRef(null);
    const tabelaRef = useRef(null);

    const [form, setForm] = useState({});
    const [funcionarios, setFuncionarios] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [exportOpen, setExportOpen] = useState(false);
    const navigate = useNavigate();

    // Conta quantos funcionários têm situacao === "Aprovar"
    const contarParaImportar = () =>
        funcionarios.filter(f => f.situacao === 'Aprovar').length;

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
        fetchData();
    };

    const funcionariosFiltrados = funcionarios.filter(f =>
        Object.values(f).some(val => String(val).toLowerCase().includes(filtro.toLowerCase()))
    );

    const handleFiltrar = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/funcionarios/filtro?busca=${encodeURIComponent(filtro)}`);
            setFuncionarios(response.data);
            setTimeout(() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (error) {
            alert('Erro ao filtrar dados.');
        }
    };

    const handleEditar = (func) => {
        setForm({
            ...func,
            cpf: formatCPF(func.cpf),
            rg: formatRG(func.rg),
            cnh: formatCNH(func.cnh),
            telefone: formatTelefone(func.telefone),
            cep: formatCEP(func.cep),
            dataNascimento: formatDateInput(func.dataNascimento),
            dataAdmissao: formatDateInput(func.dataAdmissao),
            dataValidadeCNH: formatDateInput(func.dataValidadeCNH),
            dataUltimoServicoPrestado: formatDateInput(func.dataUltimoServicoPrestado),
            filhos: func.filhos?.toString() || '',
            categoria: func.categoria || ''
        });
        setEditId(func._id);
        setIsEdit(true);
        setTimeout(() => nomeRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cpf') return setForm(f => ({ ...f, cpf: formatCPF(value) }));
        if (name === 'rg') return setForm(f => ({ ...f, rg: formatRG(value) }));
        if (name === 'cnh') return setForm(f => ({ ...f, cnh: formatCNH(value) }));
        if (name === 'telefone') return setForm(f => ({ ...f, telefone: formatTelefone(value) }));
        if (name === 'cep') return setForm(f => ({ ...f, cep: formatCEP(value) }));
        setForm({ ...form, [name]: value });
    };

    const handleSalvar = () => {
        const dados = {
            ...form,
            rg: unmask(form.rg),
            telefone: unmask(form.telefone),
            cep: unmask(form.cep),
            filhos: Number(form.filhos) || 0,
            dataNascimento: formatDateISO(form.dataNascimento),
            dataAdmissao: formatDateISO(form.dataAdmissao),
            dataValidadeCNH: formatDateISO(form.dataValidadeCNH),
            dataUltimoServicoPrestado: formatDateISO(form.dataUltimoServicoPrestado),
        };

        const apiCall = isEdit
            ? axios.put(`${process.env.REACT_APP_API_URL}/api/funcionarios/${editId}`, dados)
            : axios.post(`${process.env.REACT_APP_API_URL}/api/funcionarios`, dados);

        apiCall.then(() => {
            Swal.fire('Importação', 'Dados salvos com sucesso.', 'success');
            setForm({});
            setIsEdit(false);
            fetchData();
        }).catch(err => {
            console.error(err);
            Swal.fire('Erro', 'Falha ao salvar dados.', 'error');
        });
    };

    const exportarCSV = () => {
        const csv = Papa.unparse(funcionariosFiltrados);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "funcionarios.csv");
        link.click();
    };

    const exportarXLSX = () => {
        const worksheet = XLSX.utils.json_to_sheet(funcionariosFiltrados);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Funcionarios");
        XLSX.writeFile(workbook, "funcionarios.xlsx");
    };

    return (
        <div className="pagina-importar-cadastros">
            <h1 style={{ textAlign: 'center' }}>📥 Importar Cadastros Web</h1>

            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <input
                    style={{ width: '300px' }}
                    type="text"
                    placeholder="Filtrar por qualquer campo..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                />
                <button onClick={handleFiltrar}>Filtrar</button>
                <button onClick={limparTodosFiltros}>Limpar Filtro</button>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #dfe9f3 0%, #f5f7fa 100%)',
                borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'start', gap: '30px', padding: '10px',
            }}>
                {/* --- contador de registros a importar --- */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '16px',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                }}><br></br>
                    Registros para Importar:&nbsp;
                    <span style={{ color: 'red' }}>{contarParaImportar()}</span>
                    {/* ícone clicável para ir à tela Cadastro de Funcionários */}
                    <span
                        style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                        title="Ir para Cadastro de Funcionários"
                        onClick={() => navigate('/rh/funcionario')}
                    >
                        🧑‍💼
                    </span>
                    <br></br>
                    <div
                        style={{
                            padding: '12px 24px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <h2 style={{ margin: 0 }}>Formulário de Cadastro</h2>
                    </div>

                </div>
            </div>







            <div ref={nomeRef}></div>

            <div className="formulario-container" style={{
                background: 'linear-gradient(135deg, #f5f7fa, #e2eafc)',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
            }}>
                <FormularioFuncionario
                    form={form}
                    handleChange={handleChange}
                    handleSalvar={handleSalvar}
                    isEdit={isEdit}
                    disableEnvios={true}
                />
            </div>

            <div>
                <h1 style={{ marginTop: '50px', textAlign: 'center' }}>Tabela de Funcionários</h1>
            </div>

            <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <div>
                    <button ref={tabelaRef} onClick={() => setExportOpen(!exportOpen)}>Exportar Tabela</button>
                    {exportOpen && (
                        <div style={{
                            position: 'absolute', top: '40px', backgroundColor: '#f9f9f9',
                            border: '1px solid #ccc', borderRadius: '6px', padding: '10px'
                        }}>
                            <button onClick={exportarCSV}>Exportar CSV</button><br />
                            <button onClick={exportarXLSX}>Exportar XLSX</button>
                        </div>
                    )}
                </div>
                <div>
                    <button onClick={limparTodosFiltros}>Limpar Filtro</button>
                </div>
            </div>

            <div className="tabela-wrapper" style={{
                background: 'linear-gradient(135deg, #dfe9f3 0%, #f5f7fa 100%)',
                padding: '20px', borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
                <TabelaFuncionarios
                    funcionarios={funcionariosFiltrados}
                    onEditar={handleEditar}
                />
            </div>
        </div>
    );
};

export default ImportarCadastros;
