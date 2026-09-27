-- 1. Criar tipo de papel (role) para utilizadores
CREATE TYPE user_role AS ENUM ('student', 'teacher');

-- 2. Tabela de Perfis de Utilizadores
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'student',
  class_or_sector TEXT, -- Turma do aluno ou setor do professor
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Entrevistas / Coleta de Dados
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vinculo TEXT NOT NULL CHECK(vinculo IN ('ESTUDANTE', 'FUNCIONARIO')),
  grupo_escolar TEXT NOT NULL,
  faixa_etaria TEXT NOT NULL,
  genero TEXT NOT NULL,
  cor_raca TEXT NOT NULL,
  conhece_ancestralidade TEXT NOT NULL,
  geracao_alcancada TEXT,
  povo_indigena TEXT,
  ja_conversou_sobre TEXT NOT NULL,
  ambientes_conversa JSONB NOT NULL DEFAULT '[]',
  sofreu_preconceito TEXT NOT NULL,
  relato_preconceito TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURANÇA (RLS)

-- Perfis: Utilizador vê o seu perfil; Professores vêem todos os perfis.
CREATE POLICY "Politica de Perfis" 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Entrevistas (Leitura): Alunos vêem apenas as suas; Professores vêem todas.
CREATE POLICY "Politica de Leitura de Entrevistas" 
  ON public.interviews FOR SELECT 
  USING (
    interviewer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Entrevistas (Inserção): Alunos autenticados podem inserir as suas entrevistas.
CREATE POLICY "Politica de Insercao de Entrevistas" 
  ON public.interviews FOR INSERT 
  WITH CHECK (interviewer_id = auth.uid());
