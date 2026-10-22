import { salvarEntrevistaResiliente } from "../lib/supabaseClient";

let isSyncing = false;

function normalizeStr(s?: string) {
  return (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function generateSafeId(prefix = 'local'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

export function withTimeout<T = any>(promise: Promise<T> | PromiseLike<T>, ms = 7000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT_CONEXAO_LENTA')), ms);
    Promise.resolve(promise)
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const tasOfflineSync = {
  // Salva no LocalStorage antes de qualquer requisição garantindo que não haja perda nem duplicidade
  saveDraftOffline: (data: any) => {
    try {
      const drafts: any[] = JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
      const raw = data.data || data;
      if (raw.nome_participante) {
        raw.nome_participante = String(raw.nome_participante).trim().toUpperCase();
      }
      const targetNorm = normalizeStr(raw.nome_participante);

      // Se já houver um rascunho com o mesmo participante na fila, atualiza em vez de duplicar
      const existingIdx = drafts.findIndex((d: any) => {
        const itemRaw = d.data || d;
        return normalizeStr(itemRaw.nome_participante) === targetNorm;
      });

      const newEntry = {
        id: existingIdx >= 0 ? drafts[existingIdx].id : (data.id || generateSafeId('local')),
        ...data,
        ...(raw === data ? { nome_participante: raw.nome_participante } : {}),
        timestamp: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        drafts[existingIdx] = newEntry;
      } else {
        drafts.push(newEntry);
      }

      localStorage.setItem("censo_pending_queue", JSON.stringify(drafts));
      console.info("[TAS Offline] Ficha salva localmente com sucesso (sem duplicidade).");
    } catch (e) {
      console.error("[TAS Offline] Erro ao salvar rascunho offline:", e);
    }
  },

  // Remove um rascunho após confirmação de sucesso na nuvem
  removeDraft: (id: string) => {
    try {
      const drafts: any[] = JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
      const remaining = drafts.filter((d: any) => d.id !== id && d.data?.id !== id);
      if (remaining.length === 0) {
        localStorage.removeItem("censo_pending_queue");
      } else {
        localStorage.setItem("censo_pending_queue", JSON.stringify(remaining));
      }
    } catch (e) {
      console.error("[TAS Offline] Erro ao remover rascunho do storage:", e);
    }
  },

  // Obtem rascunhos pendentes
  getDrafts: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
    } catch {
      return [];
    }
  },

  // Exporta a fila pendente atual como JSON legível para backup ou resgate
  exportDraftsAsJson: (): string => {
    return localStorage.getItem("censo_pending_queue") || "[]";
  },

  // Importa e mescla rascunhos resgatados de outros aparelhos (ex: Chromebooks da escola)
  importDrafts: (newDrafts: any[]): number => {
    try {
      const existing: any[] = JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
      const combined = [...existing];
      newDrafts.forEach((nd) => {
        const raw = nd.data || nd;
        const norm = normalizeStr(raw.nome_participante);
        if (!norm) return;
        const idx = combined.findIndex((c) => normalizeStr(c.data?.nome_participante || c.nome_participante) === norm);
        if (idx >= 0) {
          combined[idx] = nd;
        } else {
          combined.push(nd);
        }
      });
      localStorage.setItem("censo_pending_queue", JSON.stringify(combined));
      return combined.length;
    } catch {
      return 0;
    }
  },

  importDraftsFromJson: (jsonStr: string): number => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) return 0;
      return tasOfflineSync.importDrafts(parsed);
    } catch {
      return 0;
    }
  },

  // Sincroniza com o Supabase quando a rede volta com lock contra concorrência e timeout individual
  syncOfflineData: async (pesquisadorId?: string): Promise<{ syncedCount: number; remainingCount: number }> => {
    if (isSyncing) {
      console.info("[TAS SARA] Sincronização já em andamento. Ignorando chamada concorrente.");
      const current = tasOfflineSync.getDrafts();
      return { syncedCount: 0, remainingCount: current.length };
    }

    const drafts = tasOfflineSync.getDrafts();
    if (!drafts || drafts.length === 0) return { syncedCount: 0, remainingCount: 0 };

    isSyncing = true;
    console.info(`[TAS SARA] Despertando Sincronização: ${drafts.length} fichas pendentes encontradas.`);

    try {
      const uniqueDrafts = getDeduplicatedDrafts(drafts);
      const successfulSyncIds = await syncDraftsSequentially(uniqueDrafts, pesquisadorId);
      const remainingDrafts = tasOfflineSync.getDrafts();

      console.info(`[TAS SARA] Sincronização concluída! ${successfulSyncIds.size} fichas processadas. Restantes: ${remainingDrafts.length}`);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('censo-sync-complete', {
          detail: { synced: successfulSyncIds.size, remaining: remainingDrafts.length }
        }));
      }

      return { syncedCount: successfulSyncIds.size, remainingCount: remainingDrafts.length };
    } finally {
      isSyncing = false;
    }
  }
};

function getDeduplicatedDrafts(drafts: any[]): any[] {
  const uniqueDraftsMap = new Map<string, any>();
  for (const draft of drafts) {
    const raw = draft.data || draft;
    const key = normalizeStr(raw.nome_participante) || draft.id || generateSafeId('item');
    uniqueDraftsMap.set(key, draft);
  }
  return Array.from(uniqueDraftsMap.values());
}

async function syncSingleDraft(draft: any, pesquisadorId?: string): Promise<string[]> {
  const rawPayload = draft.data || draft;
  const draftId = draft.id || rawPayload.id || generateSafeId('local');
  const ids: string[] = [];

  try {
    const { error } = await withTimeout(salvarEntrevistaResiliente(rawPayload, pesquisadorId), 7000);
    if (!error) {
      ids.push(draftId);
      if (draft.id) ids.push(draft.id);
      if (rawPayload.id) ids.push(rawPayload.id);
      tasOfflineSync.removeDraft(draftId);
    } else {
      console.error(`[TAS SARA] Erro ao sincronizar ficha ${draftId}:`, error);
    }
  } catch (itemErr) {
    console.error(`[TAS SARA] Timeout/Falha na ficha ${draftId}:`, itemErr);
  }

  return ids;
}

async function syncDraftsSequentially(drafts: any[], pesquisadorId?: string): Promise<Set<string>> {
  const successfulSyncIds = new Set<string>();

  const processNext = async (index: number): Promise<void> => {
    if (index >= drafts.length) return;
    const syncedIds = await syncSingleDraft(drafts[index], pesquisadorId);
    syncedIds.forEach((id) => successfulSyncIds.add(id));
    return processNext(index + 1);
  };

  await processNext(0);
  return successfulSyncIds;
}

/**
 * Ativa sincronização periódica a cada 25s em segundo plano se houver rascunhos pendentes.
 */
export function initBackgroundSync(pesquisadorId?: string): () => void {
  if (typeof window === 'undefined') return () => {};
  const interval = setInterval(() => {
    const drafts = tasOfflineSync.getDrafts();
    if (drafts.length > 0 && navigator.onLine) {
      void tasOfflineSync.syncOfflineData(pesquisadorId);
    }
  }, 25000);
  return () => clearInterval(interval);
}

