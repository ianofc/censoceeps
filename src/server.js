import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

// Serve arquivos estáticos do frontend
app.use(express.static(publicDir));

// Fallback para SPA - qualquer rota devolve o index.html
app.get('*', (_, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Censo CEEPS (Supabase Frontend) rodando em http://localhost:${port}`);
});
