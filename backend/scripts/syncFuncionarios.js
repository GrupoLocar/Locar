import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

console.log('⚙️ Entrou na função syncFuncionarios');

async function syncFuncionarios() {

  const ATLAS_URI = process.env.ATLAS_URI;
  const LOCAL_URI = process.env.LOCAL_URI;

  console.log('⚙️ Iniciando syncFuncionarios()');
  console.log('🔎 ATLAS_URI:', ATLAS_URI);
  console.log('🔎 LOCAL_URI:', LOCAL_URI);

  if (!ATLAS_URI) throw new Error('ATLAS_URI está undefined');
  if (!LOCAL_URI) throw new Error('LOCAL_URI está undefined');

  const atlasClient = new MongoClient(ATLAS_URI);
  const localClient = new MongoClient(LOCAL_URI);

  try {
    console.log('🔌 Conectando ao MongoDB Atlas...');
    await atlasClient.connect();
    console.log('✅ Conectado ao Atlas');

    console.log('🔌 Conectando ao MongoDB Local...');
    await localClient.connect();
    console.log('✅ Conectado ao Local');

    const atlasDb = atlasClient.db('formulario');
    const localDb = localClient.db('grupolocar');

    const atlasCollection = atlasDb.collection('funcionarios');
    const localCollection = localDb.collection('funcionarios');

    console.log('📥 Buscando CPFs do banco local...');
    const locais = await localCollection.find({})
      .project({ cpf: 1, data_envio_local: 1 })
      .toArray();
    console.log(`✅ ${locais.length} registros encontrados no local.`);

    const mapaLocal = new Map(locais.map(doc => [doc.cpf, doc.data_envio_local]));

    console.log('🌐 Buscando registros do Atlas...');
    const atlasDocs = await atlasCollection.find({}).toArray();
    console.log(`✅ ${atlasDocs.length} registros encontrados no Atlas.`);

    const registrosParaAtualizar = [];

    for (const doc of atlasDocs) {
      const cpf = doc.cpf;
      const dataAtlas = new Date(doc.data_envio_local);
      const dataLocal = mapaLocal.get(cpf);

      if (!dataLocal || dataAtlas > dataLocal) {
        registrosParaAtualizar.push(doc);
      }
    }

    if (registrosParaAtualizar.length === 0) {
      console.log('🔄 Os dados já estão sincronizados. Nenhuma atualização necessária.');
      return;
    }

    console.log(`📤 Sincronizando ${registrosParaAtualizar.length} registros para o banco local...`);

    for (const doc of registrosParaAtualizar) {
      await localCollection.updateOne(
        { cpf: doc.cpf },
        { $set: doc },
        { upsert: true }
      );
    }

    console.log(`✅ ${registrosParaAtualizar.length} registros sincronizados com sucesso.`);
  } catch (err) {
    console.error('❌ Erro durante a sincronização:', err.message);
    console.error(err.stack);
  } finally {
    await atlasClient.close();
    await localClient.close();
    console.log('🔌 Conexões fechadas.');
  }
}

export default syncFuncionarios;
