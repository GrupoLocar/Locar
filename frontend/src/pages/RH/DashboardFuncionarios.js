// /src/pages/RH/DashboardFuncionarios.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import './DashboardFuncionarios.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA66CC', '#33B5E5'];

// >>> NOVO: conjunto de situações consideradas
const ALLOWED_STATUS = new Set(['Ativo', 'Aprovar', 'Entrevistar']);

// >>> NOVO: utilitários para filtrar e agrupar
const filtrarSituacao = (arr = []) => arr.filter(f => ALLOWED_STATUS.has(String(f.situacao || '').trim()));

const contarPorCampo = (arr, campo) => {
    const mapa = new Map();
    for (const item of arr) {
        const key = String(item[campo] ?? '').trim() || 'Não informado';
        mapa.set(key, (mapa.get(key) || 0) + 1);
    }
    return Array.from(mapa.entries()).map(([k, v]) => ({ [campo]: k, count: v }));
};

const distribuirFilhos = (arr) => {
    const mapa = new Map();
    for (const item of arr) {
        const n = Number.isFinite(+item.filhos) ? parseInt(item.filhos, 10) : 0;
        const key = isNaN(n) ? '0' : String(n);
        mapa.set(key, (mapa.get(key) || 0) + 1);
    }
    // ordenar por número
    return Array.from(mapa.entries())
        .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
        .map(([k, v]) => ({ filhos: k, count: v }));
};

function DashboardFuncionarios() {
    const [dados, setDados] = useState(null);           // { estado_civil:[], sexo:[], filhos:[] }
    const [perfilIdeal, setPerfilIdeal] = useState([]); // lista já filtrada por situacao
    const [perfilConfig, setPerfilConfig] = useState({
        idade_min: '',
        idade_max: '',
        tempo_habilitacao_min: '',
        estado_civil: '',
        filhos_min: ''
    });

    const salvarConfiguracao = async () => {
        const API_URL = process.env.REACT_APP_API_URL;
        try {
            await axios.post(`${API_URL}/api/funcionarios/perfil-ideal`, perfilConfig);
            // Recarrega lista já considerando filtro de situacao
            await carregarPerfilIdeal();
        } catch (err) {
            console.error('Erro ao salvar configuração:', err);
            alert('Erro ao salvar configuração.');
        }
    };

    const exportarDados = (formato) => {
        if (!perfilIdeal || perfilIdeal.length === 0) {
            alert("Nenhum dado disponível para exportação.");
            return;
        }

        // >>> NOVO: ordenar por nome
        const listaOrdenada = [...perfilIdeal].sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
        );

        const dadosExportacao = listaOrdenada.map(f => ({
            Nome: f.nome,
            Idade: f.idade,
            'Estado Civil': f.estado_civil,
            Filhos: f.filhos,
            'Tempo de Habilitação': `${f.tempoHabilitacao} anos`,
            'Categoria CNH': f.categoria_cnh
        }));

        if (formato === 'xlsx' || formato === 'csv') {
            const ws = XLSX.utils.json_to_sheet(dadosExportacao);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "PerfilIdeal");
            const fileType = formato === 'csv' ? 'csv' : 'xlsx';
            const fileName = `perfil_ideal.${fileType}`;
            const wbout = XLSX.write(wb, { bookType: fileType, type: 'array' });
            saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
        }

        if (formato === 'pdf') {
            const doc = new jsPDF();
            doc.text("Perfil Ideal de Contratação", 14, 14);
            autoTable(doc, {
                startY: 20,
                head: [[
                    "Nome", "Idade", "Estado Civil", "Filhos", "Tempo de Habilitação", "Categoria CNH"
                ]],
                body: dadosExportacao.map(item => [
                    item.Nome,
                    item.Idade,
                    item['Estado Civil'],
                    item.Filhos,
                    item['Tempo de Habilitação'],
                    item['Categoria CNH']
                ])
            });
            doc.save("perfil_ideal.pdf");
        }
    };

    useEffect(() => {
        const API_URL = process.env.REACT_APP_API_URL;
        axios.get(`${API_URL}/api/funcionarios/perfil-ideal-config`)
            .then(res => {
                if (res.data) setPerfilConfig(res.data);
            })
            .catch(err => console.error('Erro ao carregar configuração:', err));
    }, []);

    // >>> NOVO: carrega lista completa de funcionários e calcula dashboards com o filtro de situacao
    const carregarDashboards = async () => {
        const API_URL = process.env.REACT_APP_API_URL;
        try {
            // Preferimos a lista completa para recalcular com nosso filtro
            const { data: lista } = await axios.get(`${API_URL}/api/funcionarios`);
            const filtrados = filtrarSituacao(lista);

            const ec = contarPorCampo(filtrados, 'estado_civil'); // [{estado_civil, count}]
            const sx = contarPorCampo(filtrados, 'sexo');         // [{sexo, count}]
            const fh = distribuirFilhos(filtrados);               // [{filhos, count}]

            setDados({ estado_civil: ec, sexo: sx, filhos: fh });
        } catch (err) {
            console.error('Erro ao carregar funcionários para dashboards:', err);
            // fallback: mantém estado, mas mostra mensagem
            setDados({ estado_civil: [], sexo: [], filhos: [] });
        }
    };

    // >>> NOVO: carrega Perfil Ideal já filtrando por situacao e recalcula tempo de habilitação
    const carregarPerfilIdeal = async () => {
        const API_URL = process.env.REACT_APP_API_URL;
        try {
            const { data } = await axios.get(`${API_URL}/api/funcionarios/perfil-ideal`);
            const listaFiltrada = filtrarSituacao(Array.isArray(data) ? data : []);

            const perfilComTempoCalculado = listaFiltrada.map(f => {
                let tempoHabilitacao = f.tempoHabilitacao;

                if (f.emissao_cnh) {
                    const dataEmissao = new Date(f.emissao_cnh);
                    const hoje = new Date();
                    let anos = hoje.getFullYear() - dataEmissao.getFullYear();

                    // Corrige se o mês/dia ainda não foi atingido este ano
                    const mesAniversario = dataEmissao.getMonth();
                    const diaAniversario = dataEmissao.getDate();
                    if (
                        hoje.getMonth() < mesAniversario ||
                        (hoje.getMonth() === mesAniversario && hoje.getDate() < diaAniversario)
                    ) {
                        anos--;
                    }
                    tempoHabilitacao = Math.max(0, anos);
                }

                return { ...f, tempoHabilitacao };
            });

            setPerfilIdeal(perfilComTempoCalculado);
        } catch (err) {
            console.error(err);
            setPerfilIdeal([]);
        }
    };

    useEffect(() => {
        carregarDashboards();
        carregarPerfilIdeal();
    }, []);

    if (!dados) return <p>Carregando dashboard...</p>;

    return (
        <>
            <div className="titulo-dashboard">
                <h1>📊 Dashboard de Funcionários</h1>
            </div>

            <div className="dashboard-container">
                <div className="grafico-box">
                    <h4>Estado Civil</h4>
                    <PieChart width={300} height={250}>
                        <Pie
                            data={dados.estado_civil}
                            dataKey="count"
                            nameKey="estado_civil"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                        >
                            {dados.estado_civil.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </div>

                <div className="grafico-box">
                    <h4>Sexo</h4>
                    <PieChart width={300} height={250}>
                        <Pie
                            data={dados.sexo}
                            dataKey="count"
                            nameKey="sexo"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                        >
                            {dados.sexo.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </div>

                <div className="grafico-box">
                    <h4>Quantidade de Filhos</h4>
                    <BarChart width={300} height={250} data={dados.filhos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="filhos" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                </div>

                <div className="perfil-container">
                    <div className="config-perfil-box">
                        <h3>📋Configurar Perfil Ideal</h3>

                        <label>
                            Idade Mínima:
                            <input
                                type="number"
                                min={0}
                                max={99}
                                value={perfilConfig.idade_min}
                                onChange={e => {
                                    const val = +e.target.value;
                                    setPerfilConfig(prev => ({
                                        ...prev,
                                        idade_min: val,
                                        idade_max: Math.max(prev.idade_max, val)
                                    }));
                                }}
                            />
                        </label>

                        <label>
                            Idade Máxima:
                            <input
                                type="number"
                                min={perfilConfig.idade_min || 0}
                                max={99}
                                value={perfilConfig.idade_max}
                                onChange={e =>
                                    setPerfilConfig({ ...perfilConfig, idade_max: +e.target.value })
                                }
                            />
                        </label>

                        <label>
                            Tempo Habilitação Mín.:
                            <input
                                type="number"
                                min={0}
                                max={99}
                                value={perfilConfig.tempo_habilitacao_min}
                                onChange={e =>
                                    setPerfilConfig({ ...perfilConfig, tempo_habilitacao_min: +e.target.value })
                                }
                            />
                        </label>

                        <label>
                            Estado Civil:
                            <select
                                value={perfilConfig.estado_civil}
                                onChange={e => setPerfilConfig({ ...perfilConfig, estado_civil: e.target.value })}
                            >
                                <option value="Casado(A)">Casado(a)</option>
                                <option value="Solteiro(A)">Solteiro(a)</option>
                                <option value="Divorciado(A)">Divorciado(a)</option>
                                <option value="Viúvo(A)">Viúvo(a)</option>
                            </select>
                        </label>

                        <label>
                            Filhos (mín.):
                            <input
                                type="number"
                                min={0}
                                max={9}
                                value={perfilConfig.filhos_min}
                                onChange={e =>
                                    setPerfilConfig({ ...perfilConfig, filhos_min: +e.target.value })
                                }
                            />
                        </label>
                        <button className="botao-salvar-config" onClick={salvarConfiguracao}>
                            Salvar Configuração
                        </button>
                    </div>

                    <div className="resumo-box">
                        <div className="titulo-perfil-ideal-container">
                            <h3 className="titulo-perfil-ideal">Perfil Ideal de Contratação</h3>
                            <select
                                className="botao-exportar"
                                onChange={(e) => {
                                    exportarDados(e.target.value);
                                    e.target.value = "";
                                }}
                            >
                                <option value="">Exportar</option>
                                <option value="xlsx">Excel (.xlsx)</option>
                                <option value="csv">CSV (.csv)</option>
                                <option value="pdf">PDF (.pdf)</option>
                            </select>
                        </div>

                        <table className="tabela-perfil-ideal">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Idade</th>
                                    <th>Estado Civil</th>
                                    <th>Filhos</th>
                                    <th>Tempo de Habilitação</th>
                                    <th>Categoria CNH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perfilIdeal.map((f, index) => (
                                    <tr key={index}>
                                        <td>{f.nome}</td>
                                        <td>{f.idade}</td>
                                        <td>{f.estado_civil}</td>
                                        <td>{f.filhos}</td>
                                        <td>{f.tempoHabilitacao} anos</td>
                                        <td>{f.categoria_cnh}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default DashboardFuncionarios;
