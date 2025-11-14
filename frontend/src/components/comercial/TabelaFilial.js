// src/components/comercial/TabelaFilial.js
import React, { useEffect, useState } from 'react';

// ==== Base API (robusta) ====
const RAW = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
const API_ROOT = RAW || '';
const API = `${API_ROOT}${/\/api$/.test(API_ROOT) ? '' : '/api'}`;

export default function TabelaFilial({ filtro, refreshKey, onEditar }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      setCarregando(true);
      setErro('');
      try {
        // 1ª tentativa: URL padrão
        let url = `${API}/filiais?filtro=${encodeURIComponent(filtro || '')}`;
        let resp = await fetch(url);

        // Se 404, tenta sem '/api' (caso a base já inclua /api ou esteja em proxy)
        if (!resp.ok && resp.status === 404) {
          const alt = `${API_ROOT || ''}/api/filiais?filtro=${encodeURIComponent(filtro || '')}`;
          if (alt !== url) {
            resp = await fetch(alt);
          }
        }

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const out = await resp.json();
        setItens(Array.isArray(out) ? out : []);
      } catch (e) {
        console.error(e);
        setItens([]);
        setErro('Não foi possível carregar as filiais.');
      } finally {
        setCarregando(false);
      }
    })();
  }, [filtro, refreshKey]);

  const baixarBlob = (blob, nome) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
  };

  const exportarCSV = () => {
    const header = ['Filial', 'Distrital', 'CNPJ', 'Responsável', 'Telefone', 'E-mail'];
    const rows = itens.map(r => [r.filial ?? '', r.distrital ?? '', r.cnpj ?? '', r.responsavel ?? '', r.telefone ?? '', r.email ?? '']);
    const csv = [header, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    baixarBlob(blob, `filiais_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportarXLS = () => {
    const html =
      `<table>
        <thead>
          <tr><th>Filial</th><th>Distrital</th><th>CNPJ</th><th>Responsável</th><th>Telefone</th><th>E-mail</th></tr>
        </thead>
        <tbody>
          ${itens.map(r => `
            <tr>
              <td>${r.filial ?? ''}</td>
              <td>${r.distrital ?? ''}</td>
              <td>${r.cnpj ?? ''}</td>
              <td>${r.responsavel ?? ''}</td>
              <td>${r.telefone ?? ''}</td>
              <td>${r.email ?? ''}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    baixarBlob(blob, `filiais_${new Date().toISOString().slice(0, 10)}.xls`);
  };

  const exportarPDF = () => {
    const conteudo = `
      <html>
        <head>
          <title>Filiais</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 10px; }
            h3 { margin-top: 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #333; padding: 6px; text-align: left; }
            th { background: #eee; }
          </style>
        </head>
        <body>
          <h3>Relatório de Filiais</h3>
          <table>
            <thead>
              <tr><th>Filial</th><th>Distrital</th><th>CNPJ</th><th>Responsável</th><th>Telefone</th><th>E-mail</th></tr>
            </thead>
            <tbody>
              ${itens.map(r => `
                <tr>
                  <td>${r.filial ?? ''}</td>
                  <td>${r.distrital ?? ''}</td>
                  <td>${r.cnpj ?? ''}</td>
                  <td>${r.responsavel ?? ''}</td>
                  <td>${r.telefone ?? ''}</td>
                  <td>${r.email ?? ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    const win = window.open('', '_blank');
    if (!win) return alert('Habilite pop-ups para exportar em PDF.');
    win.document.write(conteudo);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 150);
  };

  return (
    <div>
      {erro && <p style={{ color: 'red', textAlign: 'center' }}>{erro}</p>}

      {carregando ? <p>Carregando...</p> : (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#181893', color: '#fff' }}>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 20, borderTopLeftRadius: '8px' }}>Filial</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>Distrital</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>CNPJ</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>Responsável</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>Telefone</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>E-mail</th>
                <th style={{ fontSize: '16px', textAlign: 'center', padding: 8, borderTopRightRadius: '8px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 12, textAlign: 'center' }}>Sem registros</td></tr>
              ) : itens.map(r => (
                <tr key={r._id} style={{ borderBottom: '1px solid #ddd', background: '#fff', color: '#000' }}>
                  <td style={{ padding: 8 }}>{r.filial}</td>
                  <td style={{ padding: 8 }}>{r.distrital}</td>
                  <td style={{ padding: 8 }}>{r.cnpj}</td>
                  <td style={{ padding: 8 }}>{r.responsavel}</td>
                  <td style={{ padding: 8 }}>{r.telefone}</td>
                  <td style={{ padding: 8 }}>{r.email}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button className="botao" onClick={() => onEditar(r)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
