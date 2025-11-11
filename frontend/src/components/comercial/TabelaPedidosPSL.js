import React, { useMemo, useState } from 'react';
import './TabelaPedidosPSL.css';

const formatarDataBR = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export default function TabelaPedidosPSL({ itens = [], onEdit }) {
  const [openExport, setOpenExport] = useState(false);

  // ✅ Ordena por data/hora DECRESCENTE (mais novos primeiro) sempre que itens mudar
  const linhas = useMemo(() => {
    return [...(itens || [])].sort((a, b) => {
      const da = new Date(a?.data || 0).getTime();
      const db = new Date(b?.data || 0).getTime();
      return db - da; // decrescente
    });
  }, [itens]);

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

  // Exportações (mantidas)
  const exportarCSV = () => {
    const header = ['Data', 'Filial', 'Distrital', 'Ocorrencia_PSL', 'Observacao'];
    const rows = linhas.map(r => [
      formatarDataBR(r.data) || '',
      r.filial ?? '',
      r.distrital ?? '',
      r.ocorrencia_psl ?? '',
      r.observacao ?? '',
    ]);
    const csv = [header, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    baixarBlob(blob, `psl_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Gera um .xlsx VÁLIDO usando SheetJS (xlsx) via import dinâmico
  const exportarXLS = async () => {
    try {
      const XLSX = await import('xlsx');

      const header = ['Data', 'Filial', 'Distrital', 'Ocorrencia_PSL', 'Observacao'];
      const rows = linhas.map(r => [
        formatarDataBR(r.data) || '',
        r.filial ?? '',
        r.distrital ?? '',
        r.ocorrencia_psl ?? '',
        r.observacao ?? '',
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'PSL');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob(
        [wbout],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      baixarBlob(blob, `psl_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error('Falha ao exportar XLSX:', e);
      alert('Não foi possível exportar em XLSX. Verifique se a dependência "xlsx" (SheetJS) está instalada.');
    }
  };

  const exportarPDF = () => {
    const conteudo = `
      <html>
        <head>
          <title>PSL</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 10px; }
            h3 { margin-top: 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #333; padding: 6px; text-align: left; }
            th { background: #eee; }
          </style>
        </head>
        <body>
          <h3>Relatório de Pedidos Sem Loc</h3>
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Filial</th><th>Distrital</th><th>Ocorrencia_PSL</th><th>Observacao</th>
              </tr>
            </thead>
            <tbody>
              ${
                linhas.map(r => `
                  <tr>
                    <td>${formatarDataBR(r.data) || ''}</td>
                    <td>${r.filial ?? ''}</td>
                    <td>${r.distrital ?? ''}</td>
                    <td>${r.ocorrencia_psl ?? ''}</td>
                    <td>${r.observacao ?? ''}</td>
                  </tr>
                `).join('')
              }
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
      {/* Botão Exportar no mesmo formato da tabela de Filiais */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <button type="button" className="botao" onClick={() => setOpenExport(v => !v)} aria-haspopup="true" aria-expanded={openExport}>
            Exportar Tabela ▾
          </button>
          {openExport && (
            <div
              style={{
                position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                background: '#fff', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                borderRadius: 6, zIndex: 10, minWidth: 180, padding: 6
              }}
              role="menu"
            >
              <button type="button" className="botao" onClick={exportarCSV} style={{ width: '100%', margin: '4px 0' }}>Exportar .CSV</button>
              <button type="button" className="botao" onClick={exportarXLS} style={{ width: '100%', margin: '4px 0' }}>Exportar .XLSX</button>
              <button type="button" className="botao" onClick={exportarPDF} style={{ width: '100%', margin: '4px 0' }}>Exportar .PDF</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table className="tabela-psl" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', color: '#000' }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Filial</th>
              <th>Distrital</th>
              <th>Ocorrência PSL</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 12, textAlign: 'center' }}>Sem registros</td></tr>
            ) : linhas.map(r => (
              <tr key={r._id}>
                <td>{formatarDataBR(r.data)}</td>
                <td>{r.filial}</td>
                <td>{r.distrital}</td>
                <td>{r.ocorrencia_psl}</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="botao" onClick={() => onEdit?.(r)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
