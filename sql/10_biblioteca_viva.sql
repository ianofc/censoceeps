-- SQL Schema for Biblioteca Viva (Repositório Digital)

CREATE TABLE IF NOT EXISTS public.biblioteca_viva (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g., 'Cartilha', 'Regulamento', 'Material Pedagógico'
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.biblioteca_viva ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing (allow all authenticated users or public depending on requirement, let's allow public read for library)
CREATE POLICY "Allow public read access to biblioteca_viva"
    ON public.biblioteca_viva
    FOR SELECT
    USING (true);

-- Create policy for insertion/updates (only authenticated/admins can modify, assumed authenticated for now)
CREATE POLICY "Allow authenticated users to insert biblioteca_viva"
    ON public.biblioteca_viva
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update biblioteca_viva"
    ON public.biblioteca_viva
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete biblioteca_viva"
    ON public.biblioteca_viva
    FOR DELETE
    TO authenticated
    USING (true);
