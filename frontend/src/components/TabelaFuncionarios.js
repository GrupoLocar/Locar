import React from 'react';
import './TabelaFuncionarios.css';
import { normalizarFuncionario } from '../utils/normalizarFuncionario';
import topoImg from '../img/topo.png';

/* ───────── helpers “à prova de NaN” ───────── */
const safeNum = (v) => (Number.isFinite(v) ? v : '');

const calculaIdade = (data_nascimento) => {
  if (!data_nascimento) return '';
  const nasc = new Date(data_nascimento);
  if (Number.isNaN(nasc)) return '';

  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mDiff = hoje.getMonth() - nasc.getMonth();

  if (mDiff < 0 || (mDiff === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return safeNum(idade);
};

const calculaDias = (validade_cnh) => {
  if (!validade_cnh) return '';
  const v = new Date(validade_cnh);
  if (Number.isNaN(v)) return '';

  const hoje = new Date();
  return safeNum(Math.ceil((v - hoje) / 864e5));
};

const statusCNH = (validade_cnh) => {
  const dias = calculaDias(validade_cnh);
  if (dias === '') return '';
  if (dias < 0) return 'Vencido';
  if (dias <= 30) return 'A Vencer';
  return 'Prazo';
};

const diasRestantes = calculaDias;

const TabelaFuncionarios = ({ funcionarios, onEditar }) => {
  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="tabela-wrapper">
      <table className="tabela-funcionarios">
        <thead>
          <tr style={{ backgroundColor: '#181893', color: 'white' }}>
            <th style={{ width: 500 }}>Nome</th>
            <th>Situação</th>
            <th style={{ width: 150 }}>Telefone</th>
            <th>Idade</th>
            <th>Status CNH</th>
            <th>Dias CNH</th>
            <th>Arquivos</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {[...funcionarios]
            .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))
            .map((func) => {
              const idade = calculaIdade(func.data_nascimento);
              const status = statusCNH(func.validade_cnh);
              const diasCNH = diasRestantes(func.validade_cnh);

              return (
                <tr key={func._id}>
                  <td>{func.nome}</td>
                  <td>{func.situacao}</td>
                  <td>{func.telefone}</td>
                  <td>{idade}</td>
                  <td
                    style={{
                      color:
                        status === 'Vencido'
                          ? 'red'
                          : status === 'A Vencer'
                            ? 'orange'
                            : status === 'Prazo'
                              ? 'blue'
                              : '#555',
                      fontWeight: 'bold',
                    }}
                  >
                    {status}
                  </td>
                  <td>{diasCNH}</td>
                  <td>
                    {Object.entries(func.arquivos || {}).map(([tipo, lista]) =>
                      (lista || []).map((item, i) => {
                        const url = item.startsWith('http')
                          ? item
                          : `${process.env.REACT_APP_API_URL}/uploads/${item}`;
                        const nomeExibicao = item.startsWith('http')
                          ? decodeURIComponent(item.split('/').pop().split('?')[0])
                          : item;

                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'block' }}
                          >
                            {tipo.replace('_', ' ')} - {nomeExibicao}
                          </a>
                        );
                      })
                    )}
                  </td>
                  <td>
                    <button
                      className="btnEditar"
                      onClick={() => onEditar(normalizarFuncionario(func))}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <button className="botao-topo" onClick={scrollToTop}>
        <img src={topoImg} alt="Voltar ao topo" />
      </button>
    </div>
  );
};

export default TabelaFuncionarios;
