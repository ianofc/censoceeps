CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    opportunity_type VARCHAR(50) NOT NULL CHECK (opportunity_type IN ('estágio', 'bolsa', 'feira', 'evento', 'outro')),
    contact_info TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active opportunities" ON public.opportunities
    FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

CREATE POLICY "Authenticated users can create opportunities" ON public.opportunities
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own opportunities" ON public.opportunities
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own opportunities" ON public.opportunities
    FOR DELETE USING (auth.uid() = created_by);
