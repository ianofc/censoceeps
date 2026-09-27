import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildDir = path.resolve(__dirname, '..', 'dist');

app.use(express.json());

// Rota do config.js com MIME Type explícito de JavaScript
app.get('/config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(`
    window.SUPABASE_URL = "${process.env.SUPABASE_URL || ''}";
    window.SUPABASE_ANON_KEY = "${process.env.SUPABASE_ANON_KEY || ''}";
  `);
});

// Servir os arquivos compilados da pasta dist
app.use(express.static(buildDir));

// Fallback para SPA
app.get('*', (_, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

if (process.env.NETLIFY !== 'true' && !process.env.LAMBDA_TASK_ROOT && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Censo CEEPS rodando em http://localhost:${port}`);
  });
}

export default app;