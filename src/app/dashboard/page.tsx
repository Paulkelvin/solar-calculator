"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { useAuth } from "@/contexts/auth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { fetchLeads } from "@/lib/supabase/queries";
import { LeadsList } from "@/components/dashboard/LeadsList";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { UserProfile } from "@/components/dashboard/UserProfile";
import {
  Users,
  Activity,
  UserCheck,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import type { Lead } from "../../../types/leads";
import { toast } from 'sonner';

export default function DashboardPage() {
  const { session } = useAuth();
  const userProfile = useUserProfile();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState({ total: 0, converted: 0, contacted: 0, avgScore: 0 });

  // Show success toast when redirected after email confirmation
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      toast.success('✅ Email confirmed!', {
        description: 'Your account is now active. Welcome email sent to your inbox.',
        duration: 6000,
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadStats = async () => {
      if (!session.user?.id) return;
      const result = await fetchLeads({ page: 1, pageSize: 1000 });
      const leads = result.data;
      const total = leads.length;
      const converted = leads.filter((l) => l.status === "converted").length;
      const contacted = leads.filter((l) => l.status === "contacted").length;
      const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + (l.lead_score ?? 0), 0) / total) : 0;
      setStats({ total, converted, contacted, avgScore });
    };
    loadStats();
  }, [session.user?.id]);

  const conversionRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : "0";
  
  const greeting = userProfile?.name 
    ? `Welcome back, ${userProfile.name.split(' ')[0]}!` 
    : 'Leads Dashboard';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            {greeting}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your leads, conversions, and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-all duration-200"
          >
            View Analytics <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <UserProfile />
        </div>
      </header>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Leads"
          value={stats.total}
          accent="blue"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Converted"
          value={stats.converted}
          suffix={` (${conversionRate}%)`}
          accent="green"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Contacted"
          value={stats.contacted}
          accent="amber"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Score"
          value={stats.avgScore}
          suffix="/100"
          accent="purple"
        />
      </div>

      {/* Leads Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Leads
        </h2>
        <LeadsList />
      </section>

      {/* Activity Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-400" />
          Recent Activity
        </h2>
        <ActivityLog />
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  accent: "blue" | "green" | "amber" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-amber-50 text-amber-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[accent]}`}>{icon}</div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-400">{suffix}</span>}
      </p>
    </div>
  );
}
