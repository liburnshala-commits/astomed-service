import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, ExternalLink, Calendar, CheckCircle, Mail, Phone, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClinicCalculations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: calculations, isLoading } = useQuery({
    queryKey: ['ClinicCalculations'],
    queryFn: () => base44.entities.ClinicCalculation.list('-created_date', 100),
    initialData: []
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ClinicCalculation.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ClinicCalculations'] });
      toast({ title: "Status uppdaterad" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClinicCalculation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ClinicCalculations'] });
      toast({ title: "Kalkylen har raderats" });
    }
  });

  const filtered = calculations.filter(c => filterStatus === "all" || c.status === filterStatus);

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">Ny</Badge>;
      case 'contacted': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">Kontaktad</Badge>;
      case 'closed': return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">Avslutad</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Klinikberäkningar
          </h1>
          <p className="text-slate-500 mt-1">
            Leads och kalkyler skapade via klinikkalkylatorn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              <SelectItem value="new">Nya</SelectItem>
              <SelectItem value="contacted">Kontaktade</SelectItem>
              <SelectItem value="closed">Avslutade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(calc => (
          <Card key={calc.id} className="astomed-card overflow-hidden flex flex-col">
            <div className="h-1.5 w-full bg-primary/20" />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{calc.company_name}</CardTitle>
                  <CardDescription className="text-sm mt-1">{calc.contact_person}</CardDescription>
                </div>
                {getStatusBadge(calc.status)}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(calc.created_date), "d MMM yyyy 'kl' HH:mm", { locale: sv })}
              </div>
            </CardHeader>
            <CardContent className="pb-4 flex-1 space-y-4">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${calc.email}`} className="text-primary hover:underline truncate">{calc.email}</a>
                </div>
                {calc.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${calc.phone}`} className="text-slate-700 hover:underline">{calc.phone}</a>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Vald Utrustning</div>
                <div className="text-sm font-medium text-slate-800 line-clamp-2">{calc.machines}</div>
                
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Vinst / Mån</div>
                    <div className="font-semibold text-primary">{Math.round(calc.monthly_profit).toLocaleString()} kr</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Break-even</div>
                    <div className="font-semibold text-slate-700">{calc.break_even_months} mån</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">ROI (12 mån)</div>
                    <div className="font-semibold text-slate-700">{calc.roi_12_months}%</div>
                  </div>
                  {calc.pdf_url && (
                    <div className="flex items-end">
                      <a 
                        href={calc.pdf_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Se PDF-kalkyl
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <div className="p-3 bg-slate-50 border-t flex flex-wrap gap-2 justify-between mt-auto">
              <div className="flex gap-2">
                <Select 
                  value={calc.status} 
                  onValueChange={(val) => updateStatusMutation.mutate({ id: calc.id, status: val })}
                >
                  <SelectTrigger className="h-8 text-xs w-[130px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" className="text-xs">Markera som Ny</SelectItem>
                    <SelectItem value="contacted" className="text-xs">Markera Kontaktad</SelectItem>
                    <SelectItem value="closed" className="text-xs">Markera Avslutad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm("Är du säker på att du vill radera denna kalkyl?")) {
                    deleteMutation.mutate(calc.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Inga klinikberäkningar hittades.</p>
          </div>
        )}
      </div>
    </div>
  );
}