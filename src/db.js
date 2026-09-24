import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new sqlite3.Database(path.resolve(__dirname, '../database.db'));
const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
const all = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

export async function initDb() {
  const schema = fs.readFileSync(path.resolve(__dirname, '../sql/schema.sql'), 'utf8');
  await run(schema);
  const admin = await get('SELECT id FROM usuarios WHERE email = ?', [process.env.DEFAULT_ADMIN_EMAIL || 'admin@escola.com']);
  if (!admin) await run('INSERT INTO usuarios (nome,email,senha_hash,cargo) VALUES (?,?,?,?)', [
    'Administrador', process.env.DEFAULT_ADMIN_EMAIL || 'admin@escola.com',
    bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || '123456', 12), 'ADMINISTRADOR'
  ]);
  const count = await get('SELECT COUNT(*) AS total FROM grupos_escolares');
  if (!count.total) {
    const seed = [
      ['TURMA','1º Ano do Ensino Médio','Matutino'], ['TURMA','2º Ano do Ensino Médio','Vespertino'],
      ['TURMA','3º Ano do Ensino Médio','Matutino'], ['SETOR','Docentes','Integral'],
      ['SETOR','Gestão e equipe pedagógica','Integral'], ['SETOR','Apoio, limpeza e alimentação','Integral'],
      ['SETOR','Secretaria e administração','Integral']
    ];
    for (const item of seed) await run('INSERT INTO grupos_escolares (tipo,nome,turno) VALUES (?,?,?)', item);
  }
}
export { db, run, get, all };
