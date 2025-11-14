import React, { useMemo } from 'react';
import './SituacaoFuncionario.css';

const SituacaoFuncionario = ({
  funcionarios = [],
  onFiltrarSituacao,
  situacaoSelecionada,
}) => {
  const contagens = useMemo(() => {
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

    const bySit = (sit) =>
      funcionarios.filter((f) => f.situacao === sit).length;

    const totalPJ = funcionarios.filter((f) => isMarcado(f.pj)).length;
    const totalMEI = funcionarios.filter((f) => isMarcado(f.mei)).length;

    return {
      ativo: bySit('Ativo'),
      inativo: bySit('Inativo'),
      bloqueado: bySit('Bloqueado'),
      aprovar: bySit('Aprovar'),
      entrevistar: bySit('Entrevistar'),
      pj: totalPJ,
      mei: totalMEI,
    };
  }, [funcionarios]);

  const toggle = (tipo) => {
    if (!onFiltrarSituacao) return;
    if (situacaoSelecionada === tipo) {
      onFiltrarSituacao(null);
    } else {
      onFiltrarSituacao(tipo);
    }
  };

  const cardClass = (base, tipo) =>
    `situacao-card ${base} ${situacaoSelecionada === tipo ? 'situacao-selecionada' : ''}`;

  return (
    <div className="quadro-situacao">
      <h2>Situação do Funcionário</h2>
      <div className="quadro-situacao-linha">
        <div
          className={cardClass('situacao-ativo', 'Ativo')}
          onClick={() => toggle('Ativo')}
        >
          <strong>Ativo</strong><br />
          {contagens.ativo}
        </div>

        <div
          className={cardClass('situacao-inativo', 'Inativo')}
          onClick={() => toggle('Inativo')}
        >
          <strong>Inativo</strong><br />
          {contagens.inativo}
        </div>

        <div
          className={cardClass('situacao-bloqueado', 'Bloqueado')}
          onClick={() => toggle('Bloqueado')}
        >
          <strong>Bloqueado</strong><br />
          {contagens.bloqueado}
        </div>

        <div
          className={cardClass('situacao-aprovar', 'Aprovar')}
          onClick={() => toggle('Aprovar')}
        >
          <strong>Aprovar</strong><br />
          {contagens.aprovar}
        </div>

        <div
          className={cardClass('situacao-aprovar', 'Entrevistar')}
          onClick={() => toggle('Entrevistar')}
        >
          <strong>Entrevistar</strong><br />
          {contagens.entrevistar}
        </div>

        <div
          className={cardClass('situacao-aprovar', 'PJ')}
          onClick={() => toggle('PJ')}
        >
          <strong>PJ</strong><br />
          {contagens.pj}
        </div>

        <div
          className={cardClass('situacao-aprovar', 'Mei')}
          onClick={() => toggle('Mei')}
        >
          <strong>MEI</strong><br />
          {contagens.mei}
        </div>
      </div>
    </div>
  );
};

export default SituacaoFuncionario;

