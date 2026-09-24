PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT 'ENTREVISTADOR' CHECK (cargo IN ('ADMINISTRADOR','ENTREVISTADOR')),
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grupos_escolares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('TURMA','SETOR')),
  nome TEXT NOT NULL,
  turno TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tipo, nome, turno)
);

CREATE TABLE IF NOT EXISTS entrevistas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entrevistador_id INTEGER NOT NULL,
  vinculo TEXT NOT NULL CHECK (vinculo IN ('ESTUDANTE','FUNCIONARIO')),
  grupo_escolar_id INTEGER NOT NULL,
  faixa_etaria TEXT NOT NULL,
  cor_raca TEXT NOT NULL CHECK (cor_raca IN ('Branca','Preta','Parda','Amarela','Indígena','Prefiro não responder')),
  conhece_ancestralidade TEXT NOT NULL,
  geracao_alcancada TEXT,
  povo_indigena TEXT,
  ja_conversou_sobre TEXT NOT NULL,
  ambientes_conversa TEXT NOT NULL DEFAULT '[]',
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entrevistador_id) REFERENCES usuarios(id),
  FOREIGN KEY (grupo_escolar_id) REFERENCES grupos_escolares(id)
);

CREATE INDEX IF NOT EXISTS idx_entrevistas_vinculo ON entrevistas(vinculo);
CREATE INDEX IF NOT EXISTS idx_entrevistas_cor ON entrevistas(cor_raca);
CREATE INDEX IF NOT EXISTS idx_entrevistas_grupo ON entrevistas(grupo_escolar_id); PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT,nome TEXT NOT NULL,email TEXT NOT NULL UNIQUE COLLATE NOCASE,senha_hash TEXT NOT NULL,cargo TEXT NOT NULL DEFAULT 'ENTREVISTADOR' CHECK(cargo IN ('ADMINISTRADOR','ENTREVISTADOR')),ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN(0,1)),criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS grupos_escolares (id INTEGER PRIMARY KEY AUTOINCREMENT,tipo TEXT NOT NULL CHECK(tipo IN('TURMA','SETOR')),nome TEXT NOT NULL,turno TEXT NOT NULL,ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN(0,1)),criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(tipo,nome,turno));
CREATE TABLE IF NOT EXISTS entrevistas (id INTEGER PRIMARY KEY AUTOINCREMENT,entrevistador_id INTEGER NOT NULL,vinculo TEXT NOT NULL CHECK(vinculo IN('ESTUDANTE','FUNCIONARIO')),grupo_escolar_id INTEGER NOT NULL,faixa_etaria TEXT NOT NULL,cor_raca TEXT NOT NULL CHECK(cor_raca IN('Branca','Preta','Parda','Amarela','Indígena','Prefiro não responder')),conhece_ancestralidade TEXT NOT NULL,geracao_alcancada TEXT,povo_indigena TEXT,ja_conversou_sobre TEXT NOT NULL,ambientes_conversa TEXT NOT NULL DEFAULT '[]',criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(entrevistador_id) REFERENCES usuarios(id),FOREIGN KEY(grupo_escolar_id) REFERENCES grupos_escolares(id));
CREATE INDEX IF NOT EXISTS idx_entrevistas_vinculo ON entrevistas(vinculo);
CREATE INDEX IF NOT EXISTS idx_entrevistas_cor ON entrevistas(cor_raca);
CREATE INDEX IF NOT EXISTS idx_entrevistas_grupo ON entrevistas(grupo_escolar_id);

