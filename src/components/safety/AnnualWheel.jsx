import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, CalendarDays, ArrowRight } from "lucide-react";
import { differenceInDays, addYears, format } from "date-fns";

export default function AnnualWheel({ audits, locationChecks, measurements, personnel }) {
  const getLatestDate = (items, dateField) => {
    if (!items || items.length === 0) return null;
    const validItems = items.filter(item => item[dateField] || item.created_date);
    if (validItems.length === 0) return null;
    const dates = validItems.map(item => new Date(item[dateField] || item.created_date).getTime());
    return new Date(Math.max(...dates));
  };

  const getStatus = (lastDate) => {
    if (!lastDate) return { status: 'missing', label: 'Åtgärd krävs', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle };
    
    const nextDeadline = addYears(lastDate, 1);
    const daysLeft = differenceInDays(nextDeadline, new Date());

    if (daysLeft < 0) return { status: 'overdue', label: 'Försenad', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', days: Math.abs(daysLeft), icon: AlertCircle };
    if (daysLeft <= 30) return { status: 'warning', label: 'Snart dags', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', days: daysLeft, icon: Clock };
    return { status: 'ok', label: 'Klar', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', days: daysLeft, icon: CheckCircle2 };
  };

  const tasks = [
    { title: "Årlig Internrevision", date: getLatestDate(audits, "audit_date") },
    { title: "Säkerhetskontroll Lokal", date: getLatestDate(locationChecks, "check_date") },
    { title: "Mätrapporter", date: getLatestDate(measurements, "measurement_date") },
    { title: "Strålskyddsutbildning", date: getLatestDate(personnel, "training_date") },
  ];

  return (
    <Card className="mb-8 border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          Klinikens Årshjul
        </CardTitle>
        <CardDescription>
          Följ upp era årliga strålsäkerhetsuppgifter för att alltid vara inspektionsredo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tasks.map((task, idx) => {
            const statusInfo = getStatus(task.date);
            const Icon = statusInfo.icon;
            return (
              <div key={idx} className={`p-4 rounded-xl border ${statusInfo.border} ${statusInfo.bg} flex flex-col items-center text-center transition-all hover:shadow-md`}>
                <div className={`p-3 rounded-full bg-white mb-3 shadow-sm ${statusInfo.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{task.title}</h3>
                
                {task.date ? (
                  <div className="text-sm text-slate-600 mb-3">
                    Senast: {format(task.date, 'yyyy-MM-dd')}
                    <div className="mt-1 font-medium flex items-center justify-center gap-1">
                      <ArrowRight className="w-3 h-3" /> 
                      Nästa: {format(addYears(task.date, 1), 'yyyy-MM-dd')}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 mb-3">Ingen historik</div>
                )}

                <div className={`mt-auto inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white ${statusInfo.color} shadow-sm border ${statusInfo.border}`}>
                  {statusInfo.label}
                  {statusInfo.days !== undefined && statusInfo.status !== 'ok' ? ` (${statusInfo.days} d)` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}