import fs from 'fs';
import path from 'path';
import multer from 'multer';

const pastaDestino = 'C:/Users/contr/Dropbox/uploads'; // Caminho correto

if (!fs.existsSync(pastaDestino)) {
  fs.mkdirSync(pastaDestino, { recursive: true });
}

const camposArquivos = [
  'cnh_arquivo',
  'comprovante_residencia',
  'nada_consta',
  'comprovante_mei',
  'curriculo'
];

const removerAcentos = (texto) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C");
};

const formatarNomeArquivo = (nomeCompleto, campo, originalName) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const nomeSemAcentos = removerAcentos(nomeCompleto || 'Sem_Nome');
  const nomeSanitizado = nomeSemAcentos
    .trim()
    .replace(/\s+/g, ' ') // remove múltiplos espaços
    .replace(/[^\w\s]/gi, '') // remove caracteres especiais
    .replace(/\s/g, '_'); // troca espaços por "_"
  return `${timestamp}_${nomeSanitizado}-${campo}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaDestino);
  },
  filename: (req, file, cb) => {
    let nomeCompleto = req.body.nome;

    // Fallback: tenta pegar do campo 'nome' em texto plano
    if (!nomeCompleto && req.body && typeof req.body === 'object') {
      try {
        nomeCompleto = JSON.parse(req.body).nome;
      } catch (e) {
        // ignora erro
      }
    }

    const campo = file.fieldname;
    const nomeFinal = formatarNomeArquivo(nomeCompleto, campo, file.originalname);
    cb(null, nomeFinal);
  }
});

const upload = multer({ storage });

function uploadDropbox(req, res, next) {
  const middleware = upload.fields(
    camposArquivos.map((campo) => ({ name: campo, maxCount: 1 }))
  );

  middleware(req, res, (err) => {
    if (err) {
      console.error('Erro ao processar upload:', err);
      return res.status(500).json({ erro: 'Erro ao fazer upload dos arquivos.' });
    }

    const arquivos = {};

    for (const campo of camposArquivos) {
      arquivos[campo] = [];

      const novoArquivo = req.files?.[campo]?.[0];
      if (novoArquivo) {
        arquivos[campo].push(novoArquivo.filename);

        const antigos = req.body[`${campo}_existente[]`] || req.body[`${campo}_existente`];
        const antigosArray = Array.isArray(antigos) ? antigos : antigos ? [antigos] : [];

        for (const nome of antigosArray) {
          if (nome && !nome.startsWith('http')) {
            const caminhoAntigo = path.join(pastaDestino, nome);
            if (fs.existsSync(caminhoAntigo)) {
              try {
                fs.unlinkSync(caminhoAntigo);
              } catch (e) {
                console.warn(`Não foi possível remover o arquivo antigo: ${caminhoAntigo}`, e);
              }
            }
          }
        }
      } else {
        const existentes = req.body[`${campo}_existente[]`] || req.body[`${campo}_existente`];
        arquivos[campo] = Array.isArray(existentes)
          ? existentes
          : existentes
          ? [existentes]
          : [];
      }
    }

    req.body.arquivos = arquivos;
    next();
  });
}

export default uploadDropbox;

