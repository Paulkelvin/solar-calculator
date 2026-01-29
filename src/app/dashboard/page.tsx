import { LeadsList } from "@/components/dashboard/LeadsList";

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Leads Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Phase 1 minimal dashboard — read-only leads list with basic sorting.
        </p>
      </header>

      <LeadsList />
    </main>
  );
}
