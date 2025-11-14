// src/components/Layout.js
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Layout.css';

function Layout({ onLogout }) {
  const [showRHSubmenu, setShowRHSubmenu] = useState(false);
  const [showConfigSubmenu, setShowConfigSubmenu] = useState(false);
  const [showComercialSubmenu, setShowComercialSubmenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const username = usuario?.username;

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/', { replace: true });
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    if (!collapsed) {
      setShowRHSubmenu(false);
      setShowConfigSubmenu(false);
      setShowComercialSubmenu(false);
    }
  };

  const handleOpenUserManagement = (e) => {
    e.preventDefault();
    if (username !== 'admin') {
      setShowConfigSubmenu(false);
      navigate('/home');
    } else {
      navigate('/configuracoes/usuarios');
    }
  };

  const isRestricted = (menu) => {
    const restricoes = {
      rh: ['dp', 'comercial', 'financeiro', 'controladoria', 'configuracoes'],
      'Departamento Pessoal': ['rh', 'comercial', 'financeiro', 'controladoria', 'configuracoes'],
      Comercial: ['rh', 'dp', 'financeiro', 'controladoria', 'configuracoes'],
      Financeiro: ['rh', 'comercial', 'dp', 'controladoria', 'configuracoes'],
      Controladoria: ['rh', 'comercial', 'financeiro', 'dp', 'configuracoes'],
    };
    return restricoes[username]?.includes(menu);
  };

  return (
    <div className="layout">
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

        {/* === NOVA DIV DO LOGO === */}
        <div className="sidebar-header">
          <img
            src="/Logotipo.png"
            alt="Logo Grupo Locar"
            className="sidebar-logo"
          />
          {!collapsed && <h1>Grupo Locar</h1>}
        </div>

        <button className="collapse-button" onClick={toggleCollapse}>
          {collapsed ? '▶' : '◀'}
        </button>

        <ul>
          <li>
            <Link to="/home">
              <span className="icon">🏠</span>
              {!collapsed && <span className="label"> Home</span>}
            </Link>
          </li>

          {/* === Recursos Humanos === */}
          <li>
            {isRestricted('rh') ? (
              <button onClick={(e) => e.preventDefault()} className="submenu-button disabled-link">
                <span className="icon">🧑‍💼</span>
                {!collapsed && <span className="label"> Recursos Humanos</span>}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowRHSubmenu(!showRHSubmenu)}
                  className="submenu-button"
                >
                  <span className="icon">🧑‍💼</span>
                  {!collapsed && (
                    <span className="label">
                      Recursos Humanos {showRHSubmenu ? '▲' : '▼'}
                    </span>
                  )}
                </button>

                {showRHSubmenu && (
                  <ul className="submenu">
                    <li>
                      <Link to="/rh/funcionario">
                        <span className="icon">👩‍💼</span>
                        {!collapsed && <span className="label"> Cadastro de Funcionários</span>}
                      </Link>
                    </li>
                    <li>
                      <Link to="/rh/dashboard">
                        <span className="icon">📊</span>
                        {!collapsed && <span className="label"> Dashboard</span>}
                      </Link>
                    </li>
                  </ul>
                )}
              </>
            )}
          </li>

          {/* === Departamento Pessoal === */}
          <li>
            {isRestricted('dp') ? (
              <a href="#!" onClick={(e) => e.preventDefault()} className="disabled-link">
                <span className="icon">📁</span>
                {!collapsed && <span className="label"> Departamento Pessoal</span>}
              </a>
            ) : (
              <Link to="/dp">
                <span className="icon">📁</span>
                {!collapsed && <span className="label"> Departamento Pessoal</span>}
              </Link>
            )}
          </li>

          {/* === Comercial === */}
          <li>
            {isRestricted('comercial') ? (
              <button
                onClick={(e) => e.preventDefault()}
                className="submenu-button disabled-link"
                aria-disabled="true"
              >
                <span className="icon">💼</span>
                {!collapsed && <span className="label"> Comercial</span>}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowComercialSubmenu(!showComercialSubmenu)}
                  className="submenu-button"
                >
                  <span className="icon">💼</span>
                  {!collapsed && (
                    <span className="label">
                      Comercial {showComercialSubmenu ? '▲' : '▼'}
                    </span>
                  )}
                </button>

                {showComercialSubmenu && !collapsed && (
                  <ul className="submenu">
                    <li>
                      <Link to="/comercial/clientes">
                        <span className="icon">📋</span>
                        <span className="label"> Cadastro de Clientes</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/comercial/filiais">
                        <span className="icon">🏬</span>
                        <span className="label"> Cadastro de Filial</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/comercial/fornecedores">
                        <span className="iconfornecedor">🪪</span>
                        <span className="label"> Cadastro de Fornecedores</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/comercial/psl">
                        <span className="icon">📑</span>
                        <span className="label"> PSL (Pedidos sem Loc)</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </>
            )}
          </li>

          {/* === Financeiro === */}
          <li>
            {isRestricted('financeiro') ? (
              <a href="#!" onClick={(e) => e.preventDefault()} className="disabled-link">
                <span className="icon">💰</span>
                {!collapsed && <span className="label"> Financeiro</span>}
              </a>
            ) : (
              <Link to="/financeiro">
                <span className="icon">💰</span>
                {!collapsed && <span className="label"> Financeiro</span>}
              </Link>
            )}
          </li>

          {/* === Controladoria === */}
          <li>
            {isRestricted('controladoria') ? (
              <a href="#!" onClick={(e) => e.preventDefault()} className="disabled-link">
                <span className="icon">📊</span>
                {!collapsed && <span className="label"> Controladoria</span>}
              </a>
            ) : (
              <Link to="/controladoria">
                <span className="icon">📊</span>
                {!collapsed && <span className="label"> Controladoria</span>}
              </Link>
            )}
          </li>

          {/* === Configurações === */}
          <li>
            {isRestricted('configuracoes') ? (
              <button
                onClick={(e) => e.preventDefault()}
                className="submenu-button disabled-link"
              >
                <span className="icon">⚙️</span>
                {!collapsed && <span className="label"> Configurações</span>}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowConfigSubmenu(!showConfigSubmenu)}
                  className="submenu-button"
                >
                  <span className="icon">⚙️</span>
                  {!collapsed && (
                    <span className="label">
                      Configurações {showConfigSubmenu ? '▲' : '▼'}
                    </span>
                  )}
                </button>

                {showConfigSubmenu && (
                  <ul className="submenu">
                    <li>
                      <a
                        href="/configuracoes/usuarios"
                        onClick={handleOpenUserManagement}
                      >
                        <span className="icon">👤</span>
                        {!collapsed && <span className="label"> Usuários</span>}
                      </a>
                    </li>
                  </ul>
                )}
              </>
            )}
          </li>

          <li>
            <button className="logout-button" onClick={handleLogout}>
              <span className="icon">🚪</span>
              {!collapsed && <span className="label"> Sair</span>}
            </button>
          </li>
        </ul>
      </nav>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
