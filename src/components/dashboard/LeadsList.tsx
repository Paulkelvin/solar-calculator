"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth";
import { fetchLeads } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import type { Lead } from "../../../types/leads";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SortBy = "date" | "score";
type StatusFilter = "all" | "new" | "contacted" | "converted" | "lost";

const PAGE_SIZE = 15;

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
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalLeads / PAGE_SIZE));

  useEffect(() => {
    const load = async () => {
      if (!session.user?.id) return;
      
      setIsLoading(true);
      const result = await fetchLeads(session.user.id, { page: currentPage, pageSize: PAGE_SIZE });
      setLeads(result.data);
      setTotalLeads(result.total);
      setIsLoading(false);
    };

    load();
  }, [session.user?.id, currentPage]);

  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    
    // Search filter — null-safe access for JSONB fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (lead.contact?.name || '').toLowerCase().includes(query) ||
        (lead.contact?.email || '').toLowerCase().includes(query) ||
        (lead.contact?.phone || '').includes(query) ||
        (lead.address?.street || '').toLowerCase().includes(query) ||
        (lead.address?.city || '').toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else {
      return (b.lead_score ?? 0) - (a.lead_score ?? 0);
    }
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (!session.user?.id) return;

    setUpdatingId(leadId);
    setStatusError(null);
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
      setStatusError(`Failed to update status for this lead. Please try again.`);
      setTimeout(() => setStatusError(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNote = async (leadId: string, note: string) => {
    if (!session.user?.id) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ notes: note })
        .eq("id", leadId)
        .eq("installer_id", session.user.id);

      if (error) throw error;

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, notes: note } : lead
      ));
      
      setSelectedNoteId(null);
      setNoteContent("");
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "ZIP",
      "Status",
      "Lead Score",
      "Submitted Date",
    ];

    const rows = filteredLeads.map(lead => [
      lead.contact?.name || '',
      lead.contact?.email || '',
      lead.contact?.phone || '',
      lead.address?.street || '',
      lead.address?.city || '',
      lead.address?.state || '',
      lead.address?.zip || '',
      lead.status || '',
      lead.lead_score ?? 0,
      new Date(lead.created_at || 0).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by name, email, phone, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        {/* Filters and Export */}
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

          <button
            onClick={exportToCSV}
            disabled={filteredLeads.length === 0}
            className="rounded-md bg-green-600 text-white px-3 py-1 text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          Showing {filteredLeads.length} of {totalLeads} leads
          {totalPages > 1 && ` — Page ${currentPage} of ${totalPages}`}
        </p>
      </div>

      {/* Status error banner */}
      {statusError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{statusError}</span>
          <button onClick={() => setStatusError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        {sortedLeads.map((lead) => (
          <div
            key={lead.id}
            className="px-4 py-4 hover:bg-secondary/30"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{lead.contact?.name || 'Unknown'}</p>
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
                  </select>                <Link
                  href={`/dashboard/leads/${lead.id}`}
                  className="ml-2 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  View →
                </Link>                </div>
                <p className="text-xs text-muted-foreground">
                  {lead.address?.street || ''}, {lead.address?.city || ''}, {lead.address?.state || ''}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lead.contact?.email || ''} • {lead.contact?.phone || ''}
                </p>

                {/* Notes section */}
                <div className="mt-2 text-xs">
                  {lead.notes && selectedNoteId !== lead.id && (
                    <div className="bg-blue-50 p-2 rounded border border-blue-200 mb-2">
                      <p className="text-blue-900">{lead.notes}</p>
                      <button
                        onClick={() => {
                          setSelectedNoteId(lead.id);
                          setNoteContent(lead.notes || "");
                        }}
                        className="text-blue-600 hover:underline mt-1 text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {selectedNoteId === lead.id ? (
                    <div className="space-y-1">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add notes..."
                        className="w-full rounded border border-border p-2 text-xs focus:ring-2 focus:ring-primary"
                        rows={2}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveNote(lead.id, noteContent)}
                          className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setSelectedNoteId(null);
                            setNoteContent("");
                          }}
                          className="px-2 py-1 rounded bg-secondary text-foreground hover:bg-muted text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : !lead.notes && (
                    <button
                      onClick={() => setSelectedNoteId(lead.id)}
                      className="text-blue-600 hover:underline"
                    >
                      + Add Note
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Lead Score</p>
                  <p className="text-lg font-bold text-primary">
                    {lead.lead_score ?? 0}/100
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
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium bg-secondary text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium bg-secondary text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
