import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CategoriaCNH.css';

const categorias = ['AB', 'AC', 'AD', 'AE', 'B', 'C', 'D', 'E'];

const CategoriaCNH = ({ onFiltrarCategoria, categoriaSelecionada }) => {
  const [contagens, setContagens] = useState({});

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/funcionarios`)
      .then(res => {
        const counts = {};
        categorias.forEach(cat => {
          counts[cat] = res.data.filter(f => f.categoria === cat).length;
        });
        setContagens(counts);
      }).catch(console.error);
  }, []);

  return (
    <div className="quadro-categoria">
      <h2>Categorias da CNH</h2>
      <div className="quadro-categoria-linha">
        {categorias.map((cat) => (
          <div
            key={cat}
            className={`quadro-categoria-bloco ${categoriaSelecionada === cat ? 'selecionado' : ''}`}
            onClick={() => onFiltrarCategoria(cat)}
          >
            <div className="quadro-categoria-nome">{cat}</div>
            <div className="quadro-categoria-quantidade">{contagens[cat] || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriaCNH;
