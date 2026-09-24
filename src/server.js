import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDb, run, get, all } from './db.js';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || 'development-secret-change-me';
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(publicDir));
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  try { if (!token) throw new Error(); req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Sessão inválida ou expirada.' }); }
};
const admin = (req, res, next) => req.user.cargo === 'ADMINISTRADOR' ? next() : res.status(403).json({ error: 'Apenas administradores podem executar esta ação.' });
const valid = (body) => ['vinculo','grupo_escolar_id','faixa_etaria','cor_raca','conhece_ancestralidade','ja_conversou_sobre'].every(k => body[k] !== undefined && body[k] !== '');

app.post('/api/login', async (req, res) => {
  try {
    const user = await get('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [String(req.body.email || '').trim()]);
    if (!user || !bcrypt.compareSync(String(req.body.senha || ''), user.senha_hash)) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    const token = jwt.sign({ id: user.id, nome: user.nome, cargo: user.cargo }, SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: { id: user.id, nome: user.nome, email: user.email, cargo: user.cargo } });
  } catch (e) { res.status(500).json({ error: 'Não foi possível realizar o login.' }); }
});
app.get('/api/me', auth, (req, res) => res.json(req.user));
app.get('/api/grupos', auth, async (_req, res) => res.json(await all('SELECT * FROM grupos_escolares WHERE ativo=1 ORDER BY tipo,nome')));
app.post('/api/grupos', auth, admin, async (req, res) => {
  const { tipo, nome, turno } = req.body;
  if (!['TURMA','SETOR'].includes(tipo) || !nome || !turno) return res.status(400).json({ error: 'Tipo, nome e turno são obrigatórios.' });
  try { const r = await run('INSERT INTO grupos_escolares (tipo,nome,turno) VALUES (?,?,?)', [tipo,nome.trim(),turno.trim()]); res.status(201).json({ id: r.lastID }); }
  catch { res.status(409).json({ error: 'Este grupo já existe.' }); }
});
app.post('/api/entrevistas', auth, async (req, res) => {
  if (!valid(req.body)) return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  const b = req.body; const ambientes = Array.isArray(b.ambientes_conversa) ? b.ambientes_conversa : [];
  if (!['ESTUDANTE','FUNCIONARIO'].includes(b.vinculo) || !['Branca','Preta','Parda','Amarela','Indígena','Prefiro não responder'].includes(b.cor_raca)) return res.status(400).json({ error: 'Opção inválida.' });
  try {
    const group = await get('SELECT id FROM grupos_escolares WHERE id=? AND ativo=1', [b.grupo_escolar_id]);
    if (!group) return res.status(400).json({ error: 'Turma/setor inválido.' });
    const r = await run(`INSERT INTO entrevistas (entrevistador_id,vinculo,grupo_escolar_id,faixa_etaria,cor_raca,conhece_ancestralidade,geracao_alcancada,povo_indigena,ja_conversou_sobre,ambientes_conversa) VALUES (?,?,?,?,?,?,?,?,?,?)`, [req.user.id,b.vinculo,b.grupo_escolar_id,b.faixa_etaria,b.cor_raca,b.conhece_ancestralidade,b.geracao_alcancada || null,b.povo_indigena?.trim() || null,b.ja_conversou_sobre,JSON.stringify(ambientes)]);
    res.status(201).json({ id: r.lastID, message: 'Entrevista registrada com sucesso.' });
  } catch (e) { res.status(500).json({ error: 'Não foi possível salvar a entrevista.' }); }
});
app.get('/api/dashboard', auth, async (req, res) => {
  const where = req.query.vinculo && ['ESTUDANTE','FUNCIONARIO'].includes(req.query.vinculo) ? ' WHERE vinculo = ?' : '';
  const params = where ? [req.query.vinculo] : [];
  const [total, cor, vinculo, grupos, idades] = await Promise.all([
    get(`SELECT COUNT(*) total FROM entrevistas${where}`, params),
    all(`SELECT cor_raca label, COUNT(*) value FROM entrevistas${where} GROUP BY cor_raca ORDER BY value DESC`, params),
    all(`SELECT vinculo label, COUNT(*) value FROM entrevistas${where} GROUP BY vinculo`, params),
    all(`SELECT g.nome label, COUNT(e.id) value FROM grupos_escolares g LEFT JOIN entrevistas e ON e.grupo_escolar_id=g.id${where ? ' AND e.vinculo=?' : ''} WHERE g.ativo=1 GROUP BY g.id ORDER BY value DESC`, params),
    all(`SELECT faixa_etaria label, COUNT(*) value FROM entrevistas${where} GROUP BY faixa_etaria`, params)
  ]);
  res.json({ total: total.total, cor, vinculo, grupos, idades });
});
app.get('/api/export.csv', auth, async (_req, res) => {
  const rows = await all(`SELECT e.id,e.vinculo,g.tipo grupo_tipo,g.nome grupo,g.turno,e.faixa_etaria,e.cor_raca,e.conhece_ancestralidade,e.geracao_alcancada,e.ja_conversou_sobre,e.ambientes_conversa,e.criado_em FROM entrevistas e JOIN grupos_escolares g ON g.id=e.grupo_escolar_id ORDER BY e.id`);
  const esc = v => `"${String(v ?? '').replaceAll('"','""')}"`;
  const csv = ['id,vinculo,grupo_tipo,grupo,turno,faixa_etaria,cor_raca,conhece_ancestralidade,geracao_alcancada,ja_conversou_sobre,ambientes_conversa,criado_em', ...rows.map(r => Object.values(r).map(esc).join(','))].join('\n');
  res.type('text/csv').attachment('censo-entrevistas.csv').send('\ufeff' + csv);
});
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
initDb().then(() => app.listen(PORT, () => console.log(`Censo CEEPS: http://localhost:${PORT}`))).catch(e => { console.error(e); process.exit(1); });
