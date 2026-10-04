# 🌿 IO OS — Plataforma de Inteligência e Censo do CEEP

<div align="center">

**Sistema Integrado Full Stack de alta performance para coleta demográfica, mapeamento étnico-racial e análise de vivências na comunidade escolar.**

![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?logo=tailwind-css&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?logo=supabase&logoColor=white)

</div>

---

## 📖 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura de Dados](#-arquitetura-de-dados-e-tecnologias)
- [Principais Módulos](#-principais-módulos)
- [Assistente IA (Adinha)](#-assistente-ia-metodológica-adinha)
- [Como Executar](#-como-executar)

---

## 🌟 Visão Geral

O **IO OS** é o sistema que alimenta o núcleo de pesquisa tecnológica do **Projeto Ada Lovelace** no **CEEP Seabra**. 
A plataforma digitaliza e moderniza a coleta de dados sobre diversidade, gênero, raça, pertencimento e fatores socioeconômicos (como acesso à internet e risco de evasão) de toda a comunidade escolar.

Com rigor metodológico focado na anonimização e nas métricas do IBGE, o IO OS descentraliza a coleta, permitindo que estudantes pesquisadores e professores consigam estruturar painéis analíticos em tempo real.

---

## 🏗️ Arquitetura de Dados e Tecnologias

A aplicação foi desenhada sob um padrão *Light Clean* (Design IO OS), garantindo performance e acessibilidade, utilizando:

- **Frontend:** React 18 (Vite), TypeScript, Tailwind CSS e Lucide React.
- **Backend & Banco de Dados:** Supabase (PostgreSQL, Row Level Security, Auth).
- **Implantação (Deploy):** Configurada para a Vercel com empacotamento nativo via esbuild/Vite em servidores Linux.

---

## 🚀 Principais Módulos

### 1. Sistema de Coleta (Formulário Censo)
- Dinamismo: O sistema adapta blocos de perguntas dependendo do vínculo (ex: perguntas sobre tempo de deslocamento ou risco de evasão escolar só aparecem para alunos).
- Engloba identificação, localização e contexto familiar, autodeclaração étnico-racial e experiências diretas sobre racismo, pertencimento e vivência escolar.

### 2. Dashboard Analítico Dinâmico
- Gráficos integrados em tempo real que mapeiam a porcentagem exata de estudantes, tipos de vínculos, divisão por gênero, raça (padrão IBGE), áreas de moradia, entre outros cruzamentos cruciais.
- Painéis coloridos, com design premium e progress-bars interativas.

### 3. Painel Social do Pesquisador
- Espaço gamificado para o estudante/pesquisador gerenciar sua foto, conquistas (emojis de interação estilo Telegram) e checar o número total de coletas enviadas por ele para a base central do projeto.

---

## 🤖 Assistente IA Metodológica (Adinha)

A mascote **Adinha** atua como uma orientadora imersiva, sanando dúvidas de estudantes e entrevistados de forma empática e didática, focada em 4 pilares:
1. Orientar sobre preenchimento (explicando as metodologias de autodeclaração sem intervir ou classificar o entrevistado).
2. Fornecer explicações educacionais rápidas (conceitos como racismo estrutural, colorismo e identidade).
3. Garantir transparência informando a todos sobre o uso anônimo dos dados e as diretrizes da LGPD (Lei Geral de Proteção de Dados).
4. Fornecer acolhimento, ajudando a quebrar o gelo em pautas sensíveis.

---

## 💻 Como Executar

```bash
# 1. Clone o repositório
git clone https://github.com/ianofc/censoceeps.git

# 2. Entre no diretório
cd censoceeps

# 3. Instale as dependências (utilizando a versão correta do Node)
npm install

# 4. Configure as variáveis de ambiente baseadas no .env.example
# Defina o SUPABASE_URL e o SUPABASE_ANON_KEY

# 5. Inicie o servidor
npm run dev
```

> Desenvolvido com inovação e dedicação pelo grupo de tecnologia do **CEEP Seabra - Projeto Ada Lovelace**.