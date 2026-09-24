# 🌿 Censo CEEPS — Plataforma de Entrevistas da Comunidade Escolar

<div align="center">

**Aplicação full stack para entrevistas anônimas sobre cor, raça, ancestralidade e pertencimento na comunidade escolar.**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white) ![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chart.js&logoColor=white)

</div>

---

## 📖 Visão geral

O **Censo CEEPS** apoia entrevistas conduzidas com estudantes, docentes, servidores e demais profissionais da escola. O questionário digitaliza perguntas sobre autodeclaração de cor ou raça, ancestralidade e diálogo étnico-racial, sem solicitar nome, matrícula ou contato da pessoa entrevistada.

A versão 2 reúne autenticação, coleta e análise em uma experiência simples e responsiva, com organização por turmas e setores, dashboard e exportação CSV.

> Utilize a aplicação conforme as regras de consentimento da instituição, a LGPD e as orientações da rede de ensino.

## ✨ Funcionalidades da versão 2

- Login protegido com JWT e bcrypt.
- Entrevistas para estudantes e funcionários.
- Categorias de cor ou raça do IBGE.
- Cadastro de turmas e setores.
- Dashboard com indicadores e gráficos Chart.js.
- Filtro por vínculo e distribuição por grupo escolar.
- Exportação CSV.
- SQLite com foreign keys, constraints, índices e inicialização automática.

## 🏗️ Arquitetura

```text
censoceeps/
├── sql/schema.sql          # Tabelas, constraints e índices
├── src/
│   ├── db.js               # Conexão, seeds e inicialização
│   ├── server.js           # API REST e autenticação
│   └── public/             # Interface, gráficos e estilos
├── .env.example
├── package.json
└── README.md
