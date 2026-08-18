import { redirect } from "next/navigation";

/**
 * No landing page exists yet (Phase 8 builds it). Everyone who hits `/`
 * goes to /dashboard, which proxy.ts gates — authenticated contractors
 * land on their dashboard, everyone else gets bounced to /login.
 */
export default function RootPage() {
  redirect("/dashboard");
}
