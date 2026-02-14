"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  Target,
  Activity,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import type { Lead } from "../../../../types/leads";

interface ActivityEntry {
  id: string;
  event_type: string;
  created_at: string;
  lead_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#eab308",
  converted: "#22c55e",
  lost: "#ef4444",
};

export default function AnalyticsPage() {
  const { session } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    const fetchData = async () => {
      if (!session.user?.id) return;
      setIsLoading(true);

      const [leadsRes, activitiesRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*")
          .eq("installer_id", session.user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("activity_log")
          .select("id, event_type, created_at, lead_id")
          .eq("installer_id", session.user.id)
          .order("created_at", { ascending: true })
          .limit(500),
      ]);

      setLeads((leadsRes.data as unknown as Lead[]) || []);
      setActivities((activitiesRes.data as ActivityEntry[]) || []);
      setIsLoading(false);
    };

    fetchData();
  }, [session.user?.id]);

  // Filter data by time range
  const cutoffDate = useMemo(() => {
    const now = new Date();
    if (timeRange === "7d") return new Date(now.getTime() - 7 * 86400000);
    if (timeRange === "30d") return new Date(now.getTime() - 30 * 86400000);
    if (timeRange === "90d") return new Date(now.getTime() - 90 * 86400000);
    return new Date(0);
  }, [timeRange]);

  const filteredLeads = useMemo(
    () => leads.filter((l) => new Date(l.created_at) >= cutoffDate),
    [leads, cutoffDate]
  );

  // KPI metrics
  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter((l) => l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
  const avgScore =
    totalLeads > 0
      ? Math.round(filteredLeads.reduce((s, l) => s + (l.lead_score ?? 0), 0) / totalLeads)
      : 0;
  const newThisWeek = leads.filter(
    (l) => new Date(l.created_at) >= new Date(Date.now() - 7 * 86400000)
  ).length;

  // Leads over time (grouped by day/week depending on range)
  const leadsOverTime = useMemo(() => {
    const buckets = new Map<string, number>();
    filteredLeads.forEach((l) => {
      const d = new Date(l.created_at);
      const key =
        timeRange === "7d"
          ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return Array.from(buckets, ([date, count]) => ({ date, count }));
  }, [filteredLeads, timeRange]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = { new: 0, contacted: 0, converted: 0, lost: 0 };
    filteredLeads.forEach((l) => {
      const s = l.status || "new";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Lead score distribution
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-20", min: 0, max: 20, count: 0 },
      { range: "21-40", min: 21, max: 40, count: 0 },
      { range: "41-60", min: 41, max: 60, count: 0 },
      { range: "61-80", min: 61, max: 80, count: 0 },
      { range: "81-100", min: 81, max: 100, count: 0 },
    ];
    filteredLeads.forEach((l) => {
      const score = l.lead_score ?? 0;
      const bucket = buckets.find((b) => score >= b.min && score <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets.map((b) => ({ range: b.range, count: b.count }));
  }, [filteredLeads]);

  // Activity by type
  const activityByType = useMemo(() => {
    const filtered = activities.filter((a) => new Date(a.created_at) >= cutoffDate);
    const counts = new Map<string, number>();
    filtered.forEach((a) => {
      const label = a.event_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [activities, cutoffDate]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your leads, conversions, and performance over time.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timeRange === range
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === "all" ? "All" : range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KPICard
          icon={<Users className="h-5 w-5" />}
          label="Total Leads"
          value={totalLeads.toString()}
          subtext={`${newThisWeek} this week`}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <KPICard
          icon={<Target className="h-5 w-5" />}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          subtext={`${convertedLeads} converted`}
          color="text-green-600"
          bg="bg-green-50"
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Lead Score"
          value={avgScore.toString()}
          subtext="out of 100"
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KPICard
          icon={<Activity className="h-5 w-5" />}
          label="Activities"
          value={activities.filter((a) => new Date(a.created_at) >= cutoffDate).length.toString()}
          subtext="events logged"
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Leads Over Time */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Leads Over Time
          </h3>
          {leadsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Status Distribution</h3>
          {totalLeads > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Lead Score Distribution */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Lead Score Distribution</h3>
          {totalLeads > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Activity by Type */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Activity Breakdown</h3>
          {activityByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  subtext,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
      No data available for this period.
    </div>
  );
}
