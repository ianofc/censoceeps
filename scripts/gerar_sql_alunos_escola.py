# -*- coding: utf-8 -*-
"""
Gera:
1. sql/13_alunos_escola.sql (DDL + RLS + Trigger + Seed de todos os 1.490 alunos com suas turmas)
2. src/data/alunos_turmas.json (Catálogo estruturado para fallback offline e auto-preenchimento)
"""

import json
import re
import unicodedata
from processar_todos_alunos import raw_turmas
from gerar_lista_final_alunos import mapa_padronizacao

def normalizar(s: str) -> str:
    n = unicodedata.normalize('NFKD', s)
    n = ''.join(c for c in n if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', n).strip().upper()

def limpar_nome(s: str) -> str:
    s_limpo = re.sub(r'\s+', ' ', s).strip().upper()
    return mapa_padronizacao.get(s_limpo, s_limpo)

def extrair_metadados_turma(turma_label: str):
    """
    Extrai código curto da turma e, quando conhecido (ex: Turma 6 -> 1º ADM CM),
    já define série e turma padrão.
    """
    if "1º ADM CM" in turma_label:
        return {
            "turma_codigo": "Turma 06 (1º ADM CM)",
            "serie": "1º Ano Técnico",
            "turma": "1º ADM CM",
            "turno": "Matutino"
        }
    m = re.match(r"Turma\s+(\d+)", turma_label)
    num = int(m.group(1)) if m else 0
    codigo = f"Turma {num:02d}" if num else turma_label
    return {
        "turma_codigo": codigo,
        "serie": None,
        "turma": codigo,
        "turno": None
    }

alunos_catalogo = {}

for turma_label, nomes in raw_turmas.items():
    meta = extrair_metadados_turma(turma_label)
    for raw_nome in nomes:
        nome = limpar_nome(raw_nome)
        norm = normalizar(nome)
        if norm not in alunos_catalogo:
            alunos_catalogo[norm] = {
                "nome_completo": nome,
                "nome_normalizado": norm,
                "turma_codigo": meta["turma_codigo"],
                "turma_origem": turma_label,
                "serie": meta["serie"],
                "turma": meta["turma"],
                "turno": meta["turno"]
            }
        else:
            # Se o aluno aparecer também na Turma 6 (1º ADM CM), prioriza os metadados mais ricos
            if meta["serie"] and not alunos_catalogo[norm]["serie"]:
                alunos_catalogo[norm].update({
                    "turma_codigo": meta["turma_codigo"],
                    "turma_origem": turma_label,
                    "serie": meta["serie"],
                    "turma": meta["turma"],
                    "turno": meta["turno"]
                })

lista_ordenada = sorted(alunos_catalogo.values(), key=lambda x: x["nome_normalizado"])

print(f"Total de alunos únicos estruturados para a tabela 'alunos_escola': {len(lista_ordenada)}")

# 1. Salvar catálogo estruturado em src/data/alunos_turmas.json
with open('c:/Users/Ian Santos/Desktop/VSCODE/censoceeps/src/data/alunos_turmas.json', 'w', encoding='utf-8') as f:
    json.dump(lista_ordenada, f, ensure_ascii=False, indent=2)

# 2. Gerar SQL completo em sql/13_alunos_escola.sql
def sql_str(val):
    if val is None:
        return "NULL"
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

sql_lines = [
    "-- sql/13_alunos_escola.sql",
    "-- Tabela dedicada com o catálogo oficial de todos os alunos das 43 turmas do CEEP Seabra",
    "",
    "-- 1. Função utilitária de normalização de nomes no PostgreSQL (sem acentos e maiúsculo)",
    "CREATE OR REPLACE FUNCTION public.normalizar_nome_censo(texto text)",
    "RETURNS text",
    "LANGUAGE sql IMMUTABLE AS $$",
    "  SELECT trim(regexp_replace(",
    "    translate(",
    "      upper(coalesce(texto, '')),",
    "      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',",
    "      'AAAAAEEEEIIIIOOOOOUUUUCNAAAAAEEEEIIIIOOOOOUUUUCN'",
    "    ),",
    "    '\\s+', ' ', 'g'",
    "  ));",
    "$$;",
    "",
    "-- 2. Criação da tabela dedicada public.alunos_escola",
    "CREATE TABLE IF NOT EXISTS public.alunos_escola (",
    "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
    "  nome_completo TEXT NOT NULL,",
    "  nome_normalizado TEXT NOT NULL UNIQUE,",
    "  turma_codigo TEXT NOT NULL,",
    "  turma_origem TEXT,",
    "  serie TEXT,",
    "  turma TEXT,",
    "  turno TEXT,",
    "  ja_entrevistado BOOLEAN NOT NULL DEFAULT false,",
    "  entrevistador_id UUID REFERENCES public.pessoas(id) ON DELETE SET NULL,",
    "  entrevista_id UUID REFERENCES public.entrevistas(id) ON DELETE SET NULL,",
    "  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),",
    "  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())",
    ");",
    "",
    "CREATE INDEX IF NOT EXISTS idx_alunos_escola_nome_norm ON public.alunos_escola(nome_normalizado);",
    "CREATE INDEX IF NOT EXISTS idx_alunos_escola_turma ON public.alunos_escola(turma_codigo);",
    "CREATE INDEX IF NOT EXISTS idx_alunos_escola_entrevistado ON public.alunos_escola(ja_entrevistado);",
    "",
    "-- 3. Habilitar Row Level Security (RLS)",
    "ALTER TABLE public.alunos_escola ENABLE ROW LEVEL SECURITY;",
    "",
    "DROP POLICY IF EXISTS \"Leitura publica de alunos_escola\" ON public.alunos_escola;",
    "CREATE POLICY \"Leitura publica de alunos_escola\"",
    "  ON public.alunos_escola FOR SELECT",
    "  USING (true);",
    "",
    "DROP POLICY IF EXISTS \"Insercao de alunos_escola por autenticados\" ON public.alunos_escola;",
    "CREATE POLICY \"Insercao de alunos_escola por autenticados\"",
    "  ON public.alunos_escola FOR INSERT",
    "  TO authenticated",
    "  WITH CHECK (true);",
    "",
    "DROP POLICY IF EXISTS \"Atualizacao de alunos_escola por autenticados\" ON public.alunos_escola;",
    "CREATE POLICY \"Atualizacao de alunos_escola por autenticados\"",
    "  ON public.alunos_escola FOR UPDATE",
    "  TO authenticated",
    "  USING (true)",
    "  WITH CHECK (true);",
    "",
    "-- 4. Trigger automático: quando uma entrevista é salva em public.entrevistas,",
    "-- marca o aluno como entrevistado e atualiza série/turma/turno automaticamente!",
    "CREATE OR REPLACE FUNCTION public.sync_aluno_escola_from_entrevista()",
    "RETURNS TRIGGER AS $$",
    "DECLARE",
    "  v_norm text;",
    "BEGIN",
    "  v_norm := public.normalizar_nome_censo(NEW.nome_participante);",
    "  IF v_norm IS NOT NULL AND v_norm <> '' AND v_norm <> 'ANONIMO' THEN",
    "    UPDATE public.alunos_escola",
    "    SET",
    "      ja_entrevistado = true,",
    "      entrevistador_id = COALESCE(NEW.entrevistador_id, entrevistador_id),",
    "      entrevista_id = NEW.id,",
    "      serie = COALESCE(NULLIF(trim(NEW.serie), ''), serie),",
    "      turma = COALESCE(NULLIF(trim(NEW.turma), ''), turma),",
    "      turno = COALESCE(NULLIF(trim(NEW.turno), ''), turno),",
    "      updated_at = timezone('utc'::text, now())",
    "    WHERE nome_normalizado = v_norm;",
    "  END IF;",
    "  RETURN NEW;",
    "END;",
    "$$ LANGUAGE plpgsql SECURITY DEFINER;",
    "",
    "DROP TRIGGER IF EXISTS trg_sync_aluno_escola_entrevista ON public.entrevistas;",
    "CREATE TRIGGER trg_sync_aluno_escola_entrevista",
    "AFTER INSERT OR UPDATE ON public.entrevistas",
    "FOR EACH ROW",
    "EXECUTE FUNCTION public.sync_aluno_escola_from_entrevista();",
    "",
    "-- 5. Carga inicial (Seed) dos 1.490 alunos únicos das 43 turmas",
    "INSERT INTO public.alunos_escola (nome_completo, nome_normalizado, turma_codigo, turma_origem, serie, turma, turno)",
    "VALUES"
]

values_rows = []
for item in lista_ordenada:
    row = (
        f"  ({sql_str(item['nome_completo'])}, "
        f"{sql_str(item['nome_normalizado'])}, "
        f"{sql_str(item['turma_codigo'])}, "
        f"{sql_str(item['turma_origem'])}, "
        f"{sql_str(item['serie'])}, "
        f"{sql_str(item['turma'])}, "
        f"{sql_str(item['turno'])})"
    )
    values_rows.append(row)

sql_lines.append(",\n".join(values_rows))
sql_lines.extend([
    "ON CONFLICT (nome_normalizado) DO UPDATE SET",
    "  nome_completo = EXCLUDED.nome_completo,",
    "  turma_codigo = EXCLUDED.turma_codigo,",
    "  turma_origem = EXCLUDED.turma_origem,",
    "  serie = COALESCE(public.alunos_escola.serie, EXCLUDED.serie),",
    "  turma = COALESCE(public.alunos_escola.turma, EXCLUDED.turma),",
    "  turno = COALESCE(public.alunos_escola.turno, EXCLUDED.turno),",
    "  updated_at = timezone('utc'::text, now());",
    "",
    "-- 6. Sincronização retroativa com as entrevistas que já estão salvas no banco",
    "UPDATE public.alunos_escola a",
    "SET",
    "  ja_entrevistado = true,",
    "  entrevistador_id = e.entrevistador_id,",
    "  entrevista_id = e.id,",
    "  serie = COALESCE(NULLIF(trim(e.serie), ''), a.serie),",
    "  turma = COALESCE(NULLIF(trim(e.turma), ''), a.turma),",
    "  turno = COALESCE(NULLIF(trim(e.turno), ''), a.turno),",
    "  updated_at = timezone('utc'::text, now())",
    "FROM public.entrevistas e",
    "WHERE a.nome_normalizado = public.normalizar_nome_censo(e.nome_participante);",
    ""
])

with open('c:/Users/Ian Santos/Desktop/VSCODE/censoceeps/sql/13_alunos_escola.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print("Arquivos 'sql/13_alunos_escola.sql' e 'src/data/alunos_turmas.json' gerados com sucesso!")
