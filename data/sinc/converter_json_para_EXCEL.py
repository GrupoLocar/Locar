import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path

# Caminhos de origem e destino
pasta_origem = Path(r"C:\Locar\data\export")
pasta_destino = Path(r"C:\Locar\data\excel")

# Encontrar o arquivo mais recente na pasta de origem
arquivos_json = list(pasta_origem.glob("formulario_atlas_*.json"))
if not arquivos_json:
    raise FileNotFoundError("Nenhum arquivo JSON encontrado na pasta de origem.")

arquivo_mais_recente = max(arquivos_json, key=os.path.getmtime)

# Gerar nome do Excel (trocar .json por .xlsx)
nome_excel = arquivo_mais_recente.stem + ".xlsx"
caminho_excel = pasta_destino / nome_excel

# Carregar o conteúdo JSON
with open(arquivo_mais_recente, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Função para normalizar o conteúdo
def normalize_entry(entry):
    def parse_date(d):
        if isinstance(d, dict) and "$date" in d:
            try:
                return datetime.fromisoformat(d["$date"].replace("Z", "+00:00")).date()
            except:
                return None
        elif isinstance(d, str):
            try:
                return datetime.fromisoformat(d).date()
            except:
                return d
        return d

    # Corrigir o ID
    entry["_id"] = entry["_id"].get("$oid") if isinstance(entry.get("_id"), dict) else entry.get("_id")

    # Normalizar datas
    entry["validade_cnh"] = parse_date(entry.get("validade_cnh"))
    entry["data_nascimento"] = parse_date(entry.get("data_nascimento"))
    entry["data_envio_utc"] = parse_date(entry.get("data_envio_utc"))

    # Normalizar campo nome
    if "nome" in entry:
        entry["nome"] = entry["nome"].title().strip()

    # Extrair links dos anexos para colunas separadas
    arquivos = entry.get("arquivos", {})
    for key in ["cnh_arquivo", "comprovante_residencia", "comprovante_mei", "nada_consta"]:
        entry[key] = ", ".join(arquivos.get(key, []))

    return entry

# Aplicar normalização
dados_normalizados = [normalize_entry(entry) for entry in data]

# Gerar DataFrame e salvar como Excel
df = pd.DataFrame(dados_normalizados)
df.to_excel(caminho_excel, index=False)

print(f"Arquivo convertido com sucesso: {caminho_excel}")
