"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { fetchLeads } from "@/lib/supabase/queries";
import type { Lead } from "../../../types/leads";

type SortBy = "date" | "score";

export function LeadsList() {
  const { session } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session.user?.id) return;
      
      setIsLoading(true);
      const data = await fetchLeads(session.user.id);
      setLeads(data);
      setIsLoading(false);
    };

    load();
  }, [session.user?.id]);

  const sortedLeads = [...leads].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      return b.lead_score - a.lead_score;
    }
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-secondary/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No leads yet. Submit calculations to populate this list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy("date")}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            sortBy === "date"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground hover:bg-muted"
          }`}
        >
          Sort by Date
        </button>
        <button
          onClick={() => setSortBy("score")}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            sortBy === "score"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground hover:bg-muted"
          }`}
        >
          Sort by Score
        </button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {sortedLeads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between px-4 py-4 hover:bg-secondary/30"
          >
            <div className="flex-1">
              <p className="font-medium">{lead.contact.name}</p>
              <p className="text-xs text-muted-foreground">
                {lead.address.street}, {lead.address.city}, {lead.address.state}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lead.contact.email} • {lead.contact.phone}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Lead Score</p>
                <p className="text-lg font-bold text-primary">
                  {lead.lead_score}/100
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-xs font-medium">
                  {new Date(lead.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
