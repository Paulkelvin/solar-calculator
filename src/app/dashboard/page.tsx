import { LeadsList } from "@/components/dashboard/LeadsList";
import { ActivityLog } from "@/components/dashboard/ActivityLog";

export default function DashboardPage() {
  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Leads Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Phase 6.3: Leads management with search, filtering, export, and activity tracking.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Leads</h2>
        <LeadsList />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <ActivityLog />
      </section>
    </main>
  );
}
