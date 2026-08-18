import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/database.types";

const RECENT_NOTIFICATIONS_LIMIT = 20;

export async function getRecentNotifications(): Promise<Notification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(RECENT_NOTIFICATIONS_LIMIT);

  if (error) {
    console.error("getRecentNotifications:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    console.error("getUnreadNotificationCount:", error.message);
    return 0;
  }

  return count ?? 0;
}
