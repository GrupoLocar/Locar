import pandas as pd
import json

# Rodar script:
# cd C:\locar
# python converter_EXCEL_para_json.py

# Caminhos dos arquivos
excel_path = r"C:\Locar\data\CadastroFuncionarios.xlsx"
output_path_completo = r"C:\Locar\data\CadastroFuncionarios_completo.json"
output_path_incompleto = r"C:\Locar\data\CadastroFuncionarios_incompleto.json"

# Campos de data a verificar
date_fields = [
    "dataAdmissao",
    "dataNascimento",
    "dataValidadeCNH",
    "dataUltimoServicoPrestado"
]

# Campo obrigatório para manter a linha
required_fields = ["nome"]

try:
    # Lê a planilha
    df = pd.read_excel(excel_path)

    # Converte campos de data para ISO e formata corretamente
    for field in date_fields:
        if field in df.columns:
            df[field] = pd.to_datetime(df[field], errors='coerce') \
                .dt.strftime('%Y-%m-%dT00:00:00Z')
            df[field] = df[field].replace('NaT', None)

    # Substitui NaN por None (evita erro no JSON)
    df = df.where(pd.notnull(df), None)

    # Remove linhas sem nome
    df = df.dropna(subset=required_fields)

    # Remove espaços no final do nome das colunas
    df.columns = df.columns.str.strip()

    # Separa dados completos (todos os campos de data preenchidos)
    df_completo = df.dropna(subset=date_fields)
    df_incompleto = df[~df.index.isin(df_completo.index)]

    # Exporta JSONs
    with open(output_path_completo, 'w', encoding='utf-8') as f:
        json.dump(df_completo.to_dict(orient='records'), f, ensure_ascii=False, indent=4)

    with open(output_path_incompleto, 'w', encoding='utf-8') as f:
        json.dump(df_incompleto.to_dict(orient='records'), f, ensure_ascii=False, indent=4)

    # Saída
    print("✅ Conversão concluída com sucesso!")
    print(f"✔ Registros com TODAS as datas preenchidas: {len(df_completo)}")
    print(f"✔ Registros com ALGUMA data ausente: {len(df_incompleto)}")
    print(f"📁 JSON completo: {output_path_completo}")
    print(f"📁 JSON incompleto: {output_path_incompleto}")

except Exception as e:
    print("❌ Erro ao processar o Excel:")
    print(e)
