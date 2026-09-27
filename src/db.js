import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const db = new sqlite3.Database(path.join(root, 'database.db'));

export const run  = (sql, p = []) => new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); }));
export const get  = (sql, p = []) => new Promise((res, rej) => db.get(sql, p, (e, row) => e ? rej(e) : res(row)));
export const all  = (sql, p = []) => new Promise((res, rej) => db.all(sql, p, (e, rows) => e ? rej(e) : res(rows)));
export const exec = sql => new Promise((res, rej) => db.exec(sql, e => e ? rej(e) : res()));

/**
 * Tenta adicionar uma coluna à tabela. Ignora silenciosamente se já existir.
 * SQLite não suporta ALTER TABLE ADD COLUMN IF NOT EXISTS.
 */
async function addColumnIfMissing(table, column, definition) {
  try {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (_) {
    // Coluna já existe — ignorado
  }
}

export async function initDb() {
  // Cria as tabelas base a partir do schema.sql
  await exec(fs.readFileSync(path.join(root, 'sql/schema.sql'), 'utf8'));

  // ─── Migração segura: novos campos do Projeto Ada Lovelace ───────────────
  await addColumnIfMissing('entrevistas', 'genero',
    `TEXT CHECK(genero IN ('Feminino','Masculino','Outros','Prefiro não informar'))`);
  await addColumnIfMissing('entrevistas', 'sofreu_preconceito',
    `TEXT CHECK(sofreu_preconceito IN ('Sim, por cor/raça','Sim, por gênero','Sim, por outro motivo','Não','Prefiro não responder'))`);
  await addColumnIfMissing('entrevistas', 'relato_preconceito', `TEXT`);
  // ─────────────────────────────────────────────────────────────────────────

  // Seed: usuário administrador padrão
  const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@escola.com').trim().toLowerCase();
  if (!await get('SELECT id FROM usuarios WHERE email=?', [email])) {
    await run(
      'INSERT INTO usuarios(nome,email,senha_hash,cargo) VALUES(?,?,?,?)',
      ['Administrador', email, bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || '123456', 12), 'ADMINISTRADOR']
    );
  }

  // Seed: grupos escolares padrão
  const c = await get('SELECT COUNT(*) total FROM grupos_escolares');
  if (!c.total) {
    for (const x of [
      ['TURMA', '1º Ano do Ensino Médio', 'Matutino'],
      ['TURMA', '2º Ano do Ensino Médio', 'Vespertino'],
      ['TURMA', '3º Ano do Ensino Médio', 'Matutino'],
      ['SETOR', 'Docentes', 'Integral'],
      ['SETOR', 'Gestão e equipe pedagógica', 'Integral'],
      ['SETOR', 'Apoio, limpeza e alimentação', 'Integral'],
      ['SETOR', 'Secretaria e administração', 'Integral'],
    ]) {
      await run('INSERT INTO grupos_escolares(tipo,nome,turno) VALUES(?,?,?)', x);
    }
  }
}
