# 🌿 Censo CEEPS — Plataforma de Entrevistas da Comunidade Escolar

<div align="center">

**Aplicação full stack para entrevistas anônimas sobre cor, raça, ancestralidade e pertencimento na comunidade escolar.**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white) ![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chart.js&logoColor=white)

</div>

---

## 📖 Sumário

- [Visão geral](#-visão-geral)
- [Versão 2](#-versão-2)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Modelo de dados](#-modelo-de-dados)
- [Como executar](#-como-executar)
- [Credenciais iniciais](#-credenciais-iniciais)
- [API](#-api)
- [Segurança e privacidade](#-segurança-e-privacidade)

## 🌟 Visão geral

O **Censo CEEPS** apoia entrevistas com estudantes, docentes, servidores e demais profissionais da escola. O questionário digitaliza perguntas sobre autodeclaração de cor ou raça, ancestralidade e diálogo étnico-racial sem solicitar nome, matrícula ou contato da pessoa entrevistada.

A aplicação usa as categorias de cor ou raça do IBGE, organiza a coleta por turmas e setores e apresenta os resultados em um dashboard para apoiar projetos pedagógicos e planejamento institucional.

> Utilize a ferramenta conforme as regras de consentimento da instituição, a LGPD e as orientações da rede de ensino.

## ✨ Versão 2

- Interface responsiva e fluxo separado de autenticação, coleta e análise.
- JWT para sessões e bcrypt para senhas.
- Entrevistas para estudantes e funcionários.
- Dashboard com indicadores, gráficos e filtro por vínculo.
- Exportação CSV.
- Cadastro de turmas, setores e usuários administrativos.
- SQLite com schema, constraints, foreign keys e índices.

## 🚀 Funcionalidades

### Entrevistadores

- Login por e-mail e senha.
- Seleção de vínculo, turma/setor e faixa etária.
- Autodeclaração: Branca, Preta, Parda, Amarela, Indígena ou Prefiro não responder.
- Registro opcional de ancestralidade, povo/etnia indígena e ambientes de conversa.

### Gestão e relatórios

- Total de entrevistas e percentual agregado de pessoas pretas ou pardas.
- Distribuição por cor ou raça, vínculo, turma e setor.
- Exportação CSV para tabulação offline.
- Cadastro de turmas, setores e novos entrevistadores por administrador.

## 🏗️ Arquitetura

```text
censoceeps/
├── sql/schema.sql
├── src/db.js
├── src/server.js
├── src/public/index.html
├── src/public/app.js
├── src/public/styles.css
├── .env.example
├── package.json
└── README.md
```

Frontend em HTML/CSS/JavaScript com Chart.js. Backend em Node.js/Express. Persistência em SQLite.

## 🗄️ Modelo de dados

- `usuarios`: identidade e permissões dos usuários do sistema.
- `grupos_escolares`: turmas e setores ativos.
- `entrevistas`: respostas anônimas associadas ao entrevistador e ao grupo escolar.

A tabela de entrevistas não possui nome, matrícula, telefone ou e-mail do entrevistado. `ambientes_conversa` é armazenado como JSON em texto.

## 💻 Como executar

```bash
git clone https://github.com/ianofc/censoceeps.git
cd censoceeps
cp .env.example .env
npm install
npm start
```

Acesse `http://localhost:3000`. Para desenvolvimento: `npm run dev`.

O arquivo `database.db` é criado automaticamente na primeira execução.

## 🔑 Credenciais iniciais

```text
E-mail: admin@escola.com
Senha: 123456
```

Altere as credenciais no `.env` antes de usar em produção.

## 🔌 API

| Método | Rota | Acesso | Finalidade |
|---|---|---|---|
| POST | `/api/login` | Público | Autenticar usuário |
| GET | `/api/me` | JWT | Consultar sessão |
| GET | `/api/grupos` | JWT | Listar turmas e setores |
| POST | `/api/entrevistas` | JWT | Registrar entrevista |
| GET | `/api/dashboard` | JWT | Indicadores e séries |
| GET | `/api/export.csv` | JWT | Exportar CSV |
| POST | `/api/grupos` | Administrador | Criar grupo escolar |
| POST | `/api/admin/usuarios` | Administrador | Criar usuário |

Rotas privadas usam `Authorization: Bearer <token>`.

## 🔐 Segurança e privacidade

- Senhas com hash bcrypt.
- JWT nas rotas privadas.
- Autorização específica para administradores.
- Consultas parametrizadas.
- Foreign keys, constraints e índices.
- Nenhum identificador direto do entrevistado.
- Em produção, use HTTPS, segredo JWT forte, backups protegidos e política de retenção institucional.

## ⚙️ Variáveis de ambiente

```env
PORT=3000
JWT_SECRET=troque-esta-chave-em-producao
DEFAULT_ADMIN_EMAIL=admin@escola.com
DEFAULT_ADMIN_PASSWORD=123456
```

## 📜 Scripts

- `npm start`: inicia o servidor.
- `npm run dev`: executa com `node --watch`.

<div align="center">Desenvolvido para apoiar práticas escolares de escuta, respeito e educação antirracista.</div>
