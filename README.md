# 🌿 Censo CEEPS — Plataforma de Entrevistas da Comunidade Escolar

<div align="center">

**Aplicação full stack para entrevistas anônimas sobre cor, raça, ancestralidade e pertencimento na comunidade escolar.**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chart.js&logoColor=white)

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
- [Próximas evoluções](#-próximas-evoluções)

## 🌟 Visão geral

O **Censo CEEPS** apoia entrevistas conduzidas por entrevistadores com estudantes, docentes, servidores e demais profissionais da escola. O questionário digitaliza perguntas sobre autodeclaração de cor ou raça, ancestralidade e diálogo étnico-racial, sem solicitar nome, matrícula ou contato da pessoa entrevistada.

A aplicação utiliza as categorias de cor ou raça do IBGE, organiza a coleta por turmas e setores e apresenta os resultados em um dashboard para apoiar projetos pedagógicos, educação antirracista e planejamento institucional.

> A ferramenta deve ser utilizada conforme as regras de consentimento da instituição, a LGPD e as orientações da rede de ensino.

## ✨ Versão 2

A segunda versão reorganiza a experiência em três momentos: autenticação, coleta e análise.

- Interface responsiva com visual mais limpo e acolhedor.
- Login protegido com JWT e senhas armazenadas com bcrypt.
- Entrevista para estudantes e funcionários da comunidade escolar.
- Dashboard com indicadores e gráficos Chart.js.
- Filtro por vínculo: toda a comunidade, estudantes ou funcionários.
- Exportação dos dados agregados em CSV.
- Turmas e setores cadastrados no banco com restrições de integridade.
- SQLite inicializado automaticamente com schema, índices e dados iniciais.

## 🚀 Funcionalidades

### Entrevistadores

- Login por e-mail e senha.
- Seleção de vínculo, turma ou setor e faixa etária.
- Autodeclaração: Branca, Preta, Parda, Amarela, Indígena ou Prefiro não responder.
- Registro opcional de geração conhecida e povo/etnia indígena.
- Registro dos ambientes em que o tema já foi discutido.
- Mensagem de confirmação após cada entrevista.

### Gestão e relatórios

- Indicador de total de entrevistas.
- Percentual agregado de pessoas autodeclaradas pretas ou pardas.
- Distribuição por cor ou raça.
- Comparação entre estudantes e funcionários.
- Distribuição por turma ou setor.
- Exportação CSV para tabulação e análise offline.
- Cadastro de turmas e setores por usuário administrador.

## 🏗️ Arquitetura

```text
censoceeps/
├── sql/schema.sql          # Tabelas, constraints e índices
├── src/
│   ├── db.js               # Conexão, inicialização e seeds
│   ├── server.js           # API REST, autenticação e servidor web
│   └── public/
│       ├── index.html      # Login, entrevista e dashboard
│       ├── app.js          # Fetch API, navegação e gráficos
│       └── styles.css      # Interface responsiva
├── .env.example
├── package.json
└── README.md
