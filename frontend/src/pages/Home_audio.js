//  C:\Locar\frontend\src\pages\Home.js

import React, { useState } from 'react';
import '../style/home.css';

function Home() {
  const [audioAtivado, setAudioAtivado] = useState(false);

  const iniciarAudio = () => {
    const userRaw = localStorage.getItem("usuario");

    if (!userRaw) {
      console.warn("Usuário não encontrado no localStorage.");
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }

    const usuario = JSON.parse(userRaw);
    console.log("Usuário atual:", usuario);

    if (usuario?.username === "rh") {
      const audio = new Audio("/audio/Dashboard.mp3");
      audio.volume = 1.0;

      audio.play()
        .then(() => {
          console.log("Áudio reproduzido com sucesso!");
          setAudioAtivado(true);
        })
        .catch((e) => {
          console.error("Erro ao reproduzir o áudio:", e);
          alert("Erro ao tocar o áudio. Verifique permissões do navegador.");
          setAudioAtivado(true);
        });
    } else {
      console.log("Usuário não é 'rh'. Nenhum áudio será reproduzido.");
      setAudioAtivado(true);
    }
  };

  return (
    <div className="home-container">
      {!audioAtivado && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={iniciarAudio}
            style={{
              backgroundColor: '#FF6700',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#FCDE0B'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#FF6700'}
          >
            Você tem uma nova Mensagem
          </button>
        </div>
      )}

      {audioAtivado && (
        <>
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
        </>
      )}
    </div>
  );
}

export default Home;

