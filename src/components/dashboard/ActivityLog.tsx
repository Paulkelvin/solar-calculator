"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase/client";

interface ActivityLogEntry {
  id: string;
  event_type: string;
  metadata: Record<string, any>;
  lead_id: string | null;
  created_at: string;
}

export function ActivityLog() {
  const { session } = useAuth();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!session.user?.id) return;

      try {
        const { data, error } = await supabase
          .from("activity_log")
          .select("id, event_type, metadata, lead_id, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setActivities((data || []) as ActivityLogEntry[]);
      } catch (err) {
        console.error("Failed to fetch activity log:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [session.user?.id]);

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      form_submitted: "Form Submitted",
      results_viewed: "Results Viewed",
      lead_status_changed: "Status Changed",
      lead_notes_updated: "Notes Updated",
      settings_updated: "Settings Updated",
    };
    return labels[eventType] || eventType;
  };

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      form_submitted: "bg-blue-50 text-blue-700",
      results_viewed: "bg-amber-50 text-amber-700",
      lead_status_changed: "bg-yellow-50 text-yellow-700",
      lead_notes_updated: "bg-purple-50 text-purple-700",
      settings_updated: "bg-indigo-50 text-indigo-700",
    };
    return colors[eventType] || "bg-gray-50 text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading activity...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-secondary/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start justify-between rounded-lg border border-border p-3 hover:bg-secondary/30"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEventColor(
                  activity.event_type
                )}`}
              >
                {getEventLabel(activity.event_type)}
              </span>
              {activity.lead_id && (
                <span className="text-xs text-muted-foreground">
                  Lead ID: {activity.lead_id.substring(0, 8)}
                </span>
              )}
            </div>
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {Object.entries(activity.metadata)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(" • ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {new Date(activity.created_at).toLocaleDateString()}{" "}
              {new Date(activity.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
