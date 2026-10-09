-- Create table for Adinha Direct Chat messages
CREATE TABLE IF NOT EXISTS public.adinha_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'adinha')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.adinha_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own messages
CREATE POLICY "Users can view their own messages" ON public.adinha_chat_messages
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages" ON public.adinha_chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
