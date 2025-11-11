import os
import json
from pymongo import MongoClient, UpdateOne

IMPORT_DIR = r"C:\Locar\data\export"
LOCAL_URI = "mongodb://localhost:27017/grupolocar"
DB_NAME = "grupolocar"
COLLECTION_NAME = "funcionarios"

# Obter o último arquivo JSON exportado
files = [f for f in os.listdir(IMPORT_DIR) if f.startswith("formulario_atlas_") and f.endswith(".json")]
if not files:
    print("❌ Nenhum arquivo .json encontrado em", IMPORT_DIR)
    exit(1)

latest_file = max(files, key=lambda f: os.path.getctime(os.path.join(IMPORT_DIR, f)))
file_path = os.path.join(IMPORT_DIR, latest_file)

print(f"📥 Importando arquivo: {file_path}")

# Carregar dados e remover o campo _id
with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

client = MongoClient(LOCAL_URI)
collection = client[DB_NAME][COLLECTION_NAME]

ops = []
for doc in data:
    cpf = doc.get("cpf")
    if not cpf:
        continue
    doc.pop("_id", None)  # Remover o _id antes de fazer update
    ops.append(UpdateOne({"cpf": cpf}, {"$set": doc}, upsert=True))

if ops:
    result = collection.bulk_write(ops)
    total = result.upserted_count + result.modified_count
    print(f"✅ {total} registros inseridos/atualizados.")
else:
    print("⚠️ Nenhum registro com CPF válido encontrado.")
