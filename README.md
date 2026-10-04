# 🌿 Manual Completo do Sistema: IO OS — Censo CEEP

Bem-vindo ao **IO OS**, a plataforma oficial de pesquisa e inteligência do **Projeto Científico Ada Lovelace** do Centro Estadual de Educação Profissional (CEEP) de Seabra.

Este documento foi criado para ser um **manual detalhado e amigável**. Se você é professor, gestor, estudante pesquisador ou apenas curioso, aqui você entenderá **tudo** o que o sistema faz, tela por tela.

---

## 📖 Índice

1. [O que é o Censo CEEP?](#1-o-que-é-o-censo-ceep)
2. [Conhecendo as Telas do Sistema](#2-conhecendo-as-telas-do-sistema)
   - [A. Tela de Login e Acesso](#a-tela-de-login-e-acesso)
   - [B. O Formulário de Coleta (O Censo em si)](#b-o-formulário-de-coleta-o-censo-em-si)
   - [C. O Painel Analítico (Gráficos)](#c-o-painel-analítico-gráficos)
   - [D. Seu Perfil de Pesquisador](#d-seu-perfil-de-pesquisador)
   - [E. Jornal Escolar (Feed de Notícias)](#e-jornal-escolar-feed-de-notícias)
   - [F. Adinha: A Assistente Inteligente (Lyka Chat)](#f-adinha-a-assistente-inteligente-lyka-chat)
3. [Como os Dados são Protegidos?](#3-como-os-dados-são-protegidos)
4. [Guia Técnico para Programadores](#4-guia-técnico-para-programadores)

---

## 1. O que é o Censo CEEP?

O Censo CEEP é um projeto de pesquisa feito **por estudantes, para estudantes**. Seu objetivo é mapear quem é a comunidade escolar do CEEP Seabra através de dados estatísticos demográficos, étnico-raciais, sociais e geográficos.

Ele substitui as antigas pranchetas de papel por um **sistema web rápido, seguro e anônimo**. Através dele, conseguimos responder perguntas como: *Quantos alunos moram na zona rural? Qual a cor/raça predominante da escola? Como é o acesso à internet dos estudantes? O racismo ainda afeta o ambiente de aprendizado?*

---

## 2. Conhecendo as Telas do Sistema

Navegar pelo IO OS é tão fácil quanto usar uma rede social. Abaixo, detalhamos cada uma das ferramentas disponíveis no menu lateral (ou inferior, se você estiver no celular).

### A. Tela de Login e Acesso
- **O que faz:** É a porta de entrada. Garante que apenas pesquisadores autorizados do Projeto Ada Lovelace acessem o painel.
- **Como usar:** Basta inserir seu e-mail institucional do CEEP e a sua senha.
- **Superpoder offline:** Se você estiver no meio do pátio ou da zona rural e a internet cair, o sistema possui uma "memória". Ele reconhecerá seu último login e deixará você entrar no sistema mesmo sem internet, para que a pesquisa não pare!

### B. O Formulário de Coleta (O Censo em si)
- **O que faz:** É o coração do sistema. É através desta tela que o pesquisador fará a entrevista com o participante.
- **O que tem lá dentro:** O formulário é dividido em blocos inteligentes:
  - **Bloco 1 (Identificação Básica):** Nome, contato, vínculo (aluno, professor), série e com quem mora.
  - **Bloco 2 (Localização):** Qual a cidade natal e onde mora atualmente (Sede ou Zona Rural).
  - **Bloco 3 (Autodeclaração):** Qual a cor/raça segundo o IBGE (Preta, Parda, Branca, Amarela, Indígena) e a origem da família.
  - **Bloco 4 (Percepção Social):** Perguntas mais profundas. Sofreu preconceito? A cor influencia no Brasil? Você já pensou em desistir da escola por motivos financeiros ou de convivência?
- **Detalhe incrível:** Ele é inteligente! Se você selecionar que o entrevistado é um "Professor", ele esconde perguntas exclusivas de estudantes (como "Risco de evasão escolar"), deixando a entrevista mais limpa e rápida.

### C. O Painel Analítico (Gráficos)
- **O que faz:** Transforma todos os dados coletados num piscar de olhos em gráficos coloridos e bonitos.
- **Como usar:** É só abrir e olhar. Ele calcula sozinho os percentuais.
- **O que você vai ver lá:**
  - Quantas pessoas já foram entrevistadas no total.
  - Um gráfico em barra mostrando as porcentagens de **Gênero**.
  - A diversidade oficial da escola baseada na declaração de **Cor ou Raça**.
  - Quantas pessoas moram em cidades vizinhas ou na **Zona rural**.
  - A **Inclusão digital** (se os alunos têm internet em casa ou só pacote de dados no celular).
  - O preocupante **Risco de evasão escolar**, dividido por motivos (financeiro, falta de interesse, problemas familiares).

### D. Seu Perfil de Pesquisador
- **O que faz:** É o seu "crachá digital". Ele mostra quem você é no projeto e te dá recompensas virtuais.
- **O que tem lá:**
  - Sua foto (que você pode trocar), seu nome e sua função.
  - Suas **Medalhas de Conquista** (Estilo videogame: quanto mais formulários você enviar para o banco de dados, mais medalhas e status você ganha na plataforma).
  - A quantidade total de coletas que você já realizou.

### E. Jornal Escolar (Feed de Notícias)
- **O que faz:** É um mural de avisos público no formato de um jornal moderno.
- **Como usar:** Serve para a escola divulgar os resultados preliminares do Censo, notícias sobre diversidade, datas de feiras de ciências e eventos do projeto. Você pode "curtir" e ver os avisos mais urgentes em destaque.

### F. Adinha: A Assistente Inteligente (Lyka Chat)
- **O que faz:** É como um "WhatsApp" integrado ao sistema onde você conversa com a **Adinha**, a Inteligência Artificial mascote do Censo.
- **Por que é útil?** Se durante a entrevista o aluno perguntar: *"O que significa Pardo?"* ou *"Qual a diferença entre preconceito e racismo estrutural?"*, o pesquisador abre o chat e pergunta para a Adinha. 
- **O que ela sabe fazer:**
  - Ela **NUNCA** escolhe a cor da pessoa (a autodeclaração é sagrada).
  - Ela explica conceitos do IBGE de forma simples.
  - Ela alerta sobre as leis de privacidade (LGPD).
  - O chat tem emojis rápidos para facilitar a conversa.

---

## 3. Como os Dados são Protegidos?

Segurança é coisa séria. O sistema foi construído em conformidade com as regras da LGPD (Lei Geral de Proteção de Dados):
- **O Banco de Dados:** Todos os dados vão direto para os cofres do **Supabase** (uma empresa parceira global de tecnologia), protegidos com criptografia.
- **Pesquisador não vê o que já foi enviado:** Depois que você clica em "Salvar", os dados somem do seu celular e vão direto para os cofres. Ninguém que pegar seu celular conseguirá ler o que o entrevistado respondeu ontem.
- **Anonimato no Gráfico:** O Dashboard Analítico só mostra "porcentagens" e "números". Ele nunca expõe o nome ou o contato de quem respondeu o quê.

---

## 4. Guia Técnico para Programadores

Caso você seja da equipe técnica de manutenção do CEEP, aqui estão os detalhes por baixo do capô:

### Stack Tecnológica
- **Linguagem Principal:** TypeScript (Garante que os dados tenham formato correto antes de ir pro banco).
- **Interface Visual:** React.js com Vite (Gera telas que carregam extremamente rápido, quase como um app nativo).
- **Estilização:** Tailwind CSS (Permite fazer esse visual limpo, moderno e com modo responsivo para celulares sem precisar de 10 mil linhas de CSS puro).
- **Banco e Autenticação:** Supabase (Usa PostgreSQL com RLS - Row Level Security, garantindo que usuários comuns só salvem dados, mas não possam excluir).

### Como Rodar o Sistema no Computador Local

1. Baixe os arquivos do projeto (via `git clone https://github.com/ianofc/censoceeps.git`).
2. Abra o terminal (Prompt de comando ou terminal do VS Code) na pasta do projeto.
3. Digite `npm install` para instalar as bibliotecas (você precisa do Node.js instalado).
4. Crie um arquivo chamado `.env` na raiz da pasta e coloque as senhas do seu Supabase (`SUPABASE_URL` e `SUPABASE_ANON_KEY`).
5. Digite `npm run dev`. Ele vai gerar um link (geralmente `http://localhost:5173`) para você testar no seu navegador.

---
> 💡 *Sistemas complexos não precisam ser difíceis de usar. O IO OS foi feito para dar voz a cada aluno do CEEP, através da melhor tecnologia disponível no mercado.*