// api/index.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Rota de Login existente
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ token: data.session.access_token, user: data.user });
});

// ROTA DO CENSO: Inserir entrevista no Supabase
app.post('/api/interview', async (req, res) => {
    const {
        interviewer_id,
        vinculo,
        grupo_escolar,
        faixa_etaria,
        genero,
        cor_raca,
        conhece_ancestralidade,
        geracao_alcancada,
        povo_indigena,
        ja_conversou_sobre,
        ambientes_conversa, // Deve vir como array do frontend: ["Familiar", "Escolar"]
        sofreu_preconceito,
        relato_preconceito
    } = req.body;

    // Validação mínima de campos obrigatórios
    if (!vinculo || !grupo_escolar || !genero || !cor_raca || !interviewer_id) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    const { data, error } = await supabase
        .from('entrevistas')
        .insert([{
            ...req.body,
            ambientes_conversa: req.body.ambientes_conversa || [],
            espacos_influencia: req.body.espacos_influencia || [],
            locais_ocorrencia: req.body.locais_ocorrencia || [],
            formas_ocorrencia: req.body.formas_ocorrencia || []
        }])
        .select();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Entrevista registrada com sucesso!', data });
});

module.exports = app;