---
name: auditoria-censo
description: Guia de auditoria de dados, segurança RLS, prevenção de full table scans e sincronização offline resiliente (tasOfflineSync) do Censo CEEP.
---

# Skill: Auditoria de Dados & Sincronização Resiliente (`censoceeps`)

Use esta skill sempre que precisar auditar consultas ao Supabase, validar regras de integridade da coleta socioeconômica ou dar manutenção no motor de sincronização offline (`tasOfflineSync`).

## 1. Regras de Ouro da Coleta Censitária

1. **Unicidade de Participante (Sem Duplicidade):**
   - Cada membro da comunidade escolar (estudante, docente, gestor ou funcionário) só pode responder ao Censo **uma única vez**.
   - A comparação de nomes deve sempre passar por `normalizeName` (`src/lib/supabaseClient.ts`), removendo acentos, espaços extras, diferenças de caixa e prefixos escolares (`Professor`, `Profa.`, `Estudante`, `Tio`, `Tia`).
2. **Proibição de Autoentrevista:**
   - O pesquisador logado não pode registrar uma ficha em que `normalizeName(nome_participante) === normalizeName(profile.nomeCompleto)`.
3. **Sanitização Estrita de Payload (`formatEntrevistaPayload`):**
   - Nunca envie objetos brutos de estado da UI diretamente ao PostgREST.
   - Sempre passe por `formatEntrevistaPayload(rawPayload, interviewerId)` para:
     - Validar `entrevistador_id` com `isValidUuid` (convertendo IDs temporários como `'offline-user'` ou `'local-*'` em `null` ou no UUID real do pesquisador para evitar erro PostgreSQL `22P02`).
     - Filtrar propriedades transitórias de UI (`synced`, `grupo_escolar`, `interviewer_name`, `user_id`) evitando erros PostgREST `PGRST204`.

## 2. Prevenção de Full Table Scans e Otimização Supabase

- **Contagens (`count: 'exact', head: true`):**
  - Quando precisar apenas do total de registros (ex.: total de coletas, curtidas ou verificação de marcos em `badgeService.checkUserMilestones`), utilize `.select('id', { count: 'exact', head: true })` em vez de baixar todas as linhas da tabela.
- **Buscas Filtradas no Banco:**
  - Para verificar se um participante já foi entrevistado ou buscar uma pessoa específica, prefira filtros no servidor (`.ilike('nome_participante', ...)` ou `.eq('entrevistador_id', userId)`) e selecione apenas as colunas estritamente necessárias (`.select('id, nome_participante, entrevistador_id')`), evitando `select('*')` sem `.limit()` em tabelas crescentes.
- **Segurança & RLS:**
  - Nunca exponha chaves `service_role` hardcoded no bundle do cliente. Operações de escrita e leitura no frontend devem respeitar as políticas RLS da chave `anon` (`VITE_SUPABASE_ANON_KEY`) e a sessão autenticada do Supabase Auth.

## 3. Sincronização Offline (`src/utils/tasOfflineSync.ts`)

O módulo `tasOfflineSync` garante que nenhuma entrevista seja perdida em áreas sem conectividade no CEEP Seabra:

1. **Armazenamento Local (`saveDraftOffline`):**
   - Salva rascunhos na chave `censo_pending_queue` do `localStorage`.
   - Antes de inserir na fila, normaliza `nome_participante` e atualiza o item existente caso o mesmo participante já esteja na fila local.
2. **Lock de Concorrência (`syncOfflineData`):**
   - Utiliza a trava em memória `isSyncing` para impedir que múltiplos eventos `online` ou cliques manuais disparem sincronizações paralelas duplicadas.
   - Remove da `censo_pending_queue` **apenas** as fichas cujo `salvarEntrevistaResiliente` retornou sem erro (`!error`), preservando fichas pendentes caso a conexão oscile no meio do lote.
   - Ao concluir, dispara o evento global `window.dispatchEvent(new CustomEvent('censo-sync-complete', { detail: { synced, remaining } }))` para atualizar os contadores dos painéis em tempo real.
