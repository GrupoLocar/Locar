// node syncFormToLocal.js
import { MongoClient, ObjectId } from 'mongodb';
import snakecaseKeys from 'snakecase-keys';

const uriAtlas  = process.env.ATLAS_URI;          // banco "formulario"
const uriLocal  = process.env.LOCAL_URI;          // banco "grupolocar"
const lastSyncF = 'lastSync.json';                // persiste timestamp

/* --- util: carrega / grava carimbo --- */
const now = new Date();
let since = new Date(0);
try { since = new Date(JSON.parse(await fs.promises.readFile(lastSyncF))); } catch {}
await fs.promises.writeFile(lastSyncF, JSON.stringify(now));

/* --- conexões --- */
const cliAtlas = new MongoClient(uriAtlas);
const cliLocal = new MongoClient(uriLocal);
await cliAtlas.connect(); await cliLocal.connect();

const src  = cliAtlas.db('formulario').collection('funcionarios');
const dest = cliLocal.db('grupolocar').collection('funcionarios');

/* --- pipeline --- */
const cursor = src.find({ updatedAt: { $gt: since } });
let inseridos = 0, atualizados = 0;
for await (const doc of cursor) {
  // 1. converte snake_case → camelCase
  const camel = snakecaseKeys(doc, { deep: true, stripRegexp: /_/g, pascalCase: false });

  // 2. renomeia casos especiais
  camel.dataAdmissao      = camel.dataAdmissao     || camel.data_admissao;
  camel.dataNascimento    = camel.dataNascimento   || camel.data_nascimento;
  camel.dataValidadeCNH   = camel.dataValidadeCNH  || camel.validade_cnh;
  delete camel.data_admissao; delete camel.data_nascimento; delete camel.validade_cnh;

  // 3. garante Date()
  ['dataAdmissao','dataNascimento','dataValidadeCNH','createdAt','updatedAt']
    .forEach(k => camel[k] = camel[k] ? new Date(camel[k]) : null);

  // 4. normaliza selects (capitaliza)
  ['situacao','contrato','banco','estadoCivil','categoria']
    .forEach(k => { if (camel[k]) camel[k] =
       camel[k].charAt(0).toUpperCase() + camel[k].slice(1).toLowerCase() });

  // 5. upsert
  const { matchedCount } = await dest.updateOne(
    { _id: new ObjectId(camel._id) },
    { $set: camel },
    { upsert: true }
  );
  matchedCount ? atualizados++ : inseridos++;
}

console.log(`✔ Sync OK – ${inseridos} inseridos, ${atualizados} atualizados`);
await cliAtlas.close(); await cliLocal.close();
