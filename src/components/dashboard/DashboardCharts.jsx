import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths, startOfMonth, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

const COLORS = ["#3a9e9e", "#1b3a3a", "#f59e0b", "#8b5cf6"];
const STATUS_COLORS = { pending: "#f59e0b", in_progress: "#3b82f6", completed: "#3a9e9e", invoiced: "#8b5cf6" };
const STATUS_LABELS = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };

export default function DashboardCharts({ records, machines }) {
  // --- 1. Service per month (last 6 months) ---
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: sv }), count: 0, cost: 0 };
  });
  records.forEach(r => {
    if (!r.service_date) return;
    const key = r.service_date.slice(0, 7);
    const m = months.find(m => m.key === key);
    if (m) { m.count += 1; m.cost += r.total_cost || 0; }
  });

  // --- 2. Status distribution ---
  const statusData = Object.entries(
    records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {})
  ).map(([status, value]) => ({ name: STATUS_LABELS[status] || status, value, status }));

  // --- 3. Service type split ---
  const typeCounts = records.reduce((acc, r) => {
    const t = r.service_type === "advanced" ? "Avancerad" : "Standard";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow text-sm">
          {label && <p className="font-medium text-slate-700 mb-1">{label}</p>}
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || "#1b3a3a" }}>
              {p.name}: {p.name === "Kostnad" ? p.value.toLocaleString("sv-SE") + " kr" : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Ärenden per månad */}
      <Card className="astomed-card lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold astomed-title">Serviceärenden per månad</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={months} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f2f2" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b8f8f" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b8f8f" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Ärenden" fill="#3a9e9e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ärendestatus fördelning */}
      <Card className="astomed-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold astomed-title">Ärendestatus</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-sm astomed-muted text-center py-10">Inga ärenden</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v + " st", n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Intäkter per månad */}
      <Card className="astomed-card lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold astomed-title">Kostnad per månad (kr)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={months}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a9e9e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3a9e9e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f2f2" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b8f8f" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b8f8f" }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? (v/1000).toFixed(0)+"k" : "0"} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cost" name="Kostnad" stroke="#3a9e9e" strokeWidth={2} fill="url(#costGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Servicetyp */}
      <Card className="astomed-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold astomed-title">Servicetyp</CardTitle>
        </CardHeader>
        <CardContent>
          {typeData.length === 0 ? (
            <p className="text-sm astomed-muted text-center py-10">Inga ärenden</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v + " st"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}