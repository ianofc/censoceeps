---
name: qa-testes
description: Runbook oficial de QA para execução de verificação de tipos (lint), testes unitários (Vitest) e testes E2E (Cypress) com sessão offline injetada no projeto Censo CEEP.
---

# Skill: Runbook de QA & Testes Automatizados (`censoceeps`)

Use esta skill sempre que precisar validar alterações de código, criar novos testes unitários ou executar diagnósticos de regressão no projeto `censoceeps`.

## 1. Diagnóstico Estático e Tipagem (`tsc`)

Antes de qualquer build ou commit, valide a integridade de tipos TypeScript em todo o diretório `src/`:

```bash
npm run lint
```

- O script executa `tsc --noEmit`.
- Certifique-se de que `tsconfig.json` mantém `"types": ["vitest/globals", "@testing-library/jest-dom"]` para que os arquivos `*.test.ts` e `*.test.tsx` sejam verificados junto com o código de produção.

## 2. Testes Unitários com Vitest

Para rodar toda a suíte de testes unitários em modo não-interativo (CI / verificação rápida):

```bash
npm run test:run
```

### Cobertura Unitária Essencial:
1. **`src/pages/Home.test.tsx`:**
   - Valida `normalizeName`, `isValidUuid` e `formatEntrevistaPayload` (`src/lib/supabaseClient.ts`).
   - Valida o ciclo completo da fila offline em `tasOfflineSync` (`saveDraftOffline` com deduplicação e `syncOfflineData` com sucesso/falha parcial).
2. **`src/services/badgeService.test.ts`:**
   - Valida a integridade do catálogo `BADGE_CATALOG` (`getAllBadges`).
   - Valida `getUserBadges` e `unlockBadge` (persistência no `localStorage`, bloqueio de duplicidade, modo `silent` e disparo do evento `ceep-badge-unlocked`).
   - Valida `recordExplorationVisit` (desbloqueio da insígnia `explorador_do_saber` exclusivamente após visitar `'jornal'` e `'biblioteca'`).

### Diretrizes para Novos Testes Unitários:
- Sempre limpe o `localStorage` (`localStorage.clear()`) e restaure mocks (`vi.restoreAllMocks()`) no `beforeEach`.
- Nunca faça chamadas reais de rede ao Supabase em testes unitários; utilize `vi.spyOn` nos métodos de `supabaseClient` ou `supabase.from`.

## 3. Testes End-to-End (E2E) com Cypress

Para executar os testes E2E via linha de comando (requer o servidor Vite rodando em `http://localhost:5173`):

```bash
npm run cy:run
```

Ou para abrir a interface interativa do Cypress:

```bash
npm run cy:open
```

### Injeção de Sessão Offline nos Testes E2E (`cypress/e2e/coleta.cy.ts`):
Como `src/App.tsx` bloqueia o acesso às rotas internas quando não há sessão ativa, todo teste E2E que visitar rotas protegidas (`/coleta`, `/feed`, `/dashboard`, `/perfil`, etc.) **deve** injetar `ceep_offline_session` e `ceep_test_user` no `onBeforeLoad` do `cy.visit`:

```ts
cy.visit('/coleta', {
  onBeforeLoad(win) {
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nomeCompleto: 'Pesquisador Teste CEEP',
      email: 'pesquisador@ceep.edu.br',
      papel: 'entrevistador_aluno',
      turmaOuCargo: '3º Ano Informática',
      genero: 'feminino',
      avatarUrl: '',
    };
    win.localStorage.setItem(
      'ceep_offline_session',
      JSON.stringify({ id: mockUser.id, user: { id: mockUser.id, email: mockUser.email } })
    );
    win.localStorage.setItem('ceep_test_user', JSON.stringify(mockUser));
  },
});
```

### Checklist de Validação de Formulários no Cypress:
- No modal de coleta (`/coleta`), quando o vínculo é `ESTUDANTE_REGULAR` ou `ESTUDANTE_TECNICO`, os campos `#modal-nome`, `#modal-serie` e `#modal-turma` possuem o atributo HTML5 `required` e devem ser preenchidos antes da submissão.
