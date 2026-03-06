import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Receipt } from "lucide-react";

const formatSEK = (value) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(value);

export default function BillingChart({ records }) {
  // Sum costs from in_progress and completed (not yet invoiced) vs actually invoiced
  const planned = records
    .filter(r => r.status === "in_progress" || r.status === "completed")
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const invoiced = records
    .filter(r => r.status === "invoiced")
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const data = [
    { name: "Planerat att faktureras", amount: planned, fill: "#3a9e9e" },
    { name: "Faktiskt fakturerat", amount: invoiced, fill: "#1b3a3a" },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow text-sm">
          <p className="font-semibold astomed-title mb-1">{payload[0].payload.name}</p>
          <p style={{ color: payload[0].payload.fill }}>{formatSEK(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="astomed-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold astomed-title flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Faktureringsöversikt
        </CardTitle>
        <p className="text-xs astomed-muted">Planerat (pågående & slutförda) vs faktiskt fakturerat</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 mb-4">
          <div>
            <p className="text-xs astomed-muted uppercase tracking-wide font-medium">Planerat att faktureras</p>
            <p className="text-2xl font-bold" style={{ color: "#3a9e9e" }}>{formatSEK(planned)}</p>
          </div>
          <div>
            <p className="text-xs astomed-muted uppercase tracking-wide font-medium">Faktiskt fakturerat</p>
            <p className="text-2xl font-bold" style={{ color: "#1b3a3a" }}>{formatSEK(invoiced)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dce8e8" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b8f8f" }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#6b8f8f" }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}