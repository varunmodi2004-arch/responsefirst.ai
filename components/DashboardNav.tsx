"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/pipeline", label: "Claims & Jobs" },
  { href: "/dashboard/follow-ups", label: "Follow-ups" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[860px] gap-1">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate/40 ${
                isActive
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted hover:border-line hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
