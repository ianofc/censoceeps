-- Tabela de Feiras de Ciências
CREATE TABLE IF NOT EXISTS public.science_fairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Projetos / Destaque Científico
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fair_id UUID REFERENCES public.science_fairs(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Feedback/Comentários dos Projetos
CREATE TABLE IF NOT EXISTS public.project_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Row Level Security) - Configuração básica de segurança
ALTER TABLE public.science_fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública para usuários autenticados
CREATE POLICY "Permitir leitura de feiras para usuários autenticados" ON public.science_fairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura de projetos para usuários autenticados" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura de feedbacks para usuários autenticados" ON public.project_feedback FOR SELECT TO authenticated USING (true);
