"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { fetchLeads } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import type { Lead } from "../../../types/leads";

type SortBy = "date" | "score";
type StatusFilter = "all" | "new" | "contacted" | "converted" | "lost";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  lost: "Lost",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  converted: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export function LeadsList() {
  const { session } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const filteredLeads = leads.filter(lead => {
    if (statusFilter === "all") return true;
    return lead.status === statusFilter;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      return b.lead_score - a.lead_score;
    }
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (!session.user?.id) return;

    setUpdatingId(leadId);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId)
        .eq("installer_id", session.user.id);

      if (error) throw error;

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus as any } : lead
      ));
    } catch (err) {
      console.error("Failed to update lead status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

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
      <div className="flex flex-wrap gap-2">
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

        <div className="flex-1"></div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-md border border-border px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {sortedLeads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between px-4 py-4 hover:bg-secondary/30"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{lead.contact.name}</p>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                  disabled={updatingId === lead.id}
                  className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[lead.status] || "bg-gray-50 text-gray-700 border-gray-200"} focus:outline-none disabled:opacity-50`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
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
