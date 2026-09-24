import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
dotenv.config();
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const db=new sqlite3.Database(path.join(root,'database.db'));
export const run=(sql,p=[])=>new Promise((resolve,reject)=>db.run(sql,p,function(e){e?reject(e):resolve(this)}));
export const get=(sql,p=[])=>new Promise((resolve,reject)=>db.get(sql,p,(e,row)=>e?reject(e):resolve(row)));
export const all=(sql,p=[])=>new Promise((resolve,reject)=>db.all(sql,p,(e,rows)=>e?reject(e):resolve(rows)));
export const exec=sql=>new Promise((resolve,reject)=>db.exec(sql,e=>e?reject(e):resolve()));
export async function initDb(){await exec(fs.readFileSync(path.join(root,'sql/schema.sql'),'utf8'));const email=(process.env.DEFAULT_ADMIN_EMAIL||'admin@escola.com').trim().toLowerCase();if(!await get('SELECT id FROM usuarios WHERE email=?',[email]))await run('INSERT INTO usuarios(nome,email,senha_hash,cargo) VALUES(?,?,?,?)',['Administrador',email,bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD||'123456',12),'ADMINISTRADOR']);const c=await get('SELECT COUNT(*) total FROM grupos_escolares');if(!c.total)for(const x of [['TURMA','1º Ano do Ensino Médio','Matutino'],['TURMA','2º Ano do Ensino Médio','Vespertino'],['TURMA','3º Ano do Ensino Médio','Matutino'],['SETOR','Docentes','Integral'],['SETOR','Gestão e equipe pedagógica','Integral'],['SETOR','Apoio, limpeza e alimentação','Integral'],['SETOR','Secretaria e administração','Integral']])await run('INSERT INTO grupos_escolares(tipo,nome,turno) VALUES(?,?,?)',x)}
