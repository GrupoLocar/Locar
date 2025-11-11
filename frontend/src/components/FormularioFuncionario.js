// src/components/FormularioFuncionario.js
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { camposOrdenados, camposDesabilitados, labels, selects, formatTelefone, formatCPF, formatRG } from '../utils/FormUtils';
import { normalizarFuncionario } from '../utils/normalizarFuncionario';
import { getInputStyle } from '../utils/InputStyles';
import './FormularioFuncionario.css';
import Swal from 'sweetalert2';
import { removerAcentos, capitalizarTexto, capitalizarNomeProprio } from '../utils/funcao';

// Importa o util de CEP (named export)
import { buscarCepFormatado } from '../utils/buscacep';

// === Máscara local de CEP: 00.000-000 ===
function maskCEP(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}-${d.slice(5)}`;
}

const limites = {
  nome: 80, profissao: 30, telefone: 14, email: 60, endereco: 100, complemento: 60, bairro: 80, municipio: 80,
  estado: 2,
  cep: 10, agencia: 10, conta: 25, pix: 80, cpf: 14,
  rg: 12, estado_Civil: 11, filhos: 1, cnh: 11, categoria: 2, nome_familiar: 80, contato_familiar: 15, indicado: 80, observacao: 500
};

// === util: garante ano com 4 dígitos em inputs type="date" (yyyy-mm-dd) ===
function limitarAno4Digitos(value) {
  if (!value) return value;
  const partes = value.split('-'); // yyyy-mm-dd
  const ano = (partes[0] || '').replace(/\D/g, '').slice(0, 4);
  const mes = (partes[1] || '').replace(/\D/g, '').slice(0, 2);
  const dia = (partes[2] || '').replace(/\D/g, '').slice(0, 2);
  if (!ano) return '';
  let out = ano;
  if (mes) out += '-' + mes.padStart(2, '0');
  if (dia) out += '-' + dia.padStart(2, '0');
  return out;
}

const FormularioFuncionario = forwardRef(({ funcionario = {}, onSalvar, onNovo }, ref) => {
  const nomeRef = useRef(null);
  const formularioRef = useRef(null);
  const refs = useRef({});
  const lastCepRef = useRef(''); // evita buscas repetidas

  const [dados, setDados] = useState({
    arquivos: {
      cnh_arquivo: [],
      comprovante_residencia: [],
      nada_consta: [],
      comprovante_mei: [],
      curriculo: []
    },
    dataUltimoServicoPrestado: '1900-01-01',
    estado: '',
    pj: false, // <= NOVO: estado inicial do checkbox PJ
    filhos: 0
  });

  useImperativeHandle(ref, () => ({
    dispararNovo: () => handleNovo()
  }));

  useEffect(() => {
    if (!funcionario || !funcionario._id) return;

    const funcionarioNormalizado = normalizarFuncionario(funcionario);

    setDados((prev) => {
      if (prev._id === funcionarioNormalizado._id) return prev;
      return { ...prev, ...funcionarioNormalizado, pj: !!funcionarioNormalizado.pj };
    });
  }, [funcionario]);

  // Observa o CEP; quando completar 8 dígitos, busca e preenche endereço/bairro/municipio/estado
  useEffect(() => {
    const digits = (dados.cep || '').replace(/\D/g, '');
    if (digits.length === 8 && digits !== lastCepRef.current) {
      lastCepRef.current = digits;
      (async () => {
        try {
          // buscarCepFormatado deve retornar: { endereco, bairro, cidade, estado, cep }
          const info = await buscarCepFormatado(digits);

          if (info) {
            const endereco = info.endereco || '';
            const bairro = info.bairro || '';
            const cidade = info.cidade || '';   // <- vem do buscacep.js
            const estado = (info.estado || '').toUpperCase();

            setDados(prev => ({
              ...prev,
              endereco: capitalizarTexto(removerAcentos(endereco || prev.endereco || '')),
              bairro: capitalizarTexto(removerAcentos(bairro || prev.bairro || '')),
              // MAPEAMENTO: cidade -> municipio
              municipio: capitalizarTexto(removerAcentos(cidade || prev.municipio || '')),
              estado: estado || prev.estado || '',
              cep: maskCEP(digits) // garante máscara após preenchimento
            }));
          } else {
            // Mesmo sem retorno, mantém a máscara
            setDados(prev => ({ ...prev, cep: maskCEP(digits) }));
          }
        } catch (e) {
          // Em caso de erro na busca, mantém a máscara
          setDados(prev => ({ ...prev, cep: maskCEP(digits) }));
        }
      })();
    }
  }, [dados.cep]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // ✅ Checkbox PJ
    if (name === 'pj') {
      setDados(prev => ({ ...prev, pj: !!checked }));
      return;
    }

    // Trata datas e limita ano a 4 dígitos
    if (camposData.includes(name)) {
      const v = limitarAno4Digitos(value);
      setDados(prev => ({ ...prev, [name]: v }));
      return;
    }

    if (name === 'telefone' || name === 'contato_familiar') {
      setDados(prev => ({ ...prev, [name]: formatTelefone(value) }));
    } else if (name === 'cep') {
      // CEP sempre na máscara 00.000-000 durante a digitação
      setDados(prev => ({ ...prev, cep: maskCEP(value) }));
    } else if (name === 'cpf') {
      setDados(prev => ({ ...prev, [name]: formatCPF(value) }));
    } else if (name === 'rg') {
      setDados(prev => ({ ...prev, [name]: formatRG(value) }));
    } else if (name === 'estado') {
      // <= NOVO: força 2 caracteres MAIÚSCULOS (A-Z) e apenas letras
      const uf = (value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
      setDados(prev => ({ ...prev, estado: uf }));
    } else if (selects[`opcoes${name.charAt(0).toUpperCase() + name.slice(1)}`]) {
      setDados(prev => ({ ...prev, [name]: value }));
    } else {
      let textoFormatado = value;
      if (name === 'nome') {
        textoFormatado = capitalizarNomeProprio(value);
      } else if (name === 'email' || name === 'pix') {
        textoFormatado = removerAcentos(value.toLowerCase());
      } else {
        textoFormatado = capitalizarTexto(value);
      }
      setDados(prev => ({ ...prev, [name]: textoFormatado }));
    }
  };

  const handleArquivoChange = (e, campo) => {
    if (!dados.nome || typeof dados.nome !== 'string') {
      Swal.fire({
        title: 'Atenção',
        text: 'Preencha o nome antes de anexar arquivos.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
      return;
    }

    setDados(prev => ({
      ...prev,
      arquivos: {
        ...prev.arquivos,
        [campo]: [] // Limpa o array para evitar duplicidade
      }
    }));
  };

  const handleNovo = () => {
    setDados({
      arquivos: {
        cnh_arquivo: [],
        comprovante_residencia: [],
        nada_consta: [],
        comprovante_mei: [],
        curriculo: []
      },
      dataUltimoServicoPrestado: '1900-01-01',
      estado: '',
      pj: false,
      filhos: 0
    });
    Object.keys(dados.arquivos).forEach(campo => {
      const input = document.querySelector(`input[name="${campo}"]`);
      if (input) input.value = '';
    });
    setTimeout(() => {
      formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nomeRef.current?.focus();
    }, 100);
  };

  const salvar = async () => {
    const ignorarCampos = ['observacao', 'cnh_arquivo', 'comprovante_residencia', 'nada_consta', 'comprovante_mei', 'curriculo'];
    const camposValidarTamanho = ['telefone', 'cep', 'cpf', 'rg', 'cnh', 'contato_familiar']; // 'estado' não entra aqui (é alfabético)

    for (let campo of camposOrdenados) {
      if (!ignorarCampos.includes(campo) && !camposDesabilitados.includes(campo)) {
        if (campo === 'pj') {
          // checkbox não é obrigatório — apenas pula a validação de vazio
        } else {
          if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
            const ref = refs.current[campo];
            if (ref && ref.focus) ref.focus();
            Swal.fire({ title: 'Grupo Locar', text: `Preencha o campo obrigatório: ${labels[campo] || (campo === 'estado' ? 'Estado' : campo)}`, icon: 'info', confirmButtonText: 'OK' });
            return;
          }

          if (camposValidarTamanho.includes(campo)) {
            const valorNumerico = dados[campo]?.replace?.(/\D/g, '') || '';
            const digitosEsperados = { telefone: 11, contato_familiar: 11, cpf: 11, rg: 9, cep: 8, cnh: 11 };
            const esperado = digitosEsperados[campo] || limites[campo];
            if (valorNumerico.length < esperado) {
              const ref = refs.current[campo];
              if (ref && ref.focus) ref.focus();
              Swal.fire({ title: 'Grupo Locar', text: `O campo ${labels[campo]} deve conter ${esperado} dígitos.`, icon: 'info', confirmButtonText: 'OK' });
              return;
            }
          }
        }
      }
    }

    const form = new FormData();

    if (funcionario?._id && typeof funcionario._id === 'string') {
      form.delete('_id');
      form.append('_id', funcionario._id);
    }

    // inclui campos simples (inclusive pj)
    for (const campo in dados) {
      if (campo === 'arquivos' || campo === '_id') continue;

      if (campo === 'pj') {
        form.append('pj', dados.pj ? 'true' : 'false');
        continue;
      }

      if (dados[campo] !== undefined && dados[campo] !== null && dados[campo] !== '') {
        form.append(campo, campo === 'filhos' ? parseInt(dados[campo]) || 0 : dados[campo]);
      }
    }

    if (!form.has('nome') && dados.nome) {
      form.append('nome', dados.nome);
    }

    const tiposArquivos = [
      'cnh_arquivo',
      'comprovante_residencia',
      'nada_consta',
      'comprovante_mei',
      'curriculo'
    ];

    for (const tipo of tiposArquivos) {
      (dados.arquivos?.[tipo] || []).forEach(nomeExistente => {
        if (nomeExistente) {
          form.append(`${tipo}_existente[]`, nomeExistente);
        }
      });

      const input = document.querySelector(`input[name="${tipo}"]`);
      if (input?.files?.length) {
        Array.from(input.files).forEach(file => {
          form.append(tipo, file);
        });
      }
    }

    try {
      const edicao = funcionario && funcionario._id;
      const metodo = edicao ? 'PUT' : 'POST';
      const url = edicao
        ? `${process.env.REACT_APP_API_URL}/api/funcionarios/com-anexos/${funcionario._id}`
        : `${process.env.REACT_APP_API_URL}/api/funcionarios/com-anexos`;

      const response = await fetch(url, { method: metodo, body: form });

      let resultado;
      try {
        resultado = await response.json();
      } catch (e) {
        const texto = await response.text();
        console.error("Resposta inesperada do servidor:", texto);
        throw new Error("Erro interno do servidor. Verifique o backend.");
      }

      if (!response.ok) {
        console.error("Erro ao salvar:", resultado);

        const mensagem = resultado?.error?.includes("duplicate key") && resultado?.error?.includes("cpf")
          ? 'Já existe um funcionário com este CPF.'
          : resultado?.erro || 'Erro ao salvar funcionário com anexos';

        throw new Error(mensagem);
      }

      onSalvar?.(resultado);
      Swal.fire({
        title: 'Grupo Locar',
        text: 'Dados salvos com sucesso.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        handleNovo();
        setTimeout(() => nomeRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      console.log("Dados enviados:", dados);
    } catch (err) {
      console.error('Erro de rede ao salvar funcionário:', err);
      Swal.fire({
        title: 'Erro',
        text: err.message || 'Erro ao salvar funcionário. Verifique os dados e tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Inclui 'estado' como campo textual
  const camposTexto = [
    'nome', 'profissao', 'telefone', 'email', 'endereco', 'complemento',
    'bairro', 'municipio', 'estado', 'cep', 'agencia', 'conta', 'pix', 'cpf', 'rg',
    'cnh', 'nome_familiar', 'contato_familiar', 'indicado', 'observacao'
  ];

  const camposData = ['data_admissao', 'data_demissao', 'data_nascimento', 'validade_cnh', 'emissao_cnh', 'dataUltimoServicoPrestado'];

  // === NOVO: força a ordem com 'estado' logo após 'municipio' e 'data_demissao' após 'data_admissao',
  // e garante 'pj' imediatamente após 'contrato', mesmo que o util ainda não tenha sido atualizado.
  const renderCampos = (() => {
    const arr = [...camposOrdenados];

    // Garante 'pj' após 'contrato'
    const idxContrato = arr.indexOf('contrato');
    const idxPJ = arr.indexOf('pj');
    if (idxContrato !== -1) {
      if (idxPJ === -1) {
        arr.splice(idxContrato + 1, 0, 'pj');
      } else if (idxPJ !== idxContrato + 1) {
        arr.splice(idxPJ, 1);
        arr.splice(idxContrato + 1, 0, 'pj');
      }
    }

    const idxMunicipio = arr.indexOf('municipio');
    const idxEstado = arr.indexOf('estado');
    if (idxMunicipio !== -1) {
      if (idxEstado === -1) {
        arr.splice(idxMunicipio + 1, 0, 'estado');
      } else if (idxEstado !== idxMunicipio + 1) {
        arr.splice(idxEstado, 1);
        arr.splice(idxMunicipio + 1, 0, 'estado');
      }
    } else if (idxEstado === -1) {
      arr.push('estado');
    }

    const idxAdmissao = arr.indexOf('data_admissao');
    const idxDemissao = arr.indexOf('data_demissao');
    if (idxAdmissao !== -1) {
      if (idxDemissao === -1) {
        arr.splice(idxAdmissao + 1, 0, 'data_demissao');
      } else if (idxDemissao !== idxAdmissao + 1) {
        arr.splice(idxDemissao, 1);
        arr.splice(idxAdmissao + 1, 0, 'data_demissao');
      }
    } else if (idxDemissao === -1) {
      arr.push('data_demissao');
    }

    return arr;
  })();

  return (
    <form ref={formularioRef}>
      <fieldset className="secao">
        <legend>Dados do Funcionário</legend>
        <div className="grid-container">
          {renderCampos.map(campo => {
            if (camposDesabilitados.includes(campo)) return null;

            // ✅ Campo PJ (checkbox)
            if (campo === 'pj') {
              return (
                <div key={campo} className="campo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="pj" style={{ marginRight: '8px' }}>
                    {labels.pj || 'PJ'}
                  </label>
                  <input
                    type="checkbox"
                    name="pj"
                    id="pj"
                    checked={!!dados.pj}
                    onChange={handleChange}
                    ref={el => refs.current.pj = el}
                    style={getInputStyle('pj')}
                  />
                </div>
              );
            }

            if (selects[`opcoes${campo.charAt(0).toUpperCase() + campo.slice(1)}`]) {
              const opcoes = selects[`opcoes${campo.charAt(0).toUpperCase() + campo.slice(1)}`];
              return (
                <div key={campo} className="campo">
                  <label htmlFor={campo}>{labels[campo] || (campo === 'estado' ? 'Estado' : campo)}</label>
                  <select
                    name={campo}
                    value={dados[campo] || ''}
                    onChange={handleChange}
                    style={getInputStyle(campo)}
                    ref={el => refs.current[campo] = el}
                  >
                    <option value="">Selecione</option>
                    {opcoes.map(opcao => (
                      <option key={opcao} value={opcao}>{opcao}</option>
                    ))}
                  </select>
                </div>
              );
            }

            if (camposData.includes(campo)) {
              return (
                <div key={campo} className="campo">
                  <label htmlFor={campo}>
                    {labels[campo] || (
                      campo === 'data_demissao' ? 'Data de Demissão'
                      : (campo === 'estado' ? 'Estado' : campo)
                    )}
                  </label>
                  <input
                    type="date"
                    name={campo}
                    value={dados[campo]?.slice(0, 10) || ''}
                    onChange={handleChange}
                    disabled={campo === 'dataUltimoServicoPrestado'}
                    style={getInputStyle(campo)}
                    ref={el => refs.current[campo] = el}
                  />
                </div>
              );
            }

            if (campo === 'observacao') {
              return (
                <div key={campo} className="campo">
                  <label htmlFor={campo}>{labels[campo] || 'Observação'}</label>
                  <textarea
                    name={campo}
                    value={dados[campo] || ''}
                    onChange={handleChange}
                    maxLength={limites[campo] || undefined}
                    rows={5}
                    style={{ ...getInputStyle(campo), width: '320px', height: '80px', resize: 'vertical' }}
                  />
                </div>
              );
            }

            if (campo === 'filhos') {
              return (
                <div key={campo} className="campo">
                  <label htmlFor={campo}>{labels[campo] || 'Filhos'}</label>
                  <input
                    type="number"
                    name={campo}
                    value={dados[campo] ?? '0'}
                    min={0}
                    max={9}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value, 10);
                      if (!isNaN(valor) && valor >= 0 && valor <= 9) {
                        setDados(prev => ({ ...prev, filhos: valor }));
                      } else if (e.target.value === '') {
                        setDados(prev => ({ ...prev, filhos: '' }));
                      }
                    }}
                    style={getInputStyle(campo)}
                    ref={el => refs.current[campo] = el}
                  />
                </div>
              );
            }

            if (camposTexto.includes(campo)) {
              return (
                <div key={campo} className="campo">
                  <label htmlFor={campo}>{labels[campo] || (campo === 'estado' ? 'Estado' : campo)}</label>
                  <input
                    ref={campo === 'nome' ? nomeRef : el => refs.current[campo] = el}
                    type="text"
                    name={campo}
                    value={dados[campo] || ''}
                    onChange={handleChange}
                    onInput={(e) => {
                      // remove acentos de todos os campos texto
                      let val = removerAcentos(e.target.value);

                      // força UF MAIÚSCULO e 2 chars apenas
                      if (campo === 'estado') {
                        val = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                        e.target.value = val;
                      } else {
                        if (e.target.value !== val) e.target.value = val;
                      }
                    }}
                    maxLength={limites[campo] || undefined}
                    style={getInputStyle(campo)}
                    placeholder={
                      campo === 'cep' ? '00.000-000'
                        : (campo === 'estado' ? 'UF' : undefined)
                    }
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </fieldset>

      <fieldset className="secao anexos-container">
        <legend>Anexos</legend>
        {Object.keys(dados.arquivos).map((campo) => {
          const arquivo = dados.arquivos[campo]?.[0] || '';
          const nomeExibicao = arquivo
            ? arquivo.startsWith('http')
              ? decodeURIComponent(arquivo.split('/').pop().split('?')[0])
              : arquivo
            : 'Nenhum arquivo escolhido';

          const abrirArquivo = () => {
            if (!arquivo) return;
            const url = arquivo.startsWith('http')
              ? arquivo
              : `${process.env.REACT_APP_API_URL}/uploads/${arquivo}`;
            window.open(url, '_blank');
          };

          return (
            <div key={campo} className="linha-anexo">
              <label className="label-anexo">{labels[campo]}</label>
              <div className="input-anexo-container">
                <input
                  type="file"
                  name={campo}
                  id={campo}
                  onChange={(e) => handleArquivoChange(e, campo)}
                  className="input-arquivo"
                />
                <span className="nome-arquivo">{nomeExibicao}</span>
                <button
                  type="button"
                  className="btn-abrir"
                  onClick={abrirArquivo}
                  disabled={!arquivo}
                  title="Abrir anexo"
                >
                  🗂️
                </button>
              </div>
            </div>
          );
        })}
      </fieldset>

      <div className="botoes">
        <button type="button" className="btnSalvar" onClick={salvar}>Salvar</button>
        <button type="button" className="btnNovo" onClick={handleNovo}>Novo</button>
      </div>
    </form>
  );
});

export default FormularioFuncionario;
