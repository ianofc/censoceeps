import { supabase } from "../lib/supabaseClient";

interface OfflineFicha {
  id: string; // unique local ID
  data: any; // the form data
  timestamp: string;
}

export const tasOfflineSync = {
  // Salva no LocalStorage quando não há rede
  saveDraftOffline: (data: any) => {
    const drafts: OfflineFicha[] = JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
    drafts.push({
      id: crypto.randomUUID(),
      data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("censo_pending_queue", JSON.stringify(drafts));
    console.info("[TAS Offline] Ficha salva localmente no Accumbens Cache.");
  },

  // Obtem rascunhos pendentes
  getDrafts: (): OfflineFicha[] => {
    return JSON.parse(localStorage.getItem("censo_pending_queue") || "[]");
  },

  // Sincroniza com o Supabase quando a rede volta
  syncOfflineData: async (pesquisadorId: string) => {
    const drafts = tasOfflineSync.getDrafts();
    if (drafts.length === 0) return;

    console.info(`[TAS SARA] Despertando Sincronização: ${drafts.length} fichas pendentes encontradas.`);

    const successfulSyncs: string[] = [];

    for (const draft of drafts) {
      const payload = {
        ...draft.data,
      };

      const { error } = await supabase.from("entrevistas").insert([payload]);
      
      if (!error) {
        successfulSyncs.push(draft.id);
      } else {
        console.error(`[TAS SARA] Erro ao sincronizar ficha ${draft.id}:`, error);
      }
    }

    if (successfulSyncs.length > 0) {
      const remainingDrafts = drafts.filter(d => !successfulSyncs.includes(d.id));
      localStorage.setItem("censo_pending_queue", JSON.stringify(remainingDrafts));
      console.info(`[TAS SARA] Sincronização concluída! ${successfulSyncs.length} fichas enviadas para o Heimdall.`);
    }
  }
};
