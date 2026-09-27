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

// Apenas escuta a porta se não estiver rodando em ambiente Serverless (Netlify/Vercel)
if (process.env.NETLIFY !== 'true' && !process.env.LAMBDA_TASK_ROOT && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Censo CEEPS rodando em http://localhost:${port}`);
  });
}

export default app;