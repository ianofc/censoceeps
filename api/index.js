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
    if (!req.body.vinculo || !req.body.interviewer_id) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    const { data, error } = await supabase
        .from('entrevistas')
        .insert([{
            entrevistador_id: req.body.interviewer_id,
            nome_participante: req.body.nome_participante || 'Anônimo',
            contato_whatsapp: req.body.contato_whatsapp || null,
            vinculo: req.body.vinculo,
            serie: req.body.serie || null,
            turma: req.body.turma || null,
            cidade_natal: req.body.cidade_natal || null,
            local_moradia: req.body.localizacao_moradia || null,
            detalhe_localizacao: req.body.detalhe_localizacao || null,
            cor_raca: req.body.cor_raca || null,
            origem_familia: req.body.origem_familia || null,
            povo_indigena: req.body.povo_indigena || null,
            cor_raca_influencia: req.body.cor_raca_influencia || null,
            espacos_influencia: req.body.espacos_influencia || [],
            ambientes_conversa: req.body.ambientes_conversa || [],
            sofreu_preconceito: req.body.sofreu_preconceito || null,
            locais_ocorrencia: req.body.locais_ocorrencia || [],
            formas_ocorrencia: req.body.formas_ocorrencia || [],
            relato_preconceito: req.body.relato_preconceito || null,
            mora_com: req.body.mora_com || null,
            acesso_internet: req.body.acesso_internet || null,
            tempo_deslocamento: req.body.tempo_deslocamento || null,
            risco_evasao: req.body.risco_evasao || null,
        }])
        .select();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Entrevista registrada com sucesso!', data });
});

module.exports = app;