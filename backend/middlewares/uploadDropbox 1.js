import fs from 'fs';
import path from 'path';
import multer from 'multer';

const pastaDestino = 'C:/Users/contr/Dropbox/uploads';

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaDestino);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const campo = file.fieldname;
    const timestamp = Date.now();
    const nomeFinal = `${campo}-${timestamp}${ext}`;
    cb(null, nomeFinal);
  }
});

const upload = multer({ storage });

const uploadDropbox = (req, res, next) => {
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

      // Novo arquivo enviado
      const novoArquivo = req.files?.[campo]?.[0];
      if (novoArquivo) {
        arquivos[campo].push(novoArquivo.filename);

        // Verifica se há arquivo antigo
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
        // Nenhum novo arquivo enviado, manter os existentes
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
};

export default uploadDropbox;


