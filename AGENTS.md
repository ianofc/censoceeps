# Diretrizes e Arquitetura de Agentes — Censo CEEP (`censoceeps`)

Este arquivo define as regras contextuais para agentes de IA trabalhando no projeto **IO OS — Censo CEEP (Projeto Científico Ada Lovelace — CEEP Seabra)**.

## Stack Principal
- **Frontend**: React 18, TypeScript 5, Tailwind CSS, Vite 5, PWA (`vite-plugin-pwa`), Lucide Icons.
- **Relatórios e Mídia**: `jspdf`, `jspdf-autotable`, `html-to-image`.
- **Backend / Dados**: Supabase (`@supabase/supabase-js`), PostgreSQL com Row Level Security (RLS), armazenamento offline resiliente (`src/utils/tasOfflineSync.ts`).
- **Testes & Qualidade**: Vitest (`npm run test:run`), Cypress (`npm run cy:run`), TypeScript (`npm run lint`).

## Regras Críticas de Segurança e Dados
1. **NUNCA exponha chaves `service_role`** no código-fonte cliente (`src/`) ou em variáveis com prefixo `VITE_`. Use exclusivamente `VITE_SUPABASE_ANON_KEY` e políticas RLS adequadas no Supabase.
2. **Anonimato na Ouvidoria**: Ao inserir registros em `ouvidoria_tickets` com `is_anonimo = true`, o campo `user_id` deve ser obrigatoriamente `null`.
3. **Evite Full Table Scans**: Sempre filtre consultas no Supabase (usando `.ilike()`, `.eq()`, `.in()`, `.limit()`) antes de processar dados no cliente, respeitando o limite padrão de 1.000 linhas do PostgREST.
4. **Resiliência Offline**: Qualquer alteração no fluxo de coleta (`src/pages/Home.tsx` ou `src/lib/supabaseClient.ts`) deve preservar o fallback offline em `src/utils/tasOfflineSync.ts`.

## Padrões de UI/UX e Exportação
1. **Layout Desktop vs Mobile**: Mantenha o espaçamento lateral `lg:pl-28` no `<main>` (`src/App.tsx`) para não sobrepor a `FloatingNav`.
2. **Tecnologia Persuasiva & Fogg Behavior Model ($B = MAP$)**: Consulte `.agents/skills/tecnologia-persuasiva-fogg/SKILL.md` para orientações sobre simplificação de fluxo (habilidade), gatilhos com *kairos* e salvamento progressivo sem degradar a resiliência offline.
3. **Exportações CSV e PDF**:
   - Em exportações CSV, utilize sempre `Blob` com BOM UTF-8 (`\ufeff`) e `URL.createObjectURL` seguido de `URL.revokeObjectURL`.
   - Em relatórios PDF (`src/utils/tasPdfGenerator.ts`), valide se `finalY` não ultrapassa a margem inferior da folha A4 (`280mm`) antes de desenhar assinaturas ou rodapés.
4. **Verificação Obrigatória**: Antes de concluir qualquer tarefa, execute `npm run lint` (`tsc --noEmit`) e `npm run test:run` para garantir zero regressões.
