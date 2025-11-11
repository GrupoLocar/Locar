import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ToolbarGenerica({
  onBuscar,
  onLimpar,
  onFiltrar,
  onExportar,
  onImprimir,
  dados = [],
  colunas = [],
  filtrosConfig = [],
  mostrarBuscar = true,
  mostrarLimpar = true,
  mostrarFiltrar = true,
  mostrarExportar = true,
  mostrarImprimir = true,
}) {
  const [busca, setBusca] = useState('');
  const [mostrarModalFiltro, setMostrarModalFiltro] = useState(false);
  const [filtros, setFiltros] = useState({});

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, 'dados.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const headers = colunas.map(c => c.header);
    const rows = dados.map(row => colunas.map(c => row[c.key]));
    doc.autoTable({
      head: [headers],
      body: rows,
    });
    doc.save('dados.pdf');
  };

  const exportarCSV = () => {
    const headers = colunas.map(c => c.header).join(';');
    const rows = dados.map(row =>
      colunas.map(c => `"${row[c.key]}"`).join(';')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dados.csv';
    link.click();
  };

  const handleExportar = (formato) => {
    if (onExportar) {
      onExportar(formato);
      return;
    }
    if (!dados.length) {
      alert('Nenhum dado para exportar!');
      return;
    }
    switch (formato) {
      case 'xlsx':
        exportarExcel();
        break;
      case 'pdf':
        exportarPDF();
        break;
      case 'csv':
        exportarCSV();
        break;
      default:
        alert('Formato de exportação não suportado.');
    }
  };

  const handleImprimir = () => {
    if (onImprimir) {
      onImprimir();
      return;
    }
    let janela = window.open('', '', 'width=800,height=600');
    janela.document.write('<html><head><title>Imprimir</title></head><body>');
    janela.document.write('<table border="1" style="border-collapse: collapse; width: 100%;">');
    janela.document.write('<thead><tr>');
    colunas.forEach(c => {
      janela.document.write(`<th style="padding:4px;">${c.header}</th>`);
    });
    janela.document.write('</tr></thead><tbody>');
    dados.forEach(row => {
      janela.document.write('<tr>');
      colunas.forEach(c => {
        janela.document.write(`<td style="padding:4px;">${row[c.key]}</td>`);
      });
      janela.document.write('</tr>');
    });
    janela.document.write('</tbody></table>');
    janela.document.write('</body></html>');
    janela.document.close();
    janela.focus();
    janela.print();
    janela.close();
  };

  const handleFiltroChange = (key, valor) => {
    setFiltros(prev => ({ ...prev, [key]: valor }));
  };

  const aplicarFiltros = () => {
    setMostrarModalFiltro(false);
    if (onFiltrar) onFiltrar(filtros);
  };

  const limparFiltros = () => {
    setFiltros({});
    if (onLimpar) onLimpar();
  };

  return (
    <>
      <div
        className="toolbar-generica"
        style={{
          display: 'flex',
          gap: 8,
          padding: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          borderBottom: '1px solid #ccc',
          marginBottom: 16,
        }}
      >
        {mostrarBuscar && (
          <>
            <input
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ padding: 6, flexGrow: 1, minWidth: 150 }}
            />
            <button onClick={() => onBuscar && onBuscar(busca)}>Buscar</button>
          </>
        )}

        {mostrarLimpar && <button onClick={() => { setBusca(''); limparFiltros(); }}>Limpar</button>}
        {mostrarFiltrar && <button onClick={() => setMostrarModalFiltro(true)}>Filtrar</button>}

        {mostrarExportar && (
          <>
            <select
              onChange={(e) => handleExportar(e.target.value)}
              defaultValue=""
              style={{ padding: 6 }}
            >
              <option value="" disabled>
                Exportar...
              </option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </>
        )}

        {mostrarImprimir && <button onClick={handleImprimir}>Imprimir</button>}
      </div>

      {/* Modal Filtro */}
      {mostrarModalFiltro && (
        <div
          className="modal-filtro"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setMostrarModalFiltro(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
              maxWidth: '90vw',
            }}
          >
            <h3>Filtros</h3>
            {filtrosConfig.length === 0 && <p>Nenhum filtro configurado.</p>}

            {filtrosConfig.map(({ label, type, key, options }) => {
              if (type === 'select') {
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label>{label}</label>
                    <select
                      value={filtros[key] || ''}
                      onChange={(e) => handleFiltroChange(key, e.target.value)}
                      style={{ width: '100%', padding: 6 }}
                    >
                      <option value="">-- Selecione --</option>
                      {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label>{label}</label>
                  <input
                    type={type}
                    value={filtros[key] || ''}
                    onChange={(e) => handleFiltroChange(key, e.target.value)}
                    style={{ width: '100%', padding: 6 }}
                  />
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setMostrarModalFiltro(false)}>Cancelar</button>
              <button onClick={aplicarFiltros}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
