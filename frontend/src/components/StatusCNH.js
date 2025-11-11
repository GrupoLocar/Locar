import React from 'react';
import './StatusCNH.css';

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

const StatusCNH = ({ funcionarios, onFiltrarStatusCNH, statusSelecionado }) => {
  const opcoes = [
    { label: 'Vencido', classe: 'vencido' },
    { label: 'A Vencer', classe: 'a-vencer' },
    { label: 'Prazo', classe: 'prazo' }
  ];

  const contarPorStatus = (status) => {
    return funcionarios.filter(f => calcularStatusCNH(f.validade_cnh) === status).length;
  };

  return (
    <div className="quadro-statusCNH">
      <h2>Status da CNH</h2>
      <div className="quadro-statusCNH-linha">
        {opcoes.map((opcao) => {
          const selecionado = statusSelecionado === opcao.label;
          return (
            <div
              key={opcao.label}
              onClick={() => onFiltrarStatusCNH(opcao.label)}
              className={`statusCNH-card ${opcao.classe} ${selecionado ? 'selecionado' : ''}`}
            >
              <strong>{opcao.label}</strong><br />
              {contarPorStatus(opcao.label)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusCNH;
