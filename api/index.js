// api/index.js
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zoybjayrxbgobjtxqmic.supabase.co';
const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzY3MDAsImV4cCI6MjEwNjAxMjcwMH0.ZC1VQyYyKLNW3KNc41ci3c1GNawntz7E7zjol0HNX7g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Rota de Login existente
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ token: data.session?.access_token, user: data.user });
    } catch (err) {
        console.error('[API /api/login] Erro interno:', err);
        return res.status(500).json({ error: 'Erro interno ao processar login.' });
    }
});

// ROTA DO CENSO: Inserir entrevista no Supabase
app.post('/api/interview', async (req, res) => {
    try {
        const body = req.body || {};

        // Validação mínima de campos obrigatórios
        if (!body.vinculo || !body.interviewer_id) {
            return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
        }

        const { data, error } = await supabase
            .from('entrevistas')
            .insert([{
                entrevistador_id: body.interviewer_id,
                nome_participante: body.nome_participante || 'Anônimo',
                contato_whatsapp: body.contato_whatsapp || null,
                vinculo: body.vinculo,
                serie: body.serie || null,
                turma: body.turma || null,
                cidade_natal: body.cidade_natal || null,
                local_moradia: body.localizacao_moradia || body.local_moradia || null,
                detalhe_localizacao: body.detalhe_localizacao || null,
                genero: body.genero || null,
                cor_raca: body.cor_raca || null,
                origem_familia: body.origem_familia || null,
                povo_indigena: body.povo_indigena || null,
                cor_raca_influencia: body.cor_raca_influencia || null,
                espacos_influencia: Array.isArray(body.espacos_influencia) ? body.espacos_influencia : [],
                ambientes_conversa: Array.isArray(body.ambientes_conversa) ? body.ambientes_conversa : [],
                conhece_ancestralidade: body.conhece_ancestralidade || null,
                ja_conversou_sobre: body.ja_conversou_sobre || null,
                sofreu_preconceito: body.sofreu_preconceito || null,
                locais_ocorrencia: Array.isArray(body.locais_ocorrencia) ? body.locais_ocorrencia : [],
                formas_ocorrencia: Array.isArray(body.formas_ocorrencia) ? body.formas_ocorrencia : [],
                relato_preconceito: body.relato_preconceito || null,
                mora_com: body.mora_com || null,
                acesso_internet: body.acesso_internet || null,
                tempo_deslocamento: body.tempo_deslocamento || null,
                risco_evasao: body.risco_evasao || null,
            }])
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ message: 'Entrevista registrada com sucesso!', data });
    } catch (err) {
        console.error('[API /api/interview] Erro interno:', err);
        return res.status(500).json({ error: 'Erro interno ao registrar entrevista.' });
    }
});

export default app;