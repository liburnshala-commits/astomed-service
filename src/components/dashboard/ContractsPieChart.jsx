import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ['#1b3a3a', '#3a9e9e', '#e6a817', '#64748b', '#ef4444', '#14b8a6', '#a855f7', '#0f766e', '#d97706'];

export default function ContractsPieChart({ machines, templates }) {
  const activeMachines = machines.filter(m => m.service_contract && m.service_contract !== 'none' && (!m.contract_status || m.contract_status === 'active'));
  
  const distribution = {};
  activeMachines.forEach(m => {
    let name = m.model || "Okänd maskin";
    distribution[name] = (distribution[name] || 0) + 1;
  });

  const data = Object.keys(distribution).map(key => ({
    name: key,
    value: distribution[key]
  })).sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="astomed-card h-full">
        <CardHeader>
          <CardTitle className="text-sm astomed-muted font-medium uppercase tracking-wide">Fördelning av aktiva avtal</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-slate-400">
          Inga aktiva avtal att visa
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-slate-600">Antal: <span className="font-bold text-[#3a9e9e]">{payload[0].value} st</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="astomed-card h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-xs astomed-muted font-medium uppercase tracking-wide">Fördelning av aktiva avtal per maskin</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}