import { salvarEntrevistaResiliente } from "../lib/supabaseClient";

interface OfflineFicha {
  id: string; // unique local ID
  data?: any; // the form data if wrapped
  [key: string]: any;
}

export const tasOfflineSync = {
  // Salva no LocalStorage quando não há rede
  saveDraftOffline: (data: any) => {
    try {
      const drafts: any[] = JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
      drafts.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("censo_pending_queue", JSON.stringify(drafts));
      console.info("[TAS Offline] Ficha salva localmente no Accumbens Cache.");
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

  // Sincroniza com o Supabase quando a rede volta
  syncOfflineData: async (pesquisadorId: string) => {
    const drafts = tasOfflineSync.getDrafts();
    if (!drafts || drafts.length === 0) return;

    console.info(`[TAS SARA] Despertando Sincronização: ${drafts.length} fichas pendentes encontradas.`);

    const successfulSyncIds: string[] = [];

    for (const draft of drafts) {
      // Suporta tanto o formato { data: ... } quanto direto { nome_participante: ... }
      const rawPayload = draft.data || draft;
      const draftId = draft.id || rawPayload.id || `local-${Math.random()}`;

      const { error } = await salvarEntrevistaResiliente(rawPayload, pesquisadorId);

      if (!error) {
        successfulSyncIds.push(draftId);
      } else {
        console.error(`[TAS SARA] Erro ao sincronizar ficha ${draftId}:`, error);
      }
    }

    if (successfulSyncIds.length > 0) {
      const remainingDrafts = drafts.filter((d: any) => {
        const id = d.id || d.data?.id;
        return !successfulSyncIds.includes(id);
      });
      localStorage.setItem("censo_pending_queue", JSON.stringify(remainingDrafts));
      console.info(`[TAS SARA] Sincronização concluída! ${successfulSyncIds.length} fichas sincronizadas com sucesso.`);
    }
  }
};
