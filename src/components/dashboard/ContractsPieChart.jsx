import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ['#1b3a3a', '#3a9e9e', '#e6a817', '#64748b', '#ef4444', '#14b8a6', '#a855f7', '#0f766e', '#d97706'];

export default function ContractsPieChart({ machines, templates }) {
  const activeMachines = machines.filter(m => m.service_contract && m.service_contract !== 'none' && (!m.contract_status || m.contract_status === 'active'));
  
  const templateMap = templates.reduce((acc, t) => {
    acc[t.id] = t.name;
    return acc;
  }, {});

  const distribution = {};
  activeMachines.forEach(m => {
    let name = "Okänt avtal";
    if (m.service_agreement_template_id && templateMap[m.service_agreement_template_id]) {
      name = templateMap[m.service_agreement_template_id];
    } else if (m.service_contract === "basic") {
      name = "BAS – Astomed 3.0";
    } else if (m.service_contract && m.service_contract !== "none") {
      name = m.service_contract;
    }
    
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

  return (
    <Card className="astomed-card h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-xs astomed-muted font-medium uppercase tracking-wide">Fördelning av aktiva avtal</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} st`, 'Antal']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}