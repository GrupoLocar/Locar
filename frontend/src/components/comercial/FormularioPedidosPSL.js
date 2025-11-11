import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { OCORRENCIA_PSL } from '../../utils/FormUtilsComercial';
import './FormularioPedidosPSL.css'; // estilo dos botões e form

/* ===== Helpers de timezone São Paulo ===== */
const stripAccents = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/gi, 'c');
const firstUpperRestLower = (s = '') => s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

// Retorna "YYYY-MM-DDTHH:mm" na TZ America/Sao_Paulo
const nowLocalInputSP = () => {
  const d = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(d).map(({ type, value }) => [type, value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

// Converte "YYYY-MM-DDTHH:mm" (local SP) -> ISO UTC com Z
const isoFromLocalSP = (localStr) => {
  if (!localStr) return '';
  return new Date(`${localStr}:00-03:00`).toISOString();
};

// ==== Base API ====
const RAW = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
const API_ROOT = RAW || '';
const API = `${API_ROOT}${/\/api$/.test(API_ROOT) ? '' : '/api'}`;

const EMPTY = {
  _id: null,
  data: '',
  filial: '',
  distrital: '',
  ocorrencia_psl: '',
  observacao: '',
};

const FormularioPedidosPSL = forwardRef(function FormularioPedidosPSL({ filiais = [], onSaved }, ref) {
  const [dados, setDados] = useState(EMPTY);
  const filialRef = useRef(null);

  // options com label/valor: valor normalizado casa com o banco e com o filtro
  const ocorrenciasOrdenadas = useMemo(
    () => [...OCORRENCIA_PSL]
          .map(label => ({ label, value: firstUpperRestLower(stripAccents(label)) }))
          .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    []
  );

  const limparDefinindoDataEFoco = () => {
    setDados({
      ...EMPTY,
      data: nowLocalInputSP(), // preenche data/hora local de SP
    });
    setTimeout(() => filialRef.current?.focus(), 50);
    document.getElementById('form-psl')?.scrollIntoView({ behavior: 'smooth' });
  };

  useImperativeHandle(ref, () => ({
    dispararNovo: () => limparDefinindoDataEFoco(),
    preencher: (registro) => {
      // Ajusta o datetime-local para edição
      const d = new Date(registro.data);
      const p = (n) => String(n).padStart(2, '0');
      const dt = isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;

      setDados({
        _id: registro._id || null,
        data: dt,
        filial: registro.filial || '',
        distrital: registro.distrital || '',
        ocorrencia_psl: registro.ocorrencia_psl || '',
        observacao: registro.observacao || '',
      });
      setTimeout(() => filialRef.current?.focus(), 50);
    },
  }), []);

  const handleFilialChange = (val) => {
    const f = (filiais || []).find(ff => stripAccents(String(ff?.filial || '')) === val);
    const distrital = f?.distrital ? firstUpperRestLower(stripAccents(f.distrital)) : '';
    setDados((d) => ({ ...d, filial: val, distrital }));
  };

  const validar = () => {
    const faltando = [];
    if (!dados.data) faltando.push('data');
    if (!dados.filial) faltando.push('filial');
    if (!dados.distrital) faltando.push('distrital');
    if (!dados.ocorrencia_psl) faltando.push('ocorrencia_psl');
    if (faltando.length) {
      alert(`Preencha os campos obrigatórios: ${faltando.join(', ')}`);
      return false;
    }
    return true;
  };

  const salvar = async () => {
    if (!validar()) return;

    const payload = {
      data: isoFromLocalSP(dados.data), // ISO (UTC) baseado na hora local de SP
      filial: stripAccents(dados.filial.trim()), // sem TitleCase para filial (apenas sem acento)
      distrital: firstUpperRestLower(stripAccents(dados.distrital.trim())),
      ocorrencia_psl: firstUpperRestLower(stripAccents(dados.ocorrencia_psl.trim())),
      observacao: dados.observacao ? firstUpperRestLower(stripAccents(dados.observacao.trim())) : '',
    };

    try {
      if (dados._id) {
        await axios.put(`${API}/psl/${dados._id}`, payload);
      } else {
        await axios.post(`${API}/psl`, payload);
      }
      limparDefinindoDataEFoco();
      onSaved?.(); // atualiza tabela imediatamente (sem scroll) na página
    } catch (e) {
      console.error('Erro ao salvar PSL:', e);
      alert('Erro ao salvar o registro.');
    }
  };

  return (
    <form className="form-filial">
      <fieldset className="secao">
        <legend>Dados do Pedido Sem Loc</legend>

        <div className="grid">
          {/* Data */}
          <div className="campo">
            <label>Data</label>
            <input
              type="datetime-local"
              value={dados.data}
              onChange={(e) => setDados((d) => ({ ...d, data: e.target.value }))}
              required
            />
          </div>

          {/* Filial */}
          <div className="campo">
            <label>Filial</label>
            <select
              ref={filialRef}
              value={dados.filial}
              onChange={(e) => handleFilialChange(stripAccents(e.target.value))}
              required
            >
              <option value="">Selecione</option>
              {(filiais || []).map((f) => (
                <option key={f._id || f.id || f.filial} value={stripAccents(String(f.filial || ''))}>
                  {f.filial}
                </option>
              ))}
            </select>
          </div>

          {/* Distrital (somente visualização) */}
          <div className="campo">
            <label>Distrital</label>
            <input type="text" value={dados.distrital} disabled readOnly />
          </div>

          {/* Ocorrência PSL */}
          <div className="campo">
            <label>Ocorrência PSL</label>
            <select
              value={dados.ocorrencia_psl} // valor normalizado, igual ao salvo
              onChange={(e) => setDados((d) => ({ ...d, ocorrencia_psl: e.target.value }))}
              required
            >
              <option value="">Selecione</option>
              {ocorrenciasOrdenadas.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          {/* Observação (opcional) */}
          <div className="campo" style={{ gridColumn: '1 / -1' }}>
            <label>Observação</label>
            <textarea
              value={dados.observacao}
              maxLength={100}
              // placeholder="Observação"
              onChange={(e) => setDados((d) => ({ ...d, observacao: e.target.value }))}
            />
            <small>Máx. 100 caracteres. Campo opcional.</small>
          </div>
        </div>
      </fieldset>

      {/* Botões no mesmo estilo configurado */}
      <div className="botoes" style={{ justifyContent: 'center' }}>
        <button type="button" className="btnSalvar" onClick={salvar}>Salvar</button>
        <button type="button" className="btnNovo" onClick={limparDefinindoDataEFoco}>Novo</button>
      </div>
    </form>
  );
});

export default FormularioPedidosPSL;
