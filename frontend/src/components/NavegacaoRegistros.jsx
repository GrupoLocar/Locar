import React from 'react';

const NavegacaoRegistros = ({
  registros = [],
  indiceAtual,
  setIndiceAtual,
  preencherFormulario
}) => {

  const irParaPrimeiro = () => {
    if (registros.length > 0) {
      setIndiceAtual(0);
      preencherFormulario(registros[0]);
    }
  };

  const irParaAnterior = () => {
    if (indiceAtual > 0) {
      const novoIndice = indiceAtual - 1;
      setIndiceAtual(novoIndice);
      preencherFormulario(registros[novoIndice]);
    }
  };

  const irParaProximo = () => {
    if (indiceAtual < registros.length - 1) {
      const novoIndice = indiceAtual + 1;
      setIndiceAtual(novoIndice);
      preencherFormulario(registros[novoIndice]);
    }
  };

  const irParaUltimo = () => {
    if (registros.length > 0) {
      const ultimoIndice = registros.length - 1;
      setIndiceAtual(ultimoIndice);
      preencherFormulario(registros[ultimoIndice]);
    }
  };

  const novoRegistro = () => {
    setIndiceAtual(registros.length);
    preencherFormulario({
      nome: '',
      contrato: '',
      dataAdmissao: '',
      situacao: '',
      telefone: '',
      email: ''
    });
  };

  return (
    <div
      className="navegacao-registros"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '16px'
      }}
    >
      <button onClick={irParaPrimeiro} disabled={indiceAtual <= 0}>Primeiro</button>
      <button onClick={irParaAnterior} disabled={indiceAtual <= 0}>Anterior</button>
      <button onClick={irParaProximo} disabled={indiceAtual >= registros.length - 1}>Próximo</button>
      <button onClick={irParaUltimo} disabled={indiceAtual >= registros.length - 1}>Último</button>
      <button onClick={novoRegistro}>Novo</button>

      <button
        onClick={() => {}}
        style={{
          marginLeft: '30px',
          padding: '6px 12px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontWeight: 'bold',
          color: '#333',
          cursor: 'default',
          height: '26px'
        }}
      >
        [ {indiceAtual >= 0 && indiceAtual < registros.length ? indiceAtual + 1 : '-'} / {registros.length} ]
      </button>
    </div>
  );
};

export default NavegacaoRegistros;

