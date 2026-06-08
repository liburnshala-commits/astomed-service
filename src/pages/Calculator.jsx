import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator as CalcIcon, ArrowRight, AlertTriangle } from "lucide-react";

export default function Calculator() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    machineId: "",
    rent: 15000,
    salary: 35000,
    treatmentsPerWeek: 20,
    pricePerTreatment: 1500,
    isAesthetic: true,
    email: "",
    phone: "",
    municipalityFee: 3000,
    interiorCost: 25000,
    otherStartup: 10000,
    bookingSystem: 799,
    insuranceAndOther: 2000
  });

  useEffect(() => {
    base44.entities.Product.list().then(setProducts).catch(console.error);
  }, []);

  const handleUpdate = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const machines = products.filter(p => p.category === "Ny utrustning" || p.category === "Paket");
  const selectedMachine = machines.find(m => m.id === formData.machineId);

  // Skatter och avgifter
  const vatRate = formData.isAesthetic ? 0.25 : 0;
  const priceExVat = formData.pricePerTreatment / (1 + vatRate);
  const monthlyRevenueExVat = formData.treatmentsPerWeek * 4 * priceExVat;
  
  const socialFees = formData.salary * 0.3142; // Arbetsgivaravgifter ca 31.42%
  const totalSalaryCost = formData.salary + socialFees;
  
  const monthlyCost = formData.rent + totalSalaryCost + formData.bookingSystem + formData.insuranceAndOther + (formData.treatmentsPerWeek * 4 * 100); 
  
  const machinePrice = selectedMachine?.suggested_retail_price || 0;
  const totalStartupCost = machinePrice + formData.municipalityFee + formData.interiorCost + formData.otherStartup;
  
  const monthlyProfitBeforeTax = monthlyRevenueExVat - monthlyCost;
  const corporateTax = monthlyProfitBeforeTax > 0 ? monthlyProfitBeforeTax * 0.206 : 0; // Bolagsskatt 20.6%
  const monthlyProfitAfterTax = monthlyProfitBeforeTax - corporateTax;
  
  const breakEvenMonths = selectedMachine && monthlyProfitAfterTax > 0 ? (totalStartupCost / monthlyProfitAfterTax).toFixed(1) : "N/A";

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-slate-900 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2"><CalcIcon /> Klinikkalkylator</CardTitle>
            <CardDescription className="text-slate-300">Beräkna din investering och väg till lönsamhet</CardDescription>
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
                  <h3 className="font-bold text-xl mb-1">Lagar, Krav {"&"} Uppstartskostnader</h3>
                  <p className="text-slate-500 text-sm">Viktig information och engångskostnader för att starta din klinik.</p>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 text-sm text-amber-900">
                  <div className="flex gap-2 font-semibold items-center text-amber-950">
                    <AlertTriangle className="w-5 h-5" /> Viktigt att veta inför start
                  </div>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Anmälningsplikt:</strong> Yrkesmässig hygienisk verksamhet (t.ex. laser, IPL) kräver en anmälan till kommunens miljö- och hälsoskyddsnämnd, ofta senast 6 veckor innan start.</li>
                    <li><strong>Lagar {"&"} Krav:</strong> Verksamheten lyder under Miljöbalken och Strålsäkerhetsmyndighetens föreskrifter (SSMFS). Egenkontroll, dokumentation och skyddsutrustning är ett krav.</li>
                    <li><strong>Injektionslagen:</strong> Gäller estetiska injektioner. Detta kräver att utföraren är legitimerad läkare, tandläkare eller sjuksköterska.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                   <div className="space-y-2">
                     <Label>Avgift till kommunen (kr)</Label>
                     <Input type="number" value={formData.municipalityFee} onChange={e => handleUpdate("municipalityFee", Number(e.target.value))}/>
                     <p className="text-xs text-slate-500">Engångsavgift för anmälan (ca 2000-5000 kr)</p>
                   </div>
                   <div className="space-y-2">
                     <Label>Behandlingsstol {"&"} Inredning (kr)</Label>
                     <Input type="number" value={formData.interiorCost} onChange={e => handleUpdate("interiorCost", Number(e.target.value))}/>
                     <p className="text-xs text-slate-500">Möbler, brits, belysning etc.</p>
                   </div>
                   <div className="space-y-2">
                     <Label>Övriga uppstartskostnader (kr)</Label>
                     <Input type="number" value={formData.otherStartup} onChange={e => handleUpdate("otherStartup", Number(e.target.value))}/>
                     <p className="text-xs text-slate-500">Bolagsregistrering, företagslogga, etc.</p>
                   </div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>Tillbaka</Button>
                  <Button size="lg" className="flex-1" onClick={() => setStep(3)}>Nästa steg</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Löpande Månadskostnader {"&"} Intäkter</h3>
                  <p className="text-slate-500 text-sm">Fyll i dina förväntade löpande kostnader och priser för att se lönsamheten per månad.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <Label>Momspliktig behandling?</Label>
                     <Select value={formData.isAesthetic ? "yes" : "no"} onValueChange={(v) => handleUpdate("isAesthetic", v === "yes")}>
                       <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="yes">Ja, Estetisk (25% moms)</SelectItem>
                         <SelectItem value="no">Nej, Medicinsk (0% moms)</SelectItem>
                       </SelectContent>
                     </Select>
                     <p className="text-xs text-slate-500">Estetiska behandlingar är i regel momsbelagda.</p>
                   </div>
                   <div className="space-y-2">
                     <Label>Snittpris / behandling (inkl. moms)</Label>
                     <Input type="number" value={formData.pricePerTreatment} onChange={e => handleUpdate("pricePerTreatment", Number(e.target.value))}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Förväntade behandlingar / vecka</Label>
                     <Input type="number" value={formData.treatmentsPerWeek} onChange={e => handleUpdate("treatmentsPerWeek", Number(e.target.value))}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Lön (brutto, kr/mån)</Label>
                     <Input type="number" value={formData.salary} onChange={e => handleUpdate("salary", Number(e.target.value))}/>
                     <p className="text-xs text-slate-500">Sociala avgifter (31,42%) läggs till i kalkylen.</p>
                   </div>
                   <div className="space-y-2">
                     <Label>Hyra (exkl. moms, kr/mån)</Label>
                     <Input type="number" value={formData.rent} onChange={e => handleUpdate("rent", Number(e.target.value))}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Bokningssystem (t.ex. Bokadirekt)</Label>
                     <Input type="number" value={formData.bookingSystem} onChange={e => handleUpdate("bookingSystem", Number(e.target.value))}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Försäkring {"&"} Marknadsföring (kr/mån)</Label>
                     <Input type="number" value={formData.insuranceAndOther} onChange={e => handleUpdate("insuranceAndOther", Number(e.target.value))}/>
                   </div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(2)}>Tillbaka</Button>
                  <Button size="lg" className="flex-1" onClick={() => setStep(4)}>Se resultat</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Ditt Resultat</h3>
                  <p className="text-slate-500 text-sm">Här är en uppskattning baserat på dina siffror.</p>
                </div>
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span className="text-emerald-800">Total uppstartsinvestering:</span>
                    <strong className="text-lg">{Math.round(totalStartupCost).toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-emerald-800 text-sm">Omsättning (exkl. moms):</span>
                    <strong className="text-emerald-800 text-sm">{Math.round(monthlyRevenueExVat).toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-emerald-800 text-sm">Fasta kostnader (inkl. soc. avgifter):</span>
                    <strong className="text-emerald-800 text-sm">- {Math.round(monthlyCost).toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-emerald-800 text-sm">Vinst före skatt:</span>
                    <strong className="text-emerald-800 text-sm">{Math.round(monthlyProfitBeforeTax).toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span className="text-emerald-800 text-sm">Bolagsskatt (20.6%):</span>
                    <strong className="text-emerald-800 text-sm">- {Math.round(corporateTax).toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span className="text-emerald-800 font-semibold">Förväntad vinst efter skatt (per månad):</span>
                    <strong className="text-lg text-emerald-600">{Math.round(monthlyProfitAfterTax).toLocaleString()} kr</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-emerald-800 font-medium">Tid till Break-even:</span>
                    <strong className="text-xl font-bold">{breakEvenMonths} månader</strong>
                  </div>
                  <p className="text-xs text-emerald-700/80 pt-2">
                    * Break-even är beräknat på att hela uppstartsinvesteringen betalas tillbaka via din månatliga vinst efter bolagsskatt.
                  </p>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Label>Ange e-post för att få hela affärsplanen och regelverket som PDF</Label>
                  <Input type="email" placeholder="din.email@bolag.se" value={formData.email} onChange={e => handleUpdate("email", e.target.value)} />
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button variant="outline" size="lg" onClick={() => setStep(3)}>Tillbaka</Button>
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