import React from 'react';
import '../style/home.css';

function Home() {
  return (
    <div className="home-container">
      <h2 style={{ marginLeft: '15px', textAlign: 'left' }}>
      Olá, seja bem-vindo(a) ao Locar Grupo!!
      </h2>
      <img
        src={require('../img/Fundo.jpg')}
        alt="Fundo"
        className="fundo-img"
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: '800px'
        }}
      />
    </div>
  );
}

export default Home;

