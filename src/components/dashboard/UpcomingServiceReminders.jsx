import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Bell, Mail, Monitor, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UpcomingServiceReminders({ machines, customers }) {
  const [sending, setSending] = useState({});
  const [sent, setSent] = useState({});

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const upcomingMachines = machines.filter(m => {
    if (!m.next_service_date) return false;
    const nextService = new Date(m.next_service_date);
    return nextService >= today && nextService <= thirtyDaysFromNow;
  }).sort((a, b) => new Date(a.next_service_date) - new Date(b.next_service_date));

  const handleSendReminder = async (machine) => {
    const customer = customers.find(c => c.id === machine.customer_id);
    if (!customer?.email) {
      toast.error("Kunden saknar e-postadress");
      return;
    }

    setSending(prev => ({ ...prev, [machine.id]: true }));
    try {
      const res = await base44.functions.invoke("sendManualServiceReminder", { machine_id: machine.id });
      if (res.data.error) throw new Error(res.data.error);
      
      setSent(prev => ({ ...prev, [machine.id]: true }));
      toast.success(`Påminnelse skickad till ${customer.email}`);
    } catch (error) {
      const isEmailRestriction = error.message?.includes("500") || error.message?.includes("outside the app") || error.message?.includes("Only registered app users");
      if (isEmailRestriction) {
        toast.error("I testläget kan e-post endast skickas till registrerade användare. Lägg till dig själv som kund för att testa.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setSending(prev => ({ ...prev, [machine.id]: false }));
    }
  };

  return (
    <Card className="astomed-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm astomed-muted font-medium flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" /> Kommande service (inom 30 dagar)
          <Badge className="ml-auto bg-amber-100 text-amber-800 border-0 hover:bg-amber-100">{upcomingMachines.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[300px]">
        {upcomingMachines.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm flex flex-col items-center justify-center min-h-[200px]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 opacity-50" />
            Inga maskiner har service planerad de närmaste 30 dagarna.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcomingMachines.map(machine => {
              const customer = customers.find(c => c.id === machine.customer_id);
              const daysLeft = Math.ceil((new Date(machine.next_service_date) - today) / (1000 * 60 * 60 * 24));
              const isSent = sent[machine.id];
              const isSending = sending[machine.id];

              return (
                <li key={machine.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Monitor className="w-3.5 h-3.5 text-slate-400" />
                        <Link to={createPageUrl(`Machines?search=${machine.serial_number}`)} className="font-semibold text-slate-800 text-sm truncate hover:text-[#3a9e9e] hover:underline">
                          {machine.model} <span className="font-mono text-xs text-slate-400 font-normal">({machine.serial_number})</span>
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600 truncate">{customer?.company_name || 'Okänd kund'}</span>
                        {customer?.email && <Mail className="w-3 h-3 text-slate-300 ml-1" />}
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${daysLeft <= 14 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {daysLeft <= 0 ? 'Idag eller passerad' : `Om ${daysLeft} dagar`} ({format(new Date(machine.next_service_date), "d MMM", { locale: sv })})
                      </Badge>
                    </div>
                    <div className="flex-shrink-0">
                      {isSent ? (
                         <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50 bg-emerald-50 pointer-events-none h-8 text-xs">
                           <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Skickad
                         </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs" 
                          onClick={() => handleSendReminder(machine)}
                          disabled={isSending || !customer?.email}
                          title={!customer?.email ? "Kunden saknar e-post" : "Skicka påminnelse via e-post"}
                        >
                          <Mail className={`w-3.5 h-3.5 ${customer?.email ? 'mr-1' : ''}`} /> 
                          {customer?.email && (isSending ? 'Skickar...' : 'Påminn')}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}