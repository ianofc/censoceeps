import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config(); // Carrega o arquivo .env

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

// Rota para disponibilizar as variáveis públicas ao frontend
app.get('/config.js', (req, res) => {
  res.type('javascript');
  res.send(`
    window.SUPABASE_URL = "${process.env.SUPABASE_URL || ''}";
    window.SUPABASE_ANON_KEY = "${process.env.SUPABASE_ANON_KEY || ''}";
  `);
});

app.use(express.static(publicDir));

app.get('*', (_, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

if (process.env.NETLIFY !== 'true' && !process.env.LAMBDA_TASK_ROOT && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Censo CEEPS rodando em http://localhost:${port}`);
  });
}

export default app;