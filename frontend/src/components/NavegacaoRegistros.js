import React from 'react';

const NavegacaoRegistros = ({ total, atual, onFirst, onPrevious, onNext, onLast, onNew }) => {
  return (
    <div>
      <button onClick={onFirst}>Primeiro</button>
      <button onClick={onPrevious}>Anterior</button>
      <button onClick={onNext}>Próximo</button>
      <button onClick={onLast}>Último</button>
      <button onClick={onNew}>Novo</button>
      <span>{`${atual}/${total}`}</span>
    </div>
  );
};

export default NavegacaoRegistros;
