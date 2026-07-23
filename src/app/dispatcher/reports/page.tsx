"use client";

import { useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { StatCard } from "@/components/ui/StatCard";
import { DailyJobVolumeChart } from "@/components/charts/DailyJobVolumeChart";
import { TechnicianActivityChart } from "@/components/charts/TechnicianActivityChart";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { FacilityRevenueBar } from "@/components/charts/FacilityRevenueBar";
import { Button } from "@/components/ui/Button";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { useRatings, satisfactionMetrics } from "@/lib/hooks/useRatings";
import { Download, Calendar, CheckCircle2, Users, MapPin, Clock, DollarSign, TrendingDown, Star } from "lucide-react";

const DATE_RANGES = ["Today", "Last 7 Days", "Last 30 Days", "This Month", "Custom"];

export default function DispatcherReportsPage() {
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const { orders } = useOrders();
  const { technicians, loading: techLoading } = useTechnicians();
  const { invoices } = useInvoices();
  const { ratings, loading: ratingsLoading } = useRatings();

  // Retention/quality: caregiver ratings rolled into avg stars + NPS-style score
  const sat = satisfactionMetrics(ratings);

  // IDS "Must-Have 8" — computed from live data, no schema changes needed
  const totalExamsToday = technicians.reduce((sum, t) => sum + t.completedToday, 0);
  const workingTechs    = technicians.filter(t => t.completedToday > 0 || t.online);
  const examsPerTechDay = workingTechs.length > 0
    ? (totalExamsToday / workingTechs.length).toFixed(1)
    : "—";

  // Proxy: group completed_today by zone; each zone = 1 route
  const zoneExams      = Object.values(
    technicians.reduce<Record<string, number>>((acc, t) => {
      acc[t.zone] = (acc[t.zone] ?? 0) + t.completedToday;
      return acc;
    }, {})
  );
  const examsPerZoneDay = zoneExams.length > 0
    ? (zoneExams.reduce((s, n) => s + n, 0) / zoneExams.length).toFixed(1)
    : "—";

  const activeBacklog = orders.filter(o =>
    ["pending", "assigned", "en-route", "in-progress"].includes(o.status)
  ).length;

  // P5 labor cost KPIs — require hourlyRate on technicians (migration 006)
  const totalLaborToday  = workingTechs.reduce((sum, t) => sum + (t.hourlyRate ?? 0) * 8, 0);
  const avgDailyRevenue  = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / 30;
  const laborCostPct     = avgDailyRevenue > 0 && totalLaborToday > 0
    ? `${((totalLaborToday / avgDailyRevenue) * 100).toFixed(1)}%`
    : "—";
  const laborPerExam     = totalExamsToday > 0 && totalLaborToday > 0
    ? `$${(totalLaborToday / totalExamsToday).toFixed(0)}`
    : "—";

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white border border-outline-variant/40 rounded-xl px-3 py-2 shadow-card">
          <Calendar className="h-4 w-4 text-on-surface-variant" />
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-sm text-on-surface bg-transparent focus:outline-none cursor-pointer"
          >
            {DATE_RANGES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="secondary" size="md">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Orders"        value="183"   subtext="+12% vs prior period"   subIntent="positive" subIcon="trending_up" />
        <KPICard label="Avg Response Time"   value="14 min" subtext="−3 min improvement"    subIntent="positive" subIcon="speed" />
        <KPICard label="Completion Rate"     value="94%"   subtext="Above 90% target"       subIntent="positive" subIcon="trending_up" />
        <KPICard label="STAT Response"       value="8 min"  subtext="Within 15 min SLA"     subIntent="positive" subIcon="speed" />
      </div>

      {/* Retention / quality */}
      <div>
        <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
          Facility Satisfaction · Caregiver Ratings
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Avg Visit Rating"
            value={ratingsLoading ? 0 : sat.avg}
            unit="/ 5"
            loading={ratingsLoading}
            icon={<Star className="h-5 w-5 text-warning-amber" />}
            iconBg="bg-warning-amber/10"
          />
          <StatCard
            label="Satisfaction Score"
            value={ratingsLoading ? 0 : sat.nps}
            unit="NPS"
            loading={ratingsLoading}
            icon={<Users className="h-5 w-5 text-medical-blue" />}
            iconBg="bg-medical-blue/10"
          />
          <StatCard
            label="Ratings Collected"
            value={ratingsLoading ? 0 : sat.count}
            unit="visits"
            loading={ratingsLoading}
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-500/10"
          />
        </div>
      </div>

      {/* IDS Operations KPIs */}
      <div>
        <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
          IDS Operations KPIs · Today
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Exams Today"
            value={techLoading ? 0 : totalExamsToday}
            unit="exams"
            loading={techLoading}
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-500/10"
          />
          <StatCard
            label="Exams / Tech / Day"
            value={techLoading ? 0 : examsPerTechDay}
            unit="avg"
            loading={techLoading}
            icon={<Users className="h-5 w-5 text-medical-blue" />}
            iconBg="bg-medical-blue/10"
          />
          <StatCard
            label="Exams / Zone / Day"
            value={techLoading ? 0 : examsPerZoneDay}
            unit="avg"
            loading={techLoading}
            icon={<MapPin className="h-5 w-5 text-warning-amber" />}
            iconBg="bg-warning-amber/10"
          />
          <StatCard
            label="Active Backlog"
            value={activeBacklog}
            unit="orders"
            icon={<Clock className="h-5 w-5 text-slate-gray" />}
            iconBg="bg-slate-100"
          />
          <StatCard
            label="Labor Cost % Rev"
            value={techLoading ? 0 : laborCostPct}
            unit=""
            loading={techLoading}
            icon={<TrendingDown className="h-5 w-5 text-emergency-red" />}
            iconBg="bg-emergency-red/10"
          />
          <StatCard
            label="Labor $ / Exam"
            value={techLoading ? 0 : laborPerExam}
            unit=""
            loading={techLoading}
            icon={<DollarSign className="h-5 w-5 text-slate-gray" />}
            iconBg="bg-slate-100"
          />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyJobVolumeChart />
        <TechnicianActivityChart />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueAreaChart />
        <FacilityRevenueBar />
      </div>

      {/* Facility breakdown table */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold font-label uppercase tracking-wider text-on-surface">
            Facility Breakdown
          </h3>
          <Button variant="ghost" size="sm">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container">
              <tr>
                {["Facility", "Orders", "Completed", "Avg Response", "STAT Count"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {[
                { name: "Sunrise Medical Center",   orders: 48, completed: 45, avgResp: "12 min", stat: 4 },
                { name: "Desert Valley Hospital",    orders: 41, completed: 39, avgResp: "16 min", stat: 6 },
                { name: "Camelback Rehab Center",    orders: 37, completed: 35, avgResp: "11 min", stat: 2 },
                { name: "Phoenix Care Facility",     orders: 30, completed: 28, avgResp: "18 min", stat: 3 },
                { name: "Valley View Nursing Home",  orders: 27, completed: 26, avgResp: "14 min", stat: 1 },
              ].map(row => (
                <tr key={row.name} className="hover:bg-surface-container/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-on-surface">{row.name}</td>
                  <td className="px-5 py-3 font-mono text-on-surface">{row.orders}</td>
                  <td className="px-5 py-3 font-mono text-green-600">{row.completed}</td>
                  <td className="px-5 py-3 font-mono text-on-surface">{row.avgResp}</td>
                  <td className="px-5 py-3 font-mono text-emergency-red font-semibold">{row.stat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
