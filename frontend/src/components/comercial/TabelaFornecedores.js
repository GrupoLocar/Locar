// src/components/comercial/TabelaFornecedores.js
import React, { useEffect, useMemo, useState } from 'react';

export default function TabelaFornecedores({ filtro, refreshKey, fornecedores = [], onEditar }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [openExport, setOpenExport] = useState(false);

  // ---------- FILTRAGEM LOCAL (quando a lista vem pronta) ----------
  const itensFiltradosLocal = useMemo(() => {
    if (!Array.isArray(fornecedores) || fornecedores.length === 0) return null; // devolve null para cair no fetch
    const f = String(filtro || '').toLowerCase();
    if (!f) return fornecedores;

    return fornecedores.filter((r) => {
      const hay = [
        r?.razao_social, r?.cnpj, r?.tipoFornecedor, r?.responsavel,
        r?.telefone, r?.email, r?.cidade
      ].map(x => String(x || '').toLowerCase()).join(' ');
      return hay.includes(f);
    });
  }, [fornecedores, filtro]);

  // ---------- CARREGA DA API (fallback) ----------
  useEffect(() => {
    if (itensFiltradosLocal) {
      // já temos filtrado em memória, não precisa buscar
      setItens(itensFiltradosLocal);
      return;
    }
    // fallback: busca na API como antes
    (async () => {
      setCarregando(true);
      try {
        const url = `${process.env.REACT_APP_API_URL}/api/fornecedores?filtro=${encodeURIComponent(filtro || '')}`;
        const resp = await fetch(url);
        const out = await resp.json();
        setItens(Array.isArray(out) ? out : []);
      } catch (e) {
        console.error(e);
        setItens([]);
      } finally {
        setCarregando(false);
      }
    })();
  }, [filtro, refreshKey, itensFiltradosLocal]);

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

  // === EXPORTAÇÕES ===
  const exportarCSV = () => {
    const header = ['Razão Social', 'CNPJ', 'Tipo de Fornecedor', 'Responsável', 'Telefone', 'E-mail'];
    const rows = itens.map(r => [
      r.razao_social ?? '',
      r.cnpj ?? '',
      r.tipoFornecedor ?? '',
      r.responsavel ?? '',
      r.telefone ?? '',
      r.email ?? ''
    ]);
    const csv = [header, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    baixarBlob(blob, `fornecedores_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // XLSX REAL com SheetJS (xlsx). Se não houver a lib, faz fallback para CSV.
  const exportarXLSX = async () => {
    try {
      // Tenta carregar a lib instalada no projeto
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));
      const data = itens.map(r => ({
        'Razão Social': r.razao_social ?? '',
        'CNPJ': r.cnpj ?? '',
        'Tipo de Fornecedor': r.tipoFornecedor ?? '',
        'Responsável': r.responsavel ?? '',
        'Telefone': r.telefone ?? '',
        'E-mail': r.email ?? ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fornecedores');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      baixarBlob(blob, `fornecedores_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.warn('Biblioteca XLSX não encontrada ou falhou. Exportando CSV como fallback.', err);
      alert('Para exportar .xlsx, instale a dependência "xlsx". Exportando CSV como alternativa.');
      exportarCSV();
    }
  };

  const exportarPDF = () => {
    const conteudo = `
      <html>
        <head>
          <title>Fornecedores</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 10px; }
            h3 { margin-top: 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #333; padding: 6px; text-align: left; }
            th { background: #eee; }
          </style>
        </head>
        <body>
          <h3>Relatório de Fornecedores</h3>
          <table>
            <thead>
              <tr><th>Razão Social</th><th>CNPJ</th><th>Tipo de Fornecedor</th><th>Responsável</th><th>Telefone</th><th>E-mail</th></tr>
            </thead>
            <tbody>
              ${itens.map(r => `
                <tr>
                  <td>${r.razao_social ?? ''}</td>
                  <td>${r.cnpj ?? ''}</td>
                  <td>${r.tipoFornecedor ?? ''}</td>
                  <td>${r.responsavel ?? ''}</td>
                  <td>${r.telefone ?? ''}</td>
                  <td>${r.email ?? ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) {
      alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
      return;
    }
    win.document.write(conteudo);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 150);
  };

  const handleExportCSV  = (e) => { e.preventDefault(); exportarCSV();  setOpenExport(false); };
  const handleExportXLSX = async (e) => { e.preventDefault(); await exportarXLSX(); setOpenExport(false); };
  const handleExportPDF  = (e) => { e.preventDefault(); exportarPDF();  setOpenExport(false); };

  return (
    <div>
      {carregando ? <p>Carregando...</p> : (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table
            className="tabela-default"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: '#fff',
              color: '#000'
            }}
          >
            <thead>
              <tr style={{ background: '#181893', color: '#fff' }}>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 20, borderTopLeftRadius: '8px' }}>
                  Razão Social
                </th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>CNPJ</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>Tipo de Fornecedor</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>Responsável</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>Telefone</th>
                <th style={{ fontSize: '16px', textAlign: 'left', padding: 8 }}>E-mail</th>
                <th style={{ fontSize: '16px', textAlign: 'center', padding: 8, borderTopRightRadius: '8px' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 12, textAlign: 'center' }}>
                    Sem registros
                  </td>
                </tr>
              ) : (
                itens.map((r) => (
                  <tr
                    key={r._id}
                    style={{
                      borderBottom: '1px solid #ddd',
                      background: '#fff',
                      color: '#000'
                    }}
                  >
                    <td style={{ padding: 8 }}>{r.razao_social}</td>
                    <td style={{ padding: 8 }}>{r.cnpj}</td>
                    <td style={{ padding: 8 }}>{r.tipoFornecedor}</td>
                    <td style={{ padding: 8 }}>{r.responsavel}</td>
                    <td style={{ padding: 8 }}>{r.telefone}</td>
                    <td style={{ padding: 8 }}>{r.email}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button className="botao" onClick={() => onEditar(r)}>Editar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
