# scripts/sync_atlas_to_local.py
import os
import sys
import json
import datetime
from collections import defaultdict
from pymongo import MongoClient
from dotenv import load_dotenv

# 👇 ADIÇÃO: para tolerar datas fora do range do datetime do Python
from bson.codec_options import CodecOptions, DatetimeConversion

# === CARREGA .env ===
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
if not os.path.isfile(dotenv_path):
    raise RuntimeError(f"❌ .env nao encontrado em {dotenv_path}")
load_dotenv(dotenv_path)

# === VARIÁVEIS DE AMBIENTE ===
ATLAS_URI = os.getenv("ATLAS_URI")
# Suporta MONGODB_URI, MONGO_URI ou LOCAL_URI para conexão local
local_uri = (
    os.getenv("MONGODB_URI")
    or os.getenv("MONGO_URI")
    or os.getenv("LOCAL_URI")
)

if not ATLAS_URI or not local_uri:
    raise RuntimeError(
        "❌ ATLAS_URI e/ou string de conexao local (MONGODB_URI, MONGO_URI ou LOCAL_URI) nao definidos no .env.\n"
        + f"Verifique o arquivo em {dotenv_path}"
    )

# === CONFIGURAÇÕES DE BANCO ===
ATLAS_DB         = os.getenv("ATLAS_DB", "formulario")
ATLAS_COLLECTION = os.getenv("ATLAS_COLLECTION", "funcionarios")
LOCAL_DB         = os.getenv("LOCAL_DB", "grupolocar")
LOCAL_COLLECTION = os.getenv("LOCAL_COLLECTION", "funcionarios")

# === EXPORT FOLDER & FILENAME ===
EXPORT_FOLDER = os.getenv(
    "EXPORT_FOLDER",
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'export'))
)
os.makedirs(EXPORT_FOLDER, exist_ok=True)
timestamp       = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
export_filename = f"sync_diffs_{timestamp}.json"
export_path     = os.path.join(EXPORT_FOLDER, export_filename)

# === CONEXÕES ===
print("🔄 Conectando ao Atlas...")

# 👇 ADIÇÃO: ativa DATETIME_AUTO (tolera datas fora do range convertendo para DatetimeMS)
atlas_client = MongoClient(ATLAS_URI, datetime_conversion="DATETIME_AUTO")
# Alternativa (equivalente explícita via CodecOptions):
# codec = CodecOptions(datetime_conversion=DatetimeConversion.DATETIME_AUTO)
# atlas_db = atlas_client.get_database(ATLAS_DB, codec_options=codec)

# Caso queira aplicar via db/collection (forma mais explícita):
codec = CodecOptions(datetime_conversion=DatetimeConversion.DATETIME_AUTO)
atlas_db = atlas_client.get_database(ATLAS_DB, codec_options=codec)
atlas_col = atlas_db.get_collection(ATLAS_COLLECTION)

print("🔄 Conectando ao Banco de Dados Local...")
local_client = MongoClient(local_uri)
local_col    = local_client[LOCAL_DB][LOCAL_COLLECTION]

# === EXTRAÇÃO E AGRUPAMENTO POR CPF ===
print("🔄 Extraindo dados do Atlas...")
try:
    # Com DATETIME_AUTO ativado no codec, não deve mais quebrar em datas inválidas
    atlas_docs = list(atlas_col.find({}))
except Exception as e:
    # Fallback robusto: se ainda assim quebrar, informamos o erro e abortamos
    # (alterne para uma estratégia de projeção específica se necessário)
    raise RuntimeError(f"❌ Falha ao ler documentos do Atlas: {e}")

print(f"📦 {len(atlas_docs)} registro(s) encontrados no Atlas.")

atlas_by_cpf = defaultdict(list)
for doc in atlas_docs:
    cpf = doc.get("cpf")
    if cpf:
        atlas_by_cpf[cpf].append(doc)

# === FILTRA APENAS NOVOS CPFs E ESCOLHE O MAIS RECENTE EM CASO DE DUPLICIDADE ===
docs_to_insert = []
for cpf, docs in atlas_by_cpf.items():
    # Se CPF já existe no local, pula
    if local_col.count_documents({"cpf": cpf}, limit=1) > 0:
        continue

    # Seleciona registro mais recente para CPF duplicado no Atlas
    if len(docs) == 1:
        chosen = docs[0]
    else:
        def parse_date(d):
            val = d.get("data_envio_local")
            # Se já for datetime (datetime ou DatetimeMS), apenas retorna
            if isinstance(val, datetime.datetime):
                return val
            # DatetimeMS (PyMongo) também possui .as_datetime() se quiser normalizar,
            # mas como critério de "recência" apenas tentamos converter:
            try:
                return datetime.datetime.fromisoformat(str(val))
            except Exception:
                return datetime.datetime.min
        chosen = max(docs, key=parse_date)

    new_doc = chosen.copy()
    new_doc.pop("_id", None)
    docs_to_insert.append(new_doc)

# === ABORTA SE NADA NOVO ===
if not docs_to_insert:
    print("⚠️ Todos os CPFs do Atlas ja estao sincronizados no Banco de Dados Local. Cancelando a sincronizacao...")
    sys.exit(0)

# === EXPORTA JSON PARA AUDITORIA ===
with open(export_path, "w", encoding="utf-8") as f:
    # default=str garante serialização de datetime e DatetimeMS sem quebrar
    json.dump(docs_to_insert, f, indent=2, ensure_ascii=False, default=str)
print(f"✅ Diferencas exportadas para: {export_path}")

# === INSERE SOMENTE OS NOVOS DOCUMENTOS NO LOCAL ===
print(f"🔁 Inserindo {len(docs_to_insert)} novo(s) registro(s) no Banco de Dados Local...")
result = local_col.insert_many(docs_to_insert)
print(f"✅ Inseridos {len(result.inserted_ids)} registro(s) com sucesso.")
print("🏁 Sincronizacao finalizada!")
