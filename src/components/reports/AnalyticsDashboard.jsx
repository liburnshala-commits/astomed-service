import { useMemo } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#1b3a3a", "#3a9e9e", "#254f4f", "#6bbfbf", "#8aabab", "#b0d0d0"];

function exportCSV(headers, rows, filename) {
  const csvContent = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exporterad!");
}

// 1. Serviceärenden per månad/år
function ServicePerMonth({ records }) {
  const data = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (!r.service_date) return;
      const key = r.service_date.slice(0, 7); // "YYYY-MM"
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({
        month: format(new Date(key + "-01"), "MMM yyyy", { locale: sv }),
        count,
        key
      }));
  }, [records]);

  function handleExport() {
    exportCSV(
      ["Månad", "Antal ärenden"],
      data.map(d => [d.month, d.count]),
      "arenden_per_manad.csv"
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <div className="font-semibold text-slate-800">Serviceärenden per månad</div>
          <div className="text-xs text-slate-500 mt-0.5">Antal ärenden fördelade över tid</div>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="w-3 h-3 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">Ingen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v} ärenden`]} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// 2. Genomsnittlig tid att slutföra ärenden
function AvgCompletionTime({ records }) {
  const data = useMemo(() => {
    // Group completed records by month, calculate avg labor_hours
    const map = {};
    records.forEach(r => {
      if (r.status !== "completed" && r.status !== "invoiced") return;
      if (!r.service_date || !r.labor_hours) return;
      const key = r.service_date.slice(0, 7);
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += r.labor_hours;
      map[key].count += 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: format(new Date(key + "-01"), "MMM yyyy", { locale: sv }),
        avgHours: Math.round((val.total / val.count) * 10) / 10
      }));
  }, [records]);

  const overallAvg = useMemo(() => {
    const completed = records.filter(r => (r.status === "completed" || r.status === "invoiced") && r.labor_hours);
    if (completed.length === 0) return null;
    const total = completed.reduce((s, r) => s + r.labor_hours, 0);
    return Math.round((total / completed.length) * 10) / 10;
  }, [records]);

  function handleExport() {
    exportCSV(
      ["Månad", "Genomsnittliga arbetstimmar"],
      data.map(d => [d.month, d.avgHours]),
      "genomsnittlig_tid.csv"
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <div className="font-semibold text-slate-800">Genomsnittlig tid att slutföra</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Medelarbetstimmar per månad (slutförda ärenden)
            {overallAvg != null && <span className="ml-2 font-semibold text-slate-700">· Totalt snitt: {overallAvg} h</span>}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="w-3 h-3 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">Ingen data (kräver slutförda ärenden med registrerade arbetstimmar)</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} unit="h" />
              <Tooltip formatter={(v) => [`${v} h`]} />
              <Bar dataKey="avgHours" radius={[4, 4, 0, 0]} fill="#3a9e9e" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// 3. Maskiner med flest servicebehov
function MostServicedMachines({ records, machines, customers }) {
  const data = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (!r.machine_id) return;
      map[r.machine_id] = (map[r.machine_id] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([machine_id, count]) => {
        const m = machines.find(x => x.id === machine_id);
        const c = customers.find(x => x.id === m?.customer_id);
        return {
          label: `${m?.model || "Okänd"} · ${m?.serial_number || ""}`,
          customer: c?.company_name || "–",
          count
        };
      });
  }, [records, machines, customers]);

  function handleExport() {
    exportCSV(
      ["Maskin", "Kund", "Antal serviceärenden"],
      data.map(d => [d.label, d.customer, d.count]),
      "maskiner_flest_service.csv"
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <div className="font-semibold text-slate-800">Maskiner med flest servicebehov</div>
          <div className="text-xs text-slate-500 mt-0.5">Topp 10 maskiner efter antal ärenden</div>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="w-3 h-3 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">Ingen data</p>
        ) : (
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{d.label}</div>
                  <div className="text-xs text-slate-400 truncate">{d.customer}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full" style={{ width: `${Math.max(24, (d.count / data[0].count) * 100)}px`, background: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-semibold text-slate-700 w-8 text-right">{d.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 4. Omsättning per kund
function RevenuePerCustomer({ records, customers }) {
  const data = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (!r.customer_id || !r.total_cost) return;
      map[r.customer_id] = (map[r.customer_id] || 0) + r.total_cost;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([customer_id, total]) => {
        const c = customers.find(x => x.id === customer_id);
        return {
          name: c?.company_name || "Okänd",
          total: Math.round(total)
        };
      });
  }, [records, customers]);

  function handleExport() {
    exportCSV(
      ["Kund", "Total omsättning (kr)"],
      data.map(d => [d.name, d.total]),
      "omsattning_per_kund.csv"
    );
  }

  const totalRevenue = data.reduce((s, d) => s + d.total, 0);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <div className="font-semibold text-slate-800">Omsättning per kund</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Topp 10 kunder efter totalkostnad
            {totalRevenue > 0 && <span className="ml-2 font-semibold text-slate-700">· Totalt: {totalRevenue.toLocaleString("sv-SE")} kr</span>}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="w-3 h-3 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">Ingen data (kräver ärenden med registrerade totalkostnader)</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} unit=" kr" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => [`${v.toLocaleString("sv-SE")} kr`]} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard({ records, machines, customers }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ServicePerMonth records={records} />
        <AvgCompletionTime records={records} />
        <MostServicedMachines records={records} machines={machines} customers={customers} />
        <RevenuePerCustomer records={records} customers={customers} />
      </div>
    </div>
  );
}