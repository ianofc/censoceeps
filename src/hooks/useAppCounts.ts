import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUserSession } from "./useUserSession";

export interface AppCounts {
  unreadMessages: number;   // unread DMs + public msgs since last visit
  newPosts: number;         // new feed posts since last visit
}

const STORAGE_KEY_MSG  = "layka_last_seen_msg";
const STORAGE_KEY_POST = "layka_last_seen_post";

export function useAppCounts() {
  const { profile } = useUserSession();
  const [counts, setCounts] = useState<AppCounts>({ unreadMessages: 0, newPosts: 0 });
  const lastSeenMsgRef  = useRef<string>(localStorage.getItem(STORAGE_KEY_MSG)  || new Date(0).toISOString());
  const lastSeenPostRef = useRef<string>(localStorage.getItem(STORAGE_KEY_POST) || new Date(0).toISOString());

  const refresh = async () => {
    if (!profile.id) return;
    const [{ count: msgCount }, { count: postCount }] = await Promise.all([
      supabase
        .from("lyka_messages")
        .select("*", { count: "exact", head: true })
        .neq("user_id", profile.id)
        .is("conversation_key", null)
        .gt("created_at", lastSeenMsgRef.current),
      supabase
        .from("lyka_posts")
        .select("*", { count: "exact", head: true })
        .neq("user_id", profile.id)
        .gt("created_at", lastSeenPostRef.current),
    ]);
    setCounts({ unreadMessages: msgCount || 0, newPosts: postCount || 0 });
  };

  useEffect(() => {
    if (!profile.id) return;
    void refresh();
    const ch = supabase.channel("app-counts-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lyka_messages" }, () => void refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lyka_posts" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [profile.id]);

  const markMessagesRead = () => {
    const now = new Date().toISOString();
    lastSeenMsgRef.current = now;
    localStorage.setItem(STORAGE_KEY_MSG, now);
    setCounts(c => ({ ...c, unreadMessages: 0 }));
  };

  const markPostsRead = () => {
    const now = new Date().toISOString();
    lastSeenPostRef.current = now;
    localStorage.setItem(STORAGE_KEY_POST, now);
    setCounts(c => ({ ...c, newPosts: 0 }));
  };

  return { counts, markMessagesRead, markPostsRead };
}
