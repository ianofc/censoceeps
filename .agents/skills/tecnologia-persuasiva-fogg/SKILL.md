---
name: tecnologia-persuasiva-fogg
description: Diretrizes do Persuasive Technology Lab de Stanford (BJ Fogg, B = MAP, Tiny Habits e Kairos) aplicadas à experiência e engajamento do Censo CEEP.
---

# Skill: Tecnologia Persuasiva & Fogg Behavior Model ($B = MAP$) no Censo CEEP

Esta skill formaliza a aplicação das diretrizes do **Persuasive Technology Lab de Stanford (BJ Fogg)** no projeto **Censo CEEP (Projeto Científico Ada Lovelace — CEEP Seabra)**.

Seu objetivo central é garantir que qualquer nova feature, ajuste de UX ou fluxo de coleta reduza o atrito da ação e aplique gatilhos oportunos (*kairos*), **sem quebrar nenhuma regra de integridade ou funcionalidade já existente**.

---

## 1. O Princípio Cardeal de Não-Regressão

Qualquer mecanismo persuasivo implementado no Censo CEEP deve respeitar rigorosamente as regras do projeto:
1. **Preservação do Fallback Offline:** A persistência local em `src/utils/tasOfflineSync.ts` (`censo_pending_queue`) e a sanitização via `formatEntrevistaPayload` não podem ser burladas ou alteradas de forma incompatível.
2. **Unicidade de Participante & Prevenção de Autoentrevista:** Mecanismos de simplificação nunca devem contornar `normalizeName` nem permitir que entrevistadores entrevistem a si próprios.
3. **Segurança Supabase:** Nunca expor credenciais `service_role` e evitar requisições sem paginação/filtros ao tentar engajar o usuário com métricas.
4. **Layout Responsivo:** Manter a margem lateral `lg:pl-28` no `<main>` de `src/App.tsx` para compatibilidade com a navegação fixa.

---

## 2. O Modelo $B = MAP$ no Censo CEEP

O comportamento de preenchimento ou participação no censo ($B$) ocorre quando **Motivação ($M$)**, **Habilidade ($A$)** e um **Gatilho / Prompt ($P$)** convergem acima da linha de ação.

$$B = M \cdot A \cdot P$$

### A. Maximizando a Habilidade ($A$) — Redução Radical de Fricção
Fogg demonstra que **é mais eficiente simplificar a tarefa do que tentar inflar a motivação** de alunos e professores atarefados.

1. **Chunking Cognitivo (Tunelamento / Etapas):**
   - Divida questionários densos em passos lógicos de baixo esforço mental:
     - Etapa 1: Dados básicos e identificação rápida.
     - Etapa 2: Rotina escolar e transporte.
     - Etapa 3: Demandas prioritárias da unidade escolar.
   - Forneça feedback de progresso contínuo e tempo estimado (ex.: *"Passo 2 de 3 • ~1 min restante"*).
2. **Autosave Invisível:**
   - Cada resposta selecionada deve salvar o rascunho em tempo real no armazenamento local seguro, garantindo que interrupções de conexão ou fechamento acidental de aba não causem perda de dados.
3. **Otimização Touch e Mobile-First:**
   - Alvos de clique confortáveis (área mínima de toque de 44x44px).
   - Ativação de tipos específicos de teclado (`inputMode="numeric"`, `type="tel"`, `type="email"`).
   - Seleção de opções em formato de cartões interativos ou chips acessíveis, minimizando digitação desnecessária.

---

## 3. Gatilhos Eficazes (*Prompts*) & Oportunidade (*Kairos*)

O gatilho só funciona se a pessoa tiver a habilidade mínima de executar a ação no instante em que ele é acionado:

| Tipo de Gatilho | Quando Utilizar | Exemplo no Censo CEEP |
| :--- | :--- | :--- |
| **Facilitador (*Facilitator*)** | Usuário tem motivação, mas falta tempo ou percepção de facilidade. | Notificação/Alerta: *"Falta apenas 1 etapa rápida para concluir seu diagnóstico da turma. Leva menos de 60 segundos. [Continuar de onde parou]"* |
| **Sinalizador (*Signal*)** | Usuário já é capaz e conhece o sistema; precisa apenas de um lembrete no momento certo. | Indicador sutil de rascunho pendente no cabeçalho ou badge de prazo de encerramento do ciclo censitário. |
| **Centelha (*Spark*)** | Usuário tem alta capacidade (formulário fácil), mas baixa motivação. | Destaque do impacto comunitário: *"Sua turma já registrou 80% das respostas sobre o laboratório de informática. Faltam poucos para enviar o relatório à direção."* |

---

## 4. A Tríade Funcional de Fogg na Arquitetura

1. **Como Ferramenta (*Tool*):**
   - Guiar o usuário sem sobrecarga de decisões. O sistema faz o trabalho pesado de normalização, checagem de duplicidade e sincronização em segundo plano.
2. **Como Mídia (*Medium*):**
   - Simulação de impacto imediato. Demonstrar visualmente como as respostas de cada estudante alimentam o gráfico coletivo da escola (ex.: gráficos em tempo real no painel de resultados).
3. **Como Ator Social (*Social Actor*):**
   - Celebração pós-envio (*Tiny Celebration*): feedback positivo imediato na tela de confirmação, reconhecendo o papel do estudante como cidadão e coautor da melhoria da escola CEEP.

---

## 5. Checklist de Verificação Antes de Modificações
Ao propor ou codificar alterações baseadas nesta skill:
- [ ] O fluxo reduz cliques e tempo de digitação?
- [ ] O rascunho é persistido sem conflitar com `censo_pending_queue`?
- [ ] Os testes unitários existentes continuam passando (`npm run test:run`)?
- [ ] O TypeScript compila sem erros (`npm run lint`)?
