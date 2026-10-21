import { salvarEntrevistaResiliente } from "../lib/supabaseClient";

let isSyncing = false;

function normalizeStr(s?: string) {
  return (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export const tasOfflineSync = {
  // Salva no LocalStorage quando não há rede garantindo que não haja duplicidade de participante
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
        id: existingIdx >= 0 ? drafts[existingIdx].id : `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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

  // Obtem rascunhos pendentes
  getDrafts: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
    } catch {
      return [];
    }
  },

  // Sincroniza com o Supabase quando a rede volta com lock contra concorrência
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
      // Deduplica rascunhos em memória antes de sincronizar
      const uniqueDraftsMap = new Map<string, any>();
      for (const draft of drafts) {
        const raw = draft.data || draft;
        const key = normalizeStr(raw.nome_participante) || draft.id || `item-${Math.random()}`;
        uniqueDraftsMap.set(key, draft);
      }
      const uniqueDrafts = Array.from(uniqueDraftsMap.values());

      const successfulSyncIds = new Set<string>();

      for (const draft of uniqueDrafts) {
        const rawPayload = draft.data || draft;
        const draftId = draft.id || rawPayload.id || `local-${Math.random()}`;

        const { error } = await salvarEntrevistaResiliente(rawPayload, pesquisadorId);

        if (!error) {
          successfulSyncIds.add(draftId);
          if (draft.id) successfulSyncIds.add(draft.id);
          if (rawPayload.id) successfulSyncIds.add(rawPayload.id);
        } else {
          console.error(`[TAS SARA] Erro ao sincronizar ficha ${draftId}:`, error);
        }
      }

      const remainingDrafts = drafts.filter((d: any) => {
        const id1 = d.id;
        const id2 = d.data?.id;
        return (!id1 || !successfulSyncIds.has(id1)) && (!id2 || !successfulSyncIds.has(id2));
      });

      if (remainingDrafts.length === 0) {
        localStorage.removeItem("censo_pending_queue");
      } else {
        localStorage.setItem("censo_pending_queue", JSON.stringify(remainingDrafts));
      }

      console.info(`[TAS SARA] Sincronização concluída! ${successfulSyncIds.size} fichas processadas.`);

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
