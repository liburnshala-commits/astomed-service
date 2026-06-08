import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator as CalcIcon, ArrowRight, AlertTriangle } from "lucide-react";

export default function Calculator() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    machineId: "",
    trainingIds: [],
    rent: 15000,
    salary: 35000,
    treatmentsPerWeek: 20,
    pricePerTreatment: 1500,
    isAesthetic: true,
    fullName: "",
    company: "",
    email: "",
    phone: "",
    municipalityFee: 3000,
    interiorCost: 25000,
    otherStartup: 10000,
    bookingSystem: 799,
    insuranceAndOther: 2000
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.Product.list().then(setProducts).catch(console.error);
  }, []);

  const handleUpdate = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const machines = products.filter(p => p.category === "Ny utrustning");
  const trainings = products.filter(p => p.category === "Utbildning");
  const selectedMachine = machines.find(m => m.id === formData.machineId);

  const selectedTrainings = trainings.filter(t => formData.trainingIds.includes(t.id));
  const trainingCost = selectedTrainings.reduce((sum, t) => sum + (t.suggested_retail_price || 0), 0);

  // Skatter och avgifter
  const vatRate = formData.isAesthetic ? 0.25 : 0;
  const priceExVat = formData.pricePerTreatment / (1 + vatRate);
  const monthlyRevenueExVat = formData.treatmentsPerWeek * 4 * priceExVat;
  
  const socialFees = formData.salary * 0.3142; // Arbetsgivaravgifter ca 31.42%
  const totalSalaryCost = formData.salary + socialFees;
  
  const monthlyCost = formData.rent + totalSalaryCost + formData.bookingSystem + formData.insuranceAndOther + (formData.treatmentsPerWeek * 4 * 100); 
  
  const machinePrice = selectedMachine?.suggested_retail_price || 0;
  const totalStartupCost = machinePrice + trainingCost + formData.municipalityFee + formData.interiorCost + formData.otherStartup;
  
  const monthlyProfitBeforeTax = monthlyRevenueExVat - monthlyCost;
  const corporateTax = monthlyProfitBeforeTax > 0 ? monthlyProfitBeforeTax * 0.206 : 0; // Bolagsskatt 20.6%
  const monthlyProfitAfterTax = monthlyProfitBeforeTax - corporateTax;
  
  // 6 & 12 month projection
  const revenue6Months = monthlyRevenueExVat * 6;
  const cost6Months = monthlyCost * 6;
  const profit6Months = monthlyProfitAfterTax * 6;

  const revenue12Months = monthlyRevenueExVat * 12;
  const cost12Months = monthlyCost * 12;
  const profit12Months = monthlyProfitAfterTax * 12;
  
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

                {trainings.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>Välj utbildningar (Frivilligt)</Label>
                    <div className="space-y-2">
                      {trainings.map(t => (
                        <div key={t.id} className="flex items-center space-x-2 bg-white p-3 rounded-lg border">
                          <Checkbox 
                            id={`training-${t.id}`}
                            checked={formData.trainingIds.includes(t.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleUpdate("trainingIds", [...formData.trainingIds, t.id]);
                              } else {
                                handleUpdate("trainingIds", formData.trainingIds.filter(id => id !== t.id));
                              }
                            }}
                          />
                          <Label htmlFor={`training-${t.id}`} className="flex-1 cursor-pointer font-normal">
                            {t.name}
                          </Label>
                          <span className="text-sm font-semibold">{t.suggested_retail_price?.toLocaleString()} kr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                  <Button size="lg" className="flex-1" onClick={() => setStep(4)}>Gå vidare</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Dina Kontaktuppgifter</h3>
                  <p className="text-slate-500 text-sm">Fyll i dina uppgifter för att se kalkylen och få en komplett affärsplan skickad till din e-post.</p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <Label>För- och Efternamn *</Label>
                     <Input placeholder="Anna Andersson" value={formData.fullName} onChange={e => handleUpdate("fullName", e.target.value)}/>
                   </div>
                   <div className="space-y-2">
                     <Label>E-postadress *</Label>
                     <Input type="email" placeholder="anna@kliniken.se" value={formData.email} onChange={e => handleUpdate("email", e.target.value)}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Telefonnummer *</Label>
                     <Input type="tel" placeholder="070-123 45 67" value={formData.phone} onChange={e => handleUpdate("phone", e.target.value)}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Företagsnamn (Frivilligt)</Label>
                     <Input placeholder="Min Klinik AB" value={formData.company} onChange={e => handleUpdate("company", e.target.value)}/>
                   </div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(3)} disabled={isSubmitting}>Tillbaka</Button>
                  <Button 
                    size="lg" 
                    className="flex-1" 
                    disabled={!formData.fullName || !formData.email || !formData.phone || isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await base44.functions.invoke("sendClinicBusinessPlan", { 
                          formData, 
                          calculated: {
                            monthlyProfitAfterTax,
                            breakEvenMonths,
                            totalStartupCost,
                            machinePrice,
                            trainingCost,
                            monthlyRevenueExVat,
                            monthlyCost,
                            corporateTax,
                            revenue6Months,
                            cost6Months,
                            profit6Months,
                            revenue12Months,
                            cost12Months,
                            profit12Months
                          },
                          machineName: selectedMachine?.name 
                        });
                        setStep(5);
                      } catch (err) {
                        console.error(err);
                        alert("Ett fel uppstod när planen skulle skickas, men du kan fortfarande se resultatet.");
                        setStep(5);
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    {isSubmitting ? "Skapar affärsplan..." : "Se Resultat & Skicka Affärsplan"}
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Ditt Resultat</h3>
                  <p className="text-slate-500 text-sm">Här är en uppskattning baserat på dina siffror. En komplett affärsplan har skickats till din e-post!</p>
                </div>
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span className="text-emerald-800">Total uppstartsinvestering:</span>
                    <strong className="text-lg">{Math.round(totalStartupCost).toLocaleString()} kr</strong>
                  </div>
                  {trainingCost > 0 && (
                    <div className="flex justify-between items-center pb-2 text-emerald-700/70">
                      <span className="text-xs">Varav utbildning:</span>
                      <span className="text-xs">{Math.round(trainingCost).toLocaleString()} kr</span>
                    </div>
                  )}
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
                  <div className="pt-4 pb-2">
                    <h4 className="font-bold text-emerald-900 mb-3 border-b border-emerald-200/50 pb-2">Affärsplan Prognos (6 &amp; 12 månader)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/50 p-4 rounded-lg border border-emerald-100 shadow-sm">
                        <div className="text-emerald-800 font-semibold mb-2">6 Månader</div>
                        <div className="text-sm flex justify-between mb-1"><span>Omsättning:</span> <span>{Math.round(revenue6Months).toLocaleString()} kr</span></div>
                        <div className="text-sm flex justify-between mb-1"><span>Kostnader:</span> <span>-{Math.round(cost6Months).toLocaleString()} kr</span></div>
                        <div className="text-sm flex justify-between text-emerald-600 font-bold mt-2 border-t border-emerald-100 pt-2"><span>Vinst (efter skatt):</span> <span>{Math.round(profit6Months).toLocaleString()} kr</span></div>
                      </div>
                      <div className="bg-white/50 p-4 rounded-lg border border-emerald-100 shadow-sm">
                        <div className="text-emerald-800 font-semibold mb-2">12 Månader</div>
                        <div className="text-sm flex justify-between mb-1"><span>Omsättning:</span> <span>{Math.round(revenue12Months).toLocaleString()} kr</span></div>
                        <div className="text-sm flex justify-between mb-1"><span>Kostnader:</span> <span>-{Math.round(cost12Months).toLocaleString()} kr</span></div>
                        <div className="text-sm flex justify-between text-emerald-600 font-bold mt-2 border-t border-emerald-100 pt-2"><span>Vinst (efter skatt):</span> <span>{Math.round(profit12Months).toLocaleString()} kr</span></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700/80 pt-2">
                    * Break-even är beräknat på att hela uppstartsinvesteringen betalas tillbaka via din månatliga vinst efter bolagsskatt.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Button variant="outline" size="lg" onClick={() => setStep(4)}>Tillbaka till uppgifter</Button>
                  <Button size="lg" className="flex-1" onClick={() => { setStep(1); setFormData({...formData, fullName: "", email: "", phone: "", company: ""}); }}>Gör en ny beräkning</Button>
                </div>
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}