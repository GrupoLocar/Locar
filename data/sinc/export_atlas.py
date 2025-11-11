import json
import os
from pymongo import MongoClient
from datetime import datetime

ATLAS_URI="mongodb+srv://controladorialocar:hkgXARHPvA6yKsj0@grupolocar.igzhyps.mongodb.net/formulario?retryWrites=true&w=majority&appName=grupolocar"

EXPORT_DIR = r"C:\\Locar\\data\\export"
os.makedirs(EXPORT_DIR, exist_ok=True)

timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
filename = f"formulario_atlas_{timestamp}.json"
filepath = os.path.join(EXPORT_DIR, filename)

client = MongoClient(ATLAS_URI)
collection = client["formulario"]["funcionarios"]

print("🔄 Exportando dados do MongoDB Atlas...")
docs = list(collection.find({}))

# Corrigir _id e datas
for doc in docs:
    doc["_id"] = str(doc["_id"])
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()

with open(filepath, "w", encoding="utf-8") as f:
    json.dump(docs, f, indent=2, ensure_ascii=False)

print(f"✅ Exportado para {filepath}")
