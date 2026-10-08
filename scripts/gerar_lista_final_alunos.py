# -*- coding: utf-8 -*-
"""
Gera a lista final consolidada contendo APENAS OS NOMES DOS ALUNOS (sem turmas),
garantindo que cada aluno apareça exatamente 1 vez (desduplicação total),
resolvendo tanto duplicatas entre turmas quanto variações ortográficas conhecidas.
"""

import json
import re
import unicodedata

with open('c:/Users/Ian Santos/Desktop/VSCODE/censoceeps/scripts/alunos_extraidos_unicos.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

alunos_raw = data['alunos_unicos']

# Mapa de padronização para variantes ortográficas / erros de digitação óbvios nas pautas:
mapa_padronizacao = {
    "KAMILY VITORIA VIERA FAGUNDES": "KAMILY VITORIA VIEIRA FAGUNDES",
    "EMILY THYINE CORDEIRO DE OLIVEIRA": "EMILY THAINE CORDEIRO DE OLIVEIRA",
    "ANA LUIZA OLIVEIRA ALVES": "ANA LUISA OLIVEIRA ALVES",
    "JOAO VITOR SANTOS DE SOUZA": "JOAO VICTOR SANTOS DE SOUZA",
    "ISABELA GOMES ARAUJO": "ISABELLA GOMES ARAUJO",
    "NATALY MICAELY DE OLIVEIRA": "NATHALY MICAELY DE OLIVEIRA",
    "DANIEL ALVES DE ARAUJO": "DANIEL ALVES ARAUJO",
    "GABRIELA MARTINS SOUZA": "GABRIELA MARTINS DE SOUZA",
    "YASMIM SOUZA SILVA": "YASMIM SOUZA DA SILVA",
    "ANNE CAROLINE TELES PAIVA": "ANNE CAROLINE PAIVA",
    "PAULO VICENTE VIEIRA DE OLIVEIRA CARMNA": "PAULO VICENTE VIEIRA DE OLIVEIRA CARMO"
}

def normalizar(s):
    n = unicodedata.normalize('NFKD', s)
    n = ''.join(c for c in n if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', n).strip().upper()

lista_final_set = {}

for a in alunos_raw:
    nome = mapa_padronizacao.get(a, a)
    nome = re.sub(r'\s+', ' ', nome).strip().upper()
    norm = normalizar(nome)
    if norm not in lista_final_set:
        lista_final_set[norm] = nome

lista_final = sorted(list(lista_final_set.values()), key=normalizar)

print(f"Total original de alunos únicos: {len(alunos_raw)}")
print(f"Total final após resolver variantes ortográficas: {len(lista_final)}")

# Salvar em JSON no diretório scripts
with open('c:/Users/Ian Santos/Desktop/VSCODE/censoceeps/scripts/nomes_alunos_unicos.json', 'w', encoding='utf-8') as f:
    json.dump(lista_final, f, ensure_ascii=False, indent=2)

# Salvar também em formato de texto simples (1 nome por linha)
with open('c:/Users/Ian Santos/Desktop/VSCODE/censoceeps/scripts/nomes_alunos_unicos.txt', 'w', encoding='utf-8') as f:
    for nome in lista_final:
        f.write(nome + '\n')

# Salvar dentro de src/data para uso no frontend da aplicação
import os
os.makedirs('c:/Users/Ian Santos/Desktop/VSCODE/censoceeps/src/data', exist_ok=True)
with open('c:/Users/Ian Santos/Desktop/VSCODE/censoceeps/src/data/alunos.json', 'w', encoding='utf-8') as f:
    json.dump(lista_final, f, ensure_ascii=False, indent=2)

print("Arquivos gerados com sucesso:")
print(" - scripts/nomes_alunos_unicos.json")
print(" - scripts/nomes_alunos_unicos.txt")
print(" - src/data/alunos.json")
