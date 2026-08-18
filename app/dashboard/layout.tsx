import { getContractor } from "@/lib/contractor";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contractor = await getContractor();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="sticky top-0 z-30 bg-paper-raised/95 backdrop-blur-sm">
        <header className="border-b border-line px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[860px] items-center justify-between">
            <p className="truncate font-display text-base font-semibold text-ink">
              {contractor?.company_name ?? "ResponseFirst"}
            </p>
            {/* ROI display is intentionally hidden. weekly_reports.roi_multiple
                exists but all current values are unreliable (identical 456.45
                across seed and non-seed rows). Enable only after the ROI
                calculation source in W9 is verified. See implementation_plan.md. */}
          </div>
        </header>
        <div className="border-b border-line">
          <DashboardNav />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[860px] flex-1 px-4 py-6 sm:px-6">
        {children}
      </div>
    </div>
  );
}
