import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator as CalcIcon, ArrowRight } from "lucide-react";

export default function Calculator() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    machineId: "",
    rent: 15000,
    salary: 35000,
    treatmentsPerWeek: 20,
    pricePerTreatment: 1500,
    email: "",
    phone: ""
  });

  useEffect(() => {
    base44.entities.Product.list().then(setProducts).catch(console.error);
  }, []);

  const handleUpdate = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const machines = products.filter(p => p.category === "Ny utrustning" || p.category === "Paket");
  const selectedMachine = machines.find(m => m.id === formData.machineId);

  const weeklyRevenue = formData.treatmentsPerWeek * formData.pricePerTreatment;
  const monthlyRevenue = weeklyRevenue * 4;
  const monthlyCost = formData.rent + formData.salary + (formData.treatmentsPerWeek * 4 * 100); 
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const breakEvenMonths = selectedMachine && monthlyProfit > 0 ? (selectedMachine.suggested_retail_price / monthlyProfit).toFixed(1) : "N/A";

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-slate-900 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2"><CalcIcon /> Klinikkalkylator</CardTitle>
            <CardDescription className="text-slate-300">Beräkna din väg till lönsamhet</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Vad vill du arbeta med?</h3>
                  <p className="text-slate-500 text-sm">Börja med att välja vilken maskin du är intresserad av att investera i.</p>
                </div>
                <div className="space-y-3">
                  <Label>Välj utrustning</Label>
                  <Select value={formData.machineId} onValueChange={(v) => handleUpdate("machineId", v)}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Välj maskin..." /></SelectTrigger>
                    <SelectContent>
                      {machines.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.suggested_retail_price?.toLocaleString()} kr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4">
                  <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep(2)} disabled={!formData.machineId}>
                    Nästa steg <ArrowRight className="ml-2 w-4 h-4"/>
                  </Button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Månadskostnader {"&"} Intäkter</h3>
                  <p className="text-slate-500 text-sm">Fyll i dina förväntade kostnader och priser för att se lönsamheten.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <Label>Hyra (kr/mån)</Label>
                     <Input type="number" value={formData.rent} onChange={e => handleUpdate("rent", Number(e.target.value))}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Lön (kr/mån)</Label>
                     <Input type="number" value={formData.salary} onChange={e => handleUpdate("salary", Number(e.target.value))}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Behandlingar / vecka</Label>
                     <Input type="number" value={formData.treatmentsPerWeek} onChange={e => handleUpdate("treatmentsPerWeek", Number(e.target.value))}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Pris / behandling (kr)</Label>
                     <Input type="number" value={formData.pricePerTreatment} onChange={e => handleUpdate("pricePerTreatment", Number(e.target.value))}/>
                   </div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>Tillbaka</Button>
                  <Button size="lg" className="flex-1" onClick={() => setStep(3)}>Se resultat</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Ditt Resultat</h3>
                  <p className="text-slate-500 text-sm">Här är en uppskattning baserat på dina siffror.</p>
                </div>
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span className="text-emerald-800">Investering ({selectedMachine?.name}):</span>
                    <strong className="text-lg">{selectedMachine?.suggested_retail_price?.toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span className="text-emerald-800">Förväntad vinst per månad:</span>
                    <strong className="text-lg text-emerald-600">{monthlyProfit.toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-800 font-medium">Tid till Break-even:</span>
                    <strong className="text-xl font-bold">{breakEvenMonths} månader</strong>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Label>Ange e-post för att få en fullständig kalkyl som PDF</Label>
                  <Input type="email" placeholder="din.email@bolag.se" value={formData.email} onChange={e => handleUpdate("email", e.target.value)} />
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button variant="outline" size="lg" onClick={() => setStep(2)}>Tillbaka</Button>
                    <Button size="lg" className="flex-1" onClick={() => alert("Funktion för att generera och skicka PDF kommer i nästa steg!")}>Skicka analys</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}