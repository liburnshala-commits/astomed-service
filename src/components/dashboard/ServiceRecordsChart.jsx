import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, isValid } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function ServiceRecordsChart({ records }) {
  const data = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    const grouped = {};
    records.forEach(r => {
      const dateStr = r.service_date || r.created_date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (!isValid(d)) return;
      
      const monthKey = format(d, 'yyyy-MM');
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          name: format(d, 'MMM yyyy', { locale: sv }),
          sortKey: monthKey,
          standard: 0,
          advanced: 0,
        };
      }
      
      if (r.service_type === 'advanced') {
        grouped[monthKey].advanced += 1;
      } else {
        grouped[monthKey].standard += 1;
      }
    });

    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [records]);

  return (
    <Card className="astomed-card h-full">
      <CardHeader>
        <CardTitle>Serviceärenden per månad</CardTitle>
        <CardDescription>Fördelning mellan standard- och avancerad service</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Ingen data tillgänglig
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="standard" name="Standard" stackId="a" fill="#1b3a3a" />
                <Bar dataKey="advanced" name="Avancerad" stackId="a" fill="#e6a817" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}