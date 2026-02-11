"use client";

import { Sun, DollarSign } from "lucide-react";

interface SolarScoreTeaserProps {
  solarScore: number; // 0-100
  peakSunHours?: number;
  percentileRanking?: number; // Top X%
  estimatedSavingsRange?: { min: number; max: number };
  currency?: 'USD' | 'NGN';
  country?: 'US' | 'Nigeria';
  showSavings?: boolean;
}

export function SolarScoreTeaser({
  solarScore,
  peakSunHours = 4.5,
  percentileRanking = 75,
  estimatedSavingsRange = { min: 800, max: 1500 },
  currency = 'USD',
  country = 'US',
  showSavings = true
}: SolarScoreTeaserProps) {
  
  const getSolarGrade = (score: number) => {
    if (score >= 85)
      return {
        label: 'Excellent',
        badgeClass: 'bg-emerald-600 text-white border border-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]',
        textColor: 'text-emerald-700',
      };
    if (score >= 70)
      return {
        label: 'Very Good',
        badgeClass: 'bg-cyan-600 text-white border border-cyan-200 shadow-[0_0_18px_rgba(8,145,178,0.35)]',
        textColor: 'text-cyan-700',
      };
    if (score >= 55)
      return {
        label: 'Good',
        badgeClass: 'bg-amber-500 text-white border border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
        textColor: 'text-amber-700',
      };
    return {
      label: 'Fair',
      badgeClass: 'bg-orange-500 text-white border border-orange-200 shadow-[0_0_18px_rgba(249,115,22,0.35)]',
      textColor: 'text-orange-700',
    };
  };

  const grade = getSolarGrade(solarScore);
  const currencySymbol = currency === 'NGN' ? '₦' : '$';
  const formattedMin = estimatedSavingsRange.min.toLocaleString();
  const formattedMax = estimatedSavingsRange.max.toLocaleString();
  const monthlyMin = Math.round(estimatedSavingsRange.min / 12).toLocaleString();
  const monthlyMax = Math.round(estimatedSavingsRange.max / 12).toLocaleString();
  const rankingDescriptor = percentileRanking <= 15
    ? "Regional standout"
    : percentileRanking <= 35
    ? "Above nearby installs"
    : percentileRanking <= 55
    ? "Tracking area median"
    : "Needs site verification";
  const topPercent = Math.min(100, Math.max(1, Math.round(percentileRanking)));
  const messagePools: Record<string, string[]> = {
    excellent: [
      "Sun-drenched roof primed for premium output.",
      "Great news! Your roof is built for high-yield solar.",
      "Prime irradiance zone detected—expect standout production."
    ],
    "very good": [
      "Consistent sunshine puts your roof in a strong solar bracket.",
      "Bright outlook—your roof handles solar exceptionally well."
    ],
    good: [
      "Solid solar baseline with room to maximize savings.",
      "Reliable daylight hours make this a smart upgrade."
    ],
    fair: [
      "Moderate exposure—pair with efficiency tweaks for best results.",
      "Sunlight is steady enough to justify a focused solar plan."
    ]
  };
  const normalizedScore = Math.max(0, Math.min(100, Math.round(solarScore)));
  const gaugeAngle = `${normalizedScore * 3.6}deg`;
  const poolKey = grade.label.toLowerCase() as keyof typeof messagePools;
  const pool = messagePools[poolKey] || messagePools.good;
  const headline = pool[normalizedScore % pool.length];

  return (
    <div className="animate-in slide-in-from-bottom duration-500 bg-gradient-to-r from-emerald-50 via-white to-yellow-50 rounded-2xl border border-emerald-100 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="h-5 w-5 text-yellow-500" />
        <h3 className="text-sm font-bold text-gray-800">{headline}</h3>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-emerald-50 via-transparent to-yellow-50 opacity-45" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Solar score index</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-4xl font-black ${grade.textColor}`}>{solarScore}</span>
                  <span className="text-lg text-gray-400">/100</span>
                </div>
                <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${grade.badgeClass}`}>
                  <span className="h-2 w-2 rounded-full bg-white/80" />
                  <span>{grade.label}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{rankingDescriptor}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-right text-xs text-emerald-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">Top-tier ranking</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-900">Top {topPercent}%</p>
                <p className="text-[11px] text-emerald-700">in {country === 'US' ? 'the United States' : country}</p>
                <p className="mt-2 text-[11px] text-emerald-700/80">Based on sun exposure and roof size in your area.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: `conic-gradient(#10b981 ${gaugeAngle}, #ecfdf5 ${gaugeAngle})` }}
                />
                <div className="absolute inset-2 rounded-full bg-white shadow-inner flex items-center justify-center">
                  <span className="text-2xl font-black text-emerald-700">{normalizedScore}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 max-w-[8rem]">
                Dial completes as roof data checks out (sun, area, shading, ranking).
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-yellow-50 text-yellow-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                <Sun className="h-4 w-4 animate-pulse" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Peak sunlight window</p>
                <p className="text-2xl font-semibold text-gray-900">{peakSunHours}<span className="ml-1 text-sm text-gray-400">hrs/day</span></p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Expect roughly {peakSunHours} hrs of productive sun on clear days.</p>
          </div>

          {showSavings && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <DollarSign className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-wide font-semibold">Projected year-one savings</p>
              </div>
              <p className="text-3xl font-bold text-emerald-700">{currencySymbol}{formattedMin} – {currencySymbol}{formattedMax}</p>
              <p className="text-xs text-emerald-700">Roughly {currencySymbol}{monthlyMin} – {currencySymbol}{monthlyMax} off your monthly bill once the system is live.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
