import csv
import json

# Caminhos dos arquivos
csv_path = r"C:\Locar\data\CadastroFuncionarios.csv"
json_path = r"C:\Locar\data\CadastroFuncionarios.json"

try:
    # Abre e lê o arquivo CSV
    with open(csv_path, mode='r', encoding='utf-8') as csv_file:
        reader = csv.DictReader(csv_file)
        data = list(reader)

    # Salva como JSON formatado
    with open(json_path, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

    print("✅ Conversão concluída com sucesso!")
    print(f"Arquivo JSON gerado em: {json_path}")

except Exception as e:
    print("❌ Erro ao converter CSV para JSON:")
    print(e)
