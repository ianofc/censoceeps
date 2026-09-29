# 🌿 Censo CEEP — Plataforma de Inteligência e Pesquisa da Comunidade Escolar

<div align="center">

**Aplicação Web Full Stack de alta performance para mapeamento anônimo e descentralizado de dados demográficos, cor, raça, ancestralidade e vivências étnico-raciais na comunidade escolar.**

![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?logo=tailwind-css&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?logo=supabase&logoColor=white)

</div>

---

## 📖 Sumário

- [Visão Geral e Metodologia](#-visão-geral-e-metodologia)
- [Arquitetura de Dados e Tecnologias](#-arquitetura-de-dados-e-tecnologias)
- [Funcionalidades e Módulos](#-funcionalidades-e-módulos)
- [Assistente IA Metodológica (Adinha)](#-assistente-ia-metodológica-adinha)
- [Estrutura de Pastas e Componentes](#-estruturas-de-pastas-e-componentes)
- [Configuração e Execução](#-como-executar)
- [Segurança, LGPD e Privacidade](#-segurança-e-lgpd-e-privacidade)

---

## 🌟 Visão Geral e Metodologia

O **Censo CEEP** é o núcleo tecnológico do **Projeto de Pesquisa Científica Ada Lovelace**, desenvolvido no Centro Estadual de Educação Profissional de Seabra (CEEP Seabra). A plataforma digitaliza o processo de coleta de dados de campo voltados a relações étnico-raciais, gênero, raça e pertencimento.

A aplicação adota rigorosamente as diretrizes e classificações oficiais do **IBGE** para autodeclaração de cor ou raça (*Branca, Preta, Parda, Amarela e Indígena*), estruturando a coleta de forma totalmente sigilosa e desvinculada de identificadores individuais diretos.

---

## 🏗️ Arquitetura de Dados e Tecnologias

A stack tecnológica foi concebida sob os princípios de modularidade, tipagem estrita e design *Light Clean* (Ágora OS):

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (v3 clássico) e Lucide React.
* **Backend & Persistência:** Supabase (PostgreSQL relacional, Row Level Security, autenticação gerenciada e APIs REST/Realtime).
* **Inteligência Artificial Integrada:** Assistente especializada "Adinha" com arquitetura híbrida (Informativa/Metodológica + Consulta Analítica Agregada ao Banco).

---

## 🚀 Funcionalidades e Módulos

### 1. Coleta de Campo Inteligente (`InterviewForm.tsx`)
* **Bloco 1 (Identificação):** Vínculo institucional (Estudante coletor vs. Gestor/Professor orientador) e grupo escolar (turmas e setores).
* **Bloco 2 (Autodeclaração IBGE):** Seleção de cor/raça com suporte dinâmico a etnias indígenas.
* **Bloco 3 (Vivências e Ancestralidade):** Mapeamento de ambientes de diálogo (*Familiar, Escolar, Rodas de Amigos*), incidência de preconceito e relatos opcionais sigilosos.

### 2. Painel Social e Perfil Editável (`MeuPerfil.tsx`)
* Interface estilo rede social customizável com alternância entre modo leitura e edição (botão com ícone de lápis).
* Contagem real de coletas puxada diretamente do banco de dados (distinguindo o papel de estudantes coletores e professores gestores).

### 3. Dashboard Analítico e Indicadores (`AnalyticsDashboard.tsx`)
* Gráficos dinâmicos de distribuição por cor/raça, faixas etárias, gênero e incidências georreferenciadas/setoriais.
* Termômetro de coletas em tempo real integrado ao Supabase.

---

## 🤖 Assistente IA Metodológica (Adinha)

A mascote **Adinha** atua como uma orientadora científica estruturada em **8 Núcleos de Conhecimento**:
1. **Projeto e Objetivos:** Explicação institucional do Censo e da pesquisa Ada Lovelace.
2. **Cor e Raça (Autodeclaração):** Orienta sobre as categorias do IBGE, reforçando que o chatbot *jamais* determina a raça do participante.
3. **Conceitos Fundamentais:** Definições didáticas de racismo estrutural, preconceito, discriminação, colorismo e ações afirmativas.
4. **Situações Práticas:** Contextualização de vivências cotidianas sem diagnósticos jurídicos automáticos.
5. **Auxílio no Preenchimento:** Esclarecimento neutro de termos sem indução de respostas.
6. **Privacidade e LGPD:** Transparência sobre anonimização, consentimento e sigilo.
7. **Acolhimento Institucional:** Respeito empático e indicação de canais de apoio pedagógico da escola.
8. **Consultas Analíticas Agregadas:** Acesso via API a métricas consolidadas (ex: *"Quantas pessoas participaram?"*).

---

## 💻 Como Executar

```bash
# Clone o repositório
git clone [https://github.com/ianofc/censoceeps.git](https://github.com/ianofc/censoceeps.git)

# Entre no diretório
cd censoceeps

# Instale as dependências
npm install

# Configure as variáveis de ambiente (.env)
cp .env.example .env

# Execute o servidor de desenvolvimento
npm run dev