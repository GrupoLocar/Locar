// src/App.js
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './style/App.css';
import axios from 'axios';
import Home from './pages/Home';
import Funcionario from './pages/Funcionario';
import Comercial from './pages/Comercial';
import Financeiro from './pages/Financeiro';
import Controladoria from './pages/Controladoria';
import RH from './pages/RH';
import DP from './pages/DP';
import Layout from './components/Layout';
import { registrarLog } from './utils/log';
import VisualizarLogs from './pages/VisualizarLogs';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import DashboardFuncionarios from './pages/RH/DashboardFuncionarios';
import fundo from './assets/Fundo.jpg';
import CadastroClientes from './pages/Comercial/CadastroClientes';
import CadastroFornecedores from './pages/Comercial/CadastroFornecedores';
import CadastroFilial from './pages/Comercial/CadastroFilial';
import CadastroPedidosPSL from './pages/Comercial/CadastroPedidosPSL';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { username, password }
      );
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
      localStorage.setItem('usuario', JSON.stringify(usuario));
      await registrarLog(usuario._id, usuario.username, 'login');
      onLogin();
      navigate('/home');
    } catch (err) {
      console.error(err);
      alert('Erro ao fazer login. Verifique usuário e senha.');
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${fundo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}
    >
      <img
        src="/Logotipo.png"
        alt="Logotipo Grupo Locar"
        style={{ width: '120px', marginBottom: '8px' }}
      />
      <h2 style={{ color: '#fff', margin: 0 }}>Login - Grupo Locar</h2>
      <input
        type="text"
        placeholder="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: '320px',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.8)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          fontSize: '16px'
        }}
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: '320px',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.8)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          fontSize: '16px'
        }}
      />
      <button
        onClick={handleLogin}
        style={{
          width: '336px',
          padding: '12px',
          borderRadius: '4px',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#0066cc',
          color: '#fff'
        }}
      >
        Entrar
      </button>
    </div>
  );
}

function AppRoutes({ isAuthenticated, handleLogout }) {
  const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

  return (
    <Routes>
      {!isAuthenticated ? (
        <Route path="*" element={<Login onLogin={() => window.location.reload()} />} />
      ) : (
        <>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/" element={<Layout onLogout={handleLogout} />}>
            <Route path="home" element={<Home />} />
            <Route path="rh/funcionario" element={<Funcionario />} />
            <Route path="rh/dashboard" element={<DashboardFuncionarios />} />
            <Route path="comercial" element={<Comercial />} />
            <Route path="comercial/clientes" element={<CadastroClientes />} />
            <Route path="comercial/fornecedores" element={<CadastroFornecedores />} />
            <Route path="comercial/filiais" element={<CadastroFilial />} />
            <Route path="/comercial/psl" element={<CadastroPedidosPSL />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="controladoria" element={<Controladoria />} />
            <Route path="rh" element={<RH />} />
            <Route path="dp" element={<DP />} />
            <Route path="logs" element={<VisualizarLogs />} />
            <Route
              path="configuracoes/usuarios"
              element={
                usuarioLogado?.username === 'admin' ? (
                  <GerenciarUsuarios />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/home" />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    function onStorageChange(e) {
      if (e.key === 'token' && e.newValue === null) {
        setIsAuthenticated(false);
        window.location.href = '/';
      }
    }
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  const handleLogout = async () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (usuarioLogado) {
      await registrarLog(usuarioLogado._id, usuarioLogado.username, 'logout');
    }
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('usuario');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <AppRoutes isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
    </BrowserRouter>
  );
}
