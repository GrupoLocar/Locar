import React from 'react';
import './SituacaoFuncionario.css';

const SituacaoFuncionario = ({ funcionarios, onFiltrarSituacao, situacaoSelecionada }) => {
  const contarPorSituacao = (situacao) => {
    return funcionarios.filter(f => f.situacao === situacao).length;
  };

  const opcoes = [
    { label: 'Ativo', classe: 'situacao-ativo' },
    { label: 'Inativo', classe: 'situacao-inativo' },
    { label: 'Bloqueado', classe: 'situacao-bloqueado' },
    { label: 'Aprovar', classe: 'situacao-aprovar' },
    { label: 'Entrevistar', classe: 'situacao-aprovar' }
  ];

  return (
    <div className="quadro-situacao">
      <h2>Situação do Funcionário</h2>
      <div className="quadro-situacao-linha">
        {opcoes.map((opcao) => {
          const selecionado = situacaoSelecionada === opcao.label;
          return (
            <div
              key={opcao.label}
              onClick={() => onFiltrarSituacao(opcao.label)}
              className={`situacao-card ${opcao.classe} ${selecionado ? 'selecionado' : ''}`}
            >
              <strong>{opcao.label}</strong><br />
              {contarPorSituacao(opcao.label)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SituacaoFuncionario;
