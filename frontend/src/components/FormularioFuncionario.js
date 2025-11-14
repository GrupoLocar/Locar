// src/components/FormularioFuncionario.js
import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle
} from 'react';
import {
  camposOrdenados,
  camposDesabilitados,
  labels,
  selects,
  formatTelefone,
  formatCPF,
  formatRG
} from '../utils/FormUtils';
import { normalizarFuncionario } from '../utils/normalizarFuncionario';
import { getInputStyle } from '../utils/InputStyles';
import './FormularioFuncionario.css';
import Swal from 'sweetalert2';
import { removerAcentos, capitalizarTexto, capitalizarNomeProprio } from '../utils/funcao';
import { buscarCepFormatado } from '../utils/buscacep';

// === Máscara local de CEP: 00.000-000 ===
function maskCEP(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}-${d.slice(5)}`;
}

const limites = {
  nome: 80,
  profissao: 30,
  telefone: 14,
  email: 60,
  endereco: 100,
  complemento: 60,
  bairro: 80,
  municipio: 80,
  estado: 2,
  cep: 10,
  agencia: 10,
  conta: 25,
  pix: 80,
  cpf: 14,
  rg: 12,
  estado_Civil: 11,
  filhos: 1,
  cnh: 11,
  categoria: 2,
  nome_familiar: 80,
  contato_familiar: 15,
  indicado: 80,
  observacao: 500
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

const FormularioFuncionario = forwardRef(
  ({ funcionario = {}, onSalvar, onNovo, onCancelar }, ref) => {
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
      pj: false,
      filhos: 0
    });

    useImperativeHandle(ref, () => ({
      dispararNovo: () => handleNovo()
    }));

    // Quando entrar em modo edição
    useEffect(() => {
      if (!funcionario || !funcionario._id) return;

      const funcionarioNormalizado = normalizarFuncionario(funcionario);

      setDados(prev => {
        if (prev._id === funcionarioNormalizado._id) return prev;
        return {
          ...prev,
          ...funcionarioNormalizado,
          pj: !!funcionarioNormalizado.pj
        };
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
              const cidade = info.cidade || ''; // vem do buscacep.js
              const estado = (info.estado || '').toUpperCase();

              setDados(prev => ({
                ...prev,
                endereco: capitalizarTexto(
                  removerAcentos(endereco || prev.endereco || '')
                ),
                bairro: capitalizarTexto(
                  removerAcentos(bairro || prev.bairro || '')
                ),
                // MAPEAMENTO: cidade -> municipio
                municipio: capitalizarTexto(
                  removerAcentos(cidade || prev.municipio || '')
                ),
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

    const camposData = [
      'data_admissao',
      'data_demissao',
      'data_nascimento',
      'validade_cnh',
      'emissao_cnh',
      'dataUltimoServicoPrestado'
    ];

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;

      // Checkbox PJ
      if (name === 'pj') {
        setDados(prev => ({ ...prev, pj: !!checked }));
        return;
      }

      // Campos de data: limita ano em 4 dígitos
      if (camposData.includes(name)) {
        const limitado = limitarAno4Digitos(value);
        setDados(prev => ({ ...prev, [name]: limitado }));
        return;
      }

      if (type === 'number') {
        if (name === 'filhos') {
          let v = value === '' ? '' : parseInt(value, 10);
          if (isNaN(v) || v < 0) v = 0;
          if (v > 9) v = 9;
          setDados(prev => ({ ...prev, filhos: v }));
          return;
        }
      }

      if (name === 'telefone' || name === 'contato_familiar') {
        setDados(prev => ({ ...prev, [name]: formatTelefone(value) }));
      } else if (name === 'cep') {
        setDados(prev => ({ ...prev, cep: maskCEP(value) }));
      } else if (name === 'cpf') {
        setDados(prev => ({ ...prev, [name]: formatCPF(value) }));
      } else if (name === 'rg') {
        setDados(prev => ({ ...prev, [name]: formatRG(value) }));
      } else if (name === 'estado') {
        const uf = (value || '')
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .slice(0, 2);
        setDados(prev => ({ ...prev, estado: uf }));
      } else if (
        selects[`opcoes${name.charAt(0).toUpperCase() + name.slice(1)}`]
      ) {
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
      const files = Array.from(e.target.files || []);
      if (!dados.nome || typeof dados.nome !== 'string') {
        Swal.fire({
          title: 'Grupo Locar',
          text: 'Preencha o campo Nome antes de anexar arquivos.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
        e.target.value = '';
        return;
      }

      const nomeBase = removerAcentos(dados.nome)
        .trim()
        .replace(/\s+/g, '_');

      const arquivosRenomeados = files.map(file => {
        const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
        const timestamp = Date.now();
        const novoNome = `${nomeBase}_${campo}_${timestamp}${ext ? '.' + ext : ''}`;
        return novoNome;
      });

      setDados(prev => ({
        ...prev,
        arquivos: {
          ...prev.arquivos,
          [campo]: arquivosRenomeados
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
        formularioRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        nomeRef.current?.focus();
      }, 100);

      if (typeof onNovo === 'function') {
        onNovo();
      }
    };

    const salvar = async () => {
      const ignorarCampos = [
        'observacao',
        'cnh_arquivo',
        'comprovante_residencia',
        'nada_consta',
        'comprovante_mei',
        'curriculo'
      ];

      // Campos que também têm validação de quantidade de dígitos numéricos
      const camposValidarTamanho = [
        'telefone',
        'cep',
        'cpf',
        'rg',
        'cnh',
        'contato_familiar'
      ]; // 'estado' não entra aqui (é alfabético)

      for (let campo of camposOrdenados) {
        if (!ignorarCampos.includes(campo) && !camposDesabilitados.includes(campo)) {
          if (campo === 'pj') {
            // checkbox não é obrigatório
          } else {
            if (
              dados[campo] === undefined ||
              dados[campo] === null ||
              dados[campo] === ''
            ) {
              const refCampo = refs.current[campo];
              if (refCampo && refCampo.focus) refCampo.focus();
              Swal.fire({
                title: 'Grupo Locar',
                text: `Preencha o campo ${
                  labels[campo] || (campo === 'estado' ? 'Estado' : campo)
                }.`,
                icon: 'info',
                confirmButtonText: 'OK'
              });
              return;
            }
          }

          if (camposValidarTamanho.includes(campo)) {
            const valorNumerico = dados[campo]?.replace?.(/\D/g, '') || '';
            const digitosEsperados = {
              telefone: 11,
              contato_familiar: 11,
              cpf: 11,
              rg: 9,
              cep: 8,
              cnh: 11
            };
            const esperado = digitosEsperados[campo];
            if (esperado && valorNumerico.length !== esperado) {
              const refCampo = refs.current[campo];
              if (refCampo && refCampo.focus) refCampo.focus();
              Swal.fire({
                title: 'Grupo Locar',
                text: `O campo ${
                  labels[campo] || campo
                } deve conter ${esperado} dígitos numéricos.`,
                icon: 'info',
                confirmButtonText: 'OK'
              });
              return;
            }
          }
        }
      }

      const form = new FormData();

      // Garante PJ como boolean string
      form.append('pj', dados.pj ? 'true' : 'false');

      // Campos "normais" (exceto anexos)
      for (const campo of camposOrdenados) {
        if (
          ['cnh_arquivo', 'comprovante_residencia', 'nada_consta', 'comprovante_mei', 'curriculo'].includes(
            campo
          )
        ) {
          continue;
        }

        if (campo === 'pj') continue;

        if (
          dados[campo] !== undefined &&
          dados[campo] !== null &&
          dados[campo] !== ''
        ) {
          if (campo === 'filhos') {
            form.append(campo, parseInt(dados[campo], 10) || 0);
          } else {
            form.append(campo, dados[campo]);
          }
        }
      }

      // Garante 'nome' caso não tenha vindo no laço acima
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

      // Anexos existentes + novos arquivos
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
          console.error('Resposta inesperada do servidor:', texto);
          throw new Error('Erro interno do servidor. Verifique o backend.');
        }

        if (!response.ok) {
          const mensagem =
            resultado?.message ||
            resultado?.error ||
            `Erro (${response.status}) ao salvar funcionário.`;
          throw new Error(mensagem);
        }

        if (typeof onSalvar === 'function') {
          onSalvar(resultado);
        }

        await Swal.fire({
          title: 'Grupo Locar',
          text: 'Dados salvos com sucesso.',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Após salvar, limpa e foca no topo
        handleNovo();
        setTimeout(
          () =>
            nomeRef.current?.scrollIntoView({
              behavior: 'smooth'
            }),
          100
        );
      } catch (err) {
        console.error('Erro de rede ao salvar funcionário:', err);
        Swal.fire({
          title: 'Erro',
          text:
            err.message ||
            'Erro ao salvar funcionário. Verifique os dados e tente novamente.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };

    // Campos de texto
    const camposTexto = [
      'nome',
      'profissao',
      'telefone',
      'email',
      'endereco',
      'complemento',
      'bairro',
      'municipio',
      'estado',
      'cep',
      'agencia',
      'conta',
      'pix',
      'cpf',
      'rg',
      'cnh',
      'nome_familiar',
      'contato_familiar',
      'indicado',
      'observacao'
    ];

    const camposNumericos = ['filhos'];

    // Força a ordem com 'estado' logo após 'municipio', 'data_demissao' após 'data_admissao'
    // e garante 'pj' imediatamente após 'contrato'
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
              if (camposDesabilitados.includes(campo)) {
                return null;
              }

              // Checkbox PJ
              if (campo === 'pj') {
                return (
                  <div key={campo} className="campo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="pj" style={{ marginRight: '8px' }}>
                      PJ
                    </label>
                    <input
                      id="pj"
                      type="checkbox"
                      name="pj"
                      checked={!!dados.pj}
                      onChange={handleChange}
                      ref={el => (refs.current.pj = el)}
                      style={getInputStyle('pj')}
                    />
                  </div>
                );
              }

              // Selects baseados no objeto selects
              if (selects[`opcoes${campo.charAt(0).toUpperCase() + campo.slice(1)}`]) {
                const opcoes =
                  selects[
                    `opcoes${campo.charAt(0).toUpperCase() + campo.slice(1)}`
                  ];
                return (
                  <div key={campo} className="campo">
                    <label htmlFor={campo}>
                      {labels[campo] || (campo === 'estado' ? 'Estado' : campo)}
                    </label>
                    <select
                      name={campo}
                      value={dados[campo] || ''}
                      onChange={handleChange}
                      style={getInputStyle(campo)}
                      ref={el => (refs.current[campo] = el)}
                    >
                      <option value="">Selecione</option>
                      {opcoes.map(opcao => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              // Campos de data
              if (camposData.includes(campo)) {
                return (
                  <div key={campo} className="campo">
                    <label htmlFor={campo}>
                      {labels[campo] ||
                        (campo === 'data_admissao'
                          ? 'Data de Admissão'
                          : campo === 'data_demissao'
                          ? 'Data de Demissão'
                          : campo === 'estado'
                          ? 'Estado'
                          : campo)}
                    </label>
                    <input
                      type="date"
                      name={campo}
                      value={dados[campo]?.slice(0, 10) || ''}
                      onChange={handleChange}
                      disabled={campo === 'dataUltimoServicoPrestado'}
                      style={getInputStyle(campo)}
                      ref={el => (refs.current[campo] = el)}
                    />
                  </div>
                );
              }

              // Campo filhos numérico
              if (camposNumericos.includes(campo)) {
                return (
                  <div key={campo} className="campo">
                    <label htmlFor={campo}>{labels[campo] || campo}</label>
                    <input
                      type="number"
                      name={campo}
                      min={0}
                      max={9}
                      value={dados[campo] === '' ? '' : dados[campo] ?? 0}
                      onChange={handleChange}
                      style={getInputStyle(campo)}
                      ref={el => (refs.current[campo] = el)}
                    />
                  </div>
                );
              }

              // Textarea para observação
              if (campo === 'observacao') {
                return (
                  <div key={campo} className="campo">
                    <label htmlFor={campo}>{labels[campo] || campo}</label>
                    <textarea
                      name={campo}
                      value={dados[campo] || ''}
                      onChange={handleChange}
                      maxLength={limites[campo] || undefined}
                      style={{
                        ...getInputStyle(campo),
                        width: '320px',
                        height: '80px',
                        resize: 'vertical'
                      }}
                      ref={el => (refs.current[campo] = el)}
                    />
                  </div>
                );
              }

              // Campos texto genéricos
              if (camposTexto.includes(campo)) {
                return (
                  <div key={campo} className="campo">
                    <label htmlFor={campo}>{labels[campo] || campo}</label>
                    <input
                      ref={campo === 'nome' ? nomeRef : el => (refs.current[campo] = el)}
                      type="text"
                      name={campo}
                      value={dados[campo] || ''}
                      onChange={handleChange}
                      onInput={e => {
                        let val = removerAcentos(e.target.value);

                        if (campo === 'estado') {
                          val = val
                            .toUpperCase()
                            .replace(/[^A-Z]/g, '')
                            .slice(0, 2);
                          e.target.value = val;
                        } else {
                          if (e.target.value !== val) e.target.value = val;
                        }
                      }}
                      maxLength={limites[campo] || undefined}
                      style={getInputStyle(campo)}
                      placeholder={
                        campo === 'cep'
                          ? '00.000-000'
                          : campo === 'estado'
                          ? 'UF'
                          : undefined
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
          {Object.keys(dados.arquivos).map(campo => {
            const arquivo = dados.arquivos[campo]?.[0] || '';
            const nomeExibicao = arquivo
              ? arquivo.startsWith('http')
                ? decodeURIComponent(
                    arquivo.split('/').pop().split('?')[0]
                  )
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
                <label className="label-anexo">
                  {campo === 'cnh_arquivo'
                    ? 'Arquivo da CNH'
                    : campo === 'comprovante_residencia'
                    ? 'Comprovante de Residência'
                    : campo === 'nada_consta'
                    ? 'Nada Consta da CNH'
                    : campo === 'comprovante_mei'
                    ? 'Comprovante do MEI'
                    : campo === 'curriculo'
                    ? 'Currículo'
                    : campo}
                </label>
                <div className="input-anexo-container">
                  <input
                    id={campo}
                    className="input-arquivo"
                    type="file"
                    name={campo}
                    onChange={e => handleArquivoChange(e, campo)}
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
          <button type="button" className="btnSalvar" onClick={salvar}>
            Salvar
          </button>
          <button
            type="button"
            className="btnNovo"
            onClick={() => {
              // limpa o formulário
              handleNovo();
              // e avisa o componente pai para ESCONDER o formulário
              if (typeof onCancelar === 'function') onCancelar();
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }
);

export default FormularioFuncionario;
