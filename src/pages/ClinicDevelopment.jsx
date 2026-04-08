import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Monitor, Wrench, Calculator, ChevronRight, PackageOpen, ArrowRightCircle, Gift, CheckCircle2, ExternalLink, BookOpen, Target } from "lucide-react";
import ClinicAnalyzer from "@/components/clinic/ClinicAnalyzer";
import { format, differenceInYears, differenceInMonths } from "date-fns";

export default function ClinicDevelopment() {
  const [customer, setCustomer] = useState(null);
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculator state
  const [treatmentsPerWeek, setTreatmentsPerWeek] = useState(15);
  const [pricePerTreatment, setPricePerTreatment] = useState(1500);
  const [costPerTreatment, setCostPerTreatment] = useState(200);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [showAnalyzer, setShowAnalyzer] = useState(true);
  const [pastAnalyses, setPastAnalyses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        let custId = null;
        if (currentUser.role === 'customer') {
            const ownCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
            if (ownCustomers.length > 0) {
                setCustomer(ownCustomers[0]);
                custId = ownCustomers[0].id;
            }
        } else {
            // For testing/admin, just grab the first customer or a specific one
            const allCustomers = await base44.entities.Customer.list();
            if (allCustomers.length > 0) {
                setCustomer(allCustomers[0]);
                custId = allCustomers[0].id;
            }
        }

        if (custId) {
            const customerMachines = await base44.entities.Machine.filter({ customer_id: custId });
            setMachines(customerMachines);
            
            const analyses = await base44.entities.ClinicAnalysis.filter({ customer_id: custId }, "-created_date");
            setPastAnalyses(analyses);
            if (analyses.length > 0) {
                setAnalysisData({
                    focusAreas: analyses[0].focus_areas || [],
                    goal: analyses[0].goal || "",
                    investment: analyses[0].investment || ""
                });
                setShowAnalyzer(false);
            }
        }
        
        const allProducts = await base44.entities.Product.list();
        setProducts(allProducts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateAge = (installationDate) => {
    if (!installationDate) return { years: 0, months: 0, text: "Okänd ålder" };
    const date = new Date(installationDate);
    const years = differenceInYears(new Date(), date);
    const months = differenceInMonths(new Date(), date) % 12;
    return { years, months, text: `${years} år, ${months} månader` };
  };

  const getMachineHealthStatus = (ageYears) => {
    if (ageYears >= 5) return { label: "Hög ålder", color: "bg-red-100 text-red-800 border-red-200" };
    if (ageYears >= 3) return { label: "Dags att överväga byte", color: "bg-amber-100 text-amber-800 border-amber-200" };
    return { label: "Gott skick", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  };

  const getRecommendations = (machine) => {
    const age = calculateAge(machine.installation_date);
    
    const relatedProducts = products.filter(p => 
      p.related_machine_models?.includes(machine.model) || 
      p.related_machine_models?.includes("Alla")
    );

    const upgrades = products.filter(p => 
        p.category === "Ny utrustning" && 
        (p.related_machine_models?.includes(machine.model) || p.related_machine_models?.length === 0) &&
        (p.min_machine_age_for_upgrade_years ? age.years >= p.min_machine_age_for_upgrade_years : true)
    );

    const accessories = relatedProducts.filter(p => p.category === "Kringprodukt" || p.category === "Skönhetsprodukt");

    // If analysis data exists, we boost packages that match their focus areas
    let packages = products.filter(p => p.category === "Paket" && (p.related_machine_models?.includes(machine.model) || p.related_machine_models?.includes("Alla") || !p.related_machine_models || p.related_machine_models.length === 0));

    if (analysisData) {
        packages = packages.sort((a, b) => {
            const aMatch = analysisData.focusAreas.some(f => a.name.toLowerCase().includes(f.toLowerCase().split(' ')[0]) || a.description?.toLowerCase().includes(f.toLowerCase().split(' ')[0]));
            const bMatch = analysisData.focusAreas.some(f => b.name.toLowerCase().includes(f.toLowerCase().split(' ')[0]) || b.description?.toLowerCase().includes(f.toLowerCase().split(' ')[0]));
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }

    return { upgrades, accessories, packages, age };
  };

  const renderCalculator = () => {
    const weeklyProfit = (pricePerTreatment - costPerTreatment) * treatmentsPerWeek;
    const yearlyProfit = weeklyProfit * 48; // Assuming 48 working weeks
    
    let investmentCost = 0;
    let paybackMonths = 0;

    if (selectedUpgrade) {
        const tradeInValue = selectedUpgrade.estimated_trade_in_value_multiplier ? (selectedUpgrade.suggested_retail_price * 0.2) : 0; // Mock calculation
        investmentCost = selectedUpgrade.suggested_retail_price - tradeInValue;
        paybackMonths = investmentCost > 0 && yearlyProfit > 0 ? (investmentCost / (yearlyProfit / 12)) : 0;
    }

    return (
        <Card className="border-emerald-200 shadow-md bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2 text-emerald-800">
                    <Calculator className="w-5 h-5" /> Investeringskalkylator
                </CardTitle>
                <CardDescription>Beräkna täckningsbidrag och återbetalningstid för ny utrustning.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Behandlingar per vecka</Label>
                        <Input type="number" value={treatmentsPerWeek} onChange={e => setTreatmentsPerWeek(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Snittpris per behandling (kr)</Label>
                        <Input type="number" value={pricePerTreatment} onChange={e => setPricePerTreatment(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Materialkostnad / behandling (kr)</Label>
                        <Input type="number" value={costPerTreatment} onChange={e => setCostPerTreatment(Number(e.target.value))} />
                    </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Vinst per behandling</p>
                            <p className="text-xl font-bold text-slate-800">{pricePerTreatment - costPerTreatment} kr</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Vinst per vecka</p>
                            <p className="text-xl font-bold text-slate-800">{weeklyProfit.toLocaleString()} kr</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-slate-500 mb-1">Potentiellt årligt täckningsbidrag</p>
                            <p className="text-2xl font-bold text-emerald-600">{yearlyProfit.toLocaleString()} kr</p>
                        </div>
                    </div>
                </div>

                {selectedUpgrade && (
                    <div className="p-4 bg-emerald-800 text-white rounded-xl shadow-inner relative overflow-hidden">
                        <Sparkles className="absolute top-2 right-2 w-16 h-16 text-emerald-700 opacity-50" />
                        <h4 className="font-semibold mb-3">Investering: {selectedUpgrade.name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-emerald-200">Pris ny maskin:</p>
                                <p className="font-medium">{selectedUpgrade.suggested_retail_price?.toLocaleString()} kr</p>
                            </div>
                            <div>
                                <p className="text-emerald-200">Uppskattat inbyte:</p>
                                <p className="font-medium">-{(selectedUpgrade.suggested_retail_price * 0.2).toLocaleString()} kr</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-emerald-700/50 flex justify-between items-end">
                                <div>
                                    <p className="text-emerald-200">Nettokostnad:</p>
                                    <p className="text-xl font-bold">{investmentCost.toLocaleString()} kr</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-200">Återbetalningstid:</p>
                                    <p className="text-xl font-bold text-emerald-300">{paybackMonths.toFixed(1)} månader</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Analyserar klinikens potential...</div>;
  if (!customer) return <div className="p-8 text-center text-slate-500">Ingen kundprofil hittades.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
                Klinikutveckling & Affärsmöjligheter
            </h1>
            <p className="text-slate-300 max-w-2xl text-lg mb-4">
                Välkommen till din tillväxtportal, {customer.company_name}. Här analyserar vi din maskinpark och föreslår nästa steg för att maximera din lönsamhet och behandlingskvalitet.
            </p>
            <div className="flex items-start md:items-center gap-3 text-emerald-300 bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/50 w-fit">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5 md:mt-0" />
                <p className="text-sm leading-snug">Våra rekommendationer och investeringskalkylatorn är direktkopplade till Astomeds mest aktuella erbjudanden och utbildningar, anpassade för just er verksamhet.</p>
            </div>
        </div>
        {!showAnalyzer && (
            <Button variant="outline" className="relative z-10 bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setShowAnalyzer(true)}>
                <Target className="w-4 h-4 mr-2" /> Gör om klinikanalys
            </Button>
        )}
        <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-white/5" />
      </div>

      {showAnalyzer ? (
          <ClinicAnalyzer onComplete={async (data) => {
              if (customer) {
                  const saved = await base44.entities.ClinicAnalysis.create({
                      customer_id: customer.id,
                      focus_areas: data.focusAreas,
                      goal: data.goal,
                      investment: data.investment
                  });
                  setPastAnalyses(prev => [saved, ...prev]);
              }
              setAnalysisData(data);
              setShowAnalyzer(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
      ) : machines.length === 0 ? (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-slate-500 mb-4">Vi hittade inga registrerade maskiner, men baserat på din analys rekommenderar vi följande paket:</p>
                </CardContent>
            </Card>
            {analysisData && products.filter(p => p.category === "Paket").length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.filter(p => p.category === "Paket").map(pkg => {
                        const isAiRecommended = analysisData.focusAreas.some(f => 
                            pkg.name.toLowerCase().includes(f.toLowerCase().split(' ')[0]) || 
                            pkg.description?.toLowerCase().includes(f.toLowerCase().split(' ')[0])
                        );
                        return (
                            <Card key={pkg.id} className={`bg-purple-50/50 border-purple-100 shadow-sm transition-all ${isAiRecommended ? 'ring-2 ring-purple-400 scale-[1.02]' : ''}`}>
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex gap-2 mb-3">
                                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-0 w-fit">Paketerbjudande</Badge>
                                        {isAiRecommended && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 w-fit"><Sparkles className="w-3 h-3 mr-1"/> AI Match</Badge>}
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">{pkg.name}</h4>
                                    <p className="text-sm text-slate-600 mb-4 flex-grow">{pkg.description}</p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-purple-100">
                                        <span className="font-bold text-slate-900">{pkg.suggested_retail_price?.toLocaleString()} kr</span>
                                        {pkg.education_url && (
                                            <Button variant="outline" size="sm" asChild className="text-purple-700 border-purple-200 hover:bg-purple-100">
                                                <a href={pkg.education_url} target="_blank" rel="noreferrer">Läs mer <ExternalLink className="w-3.5 h-3.5 ml-1"/></a>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
      ) : (
        <Tabs defaultValue={machines[0]?.id} className="w-full">
            <TabsList className="w-full flex justify-start overflow-x-auto bg-slate-100/50 p-1 rounded-xl mb-6">
                {machines.map(m => (
                    <TabsTrigger key={m.id} value={m.id} className="flex gap-2 items-center rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Monitor className="w-4 h-4" /> {m.model}
                    </TabsTrigger>
                ))}
            </TabsList>

            {machines.map(machine => {
                const { upgrades, accessories, packages, age } = getRecommendations(machine);
                const health = getMachineHealthStatus(age.years);

                return (
                    <TabsContent key={machine.id} value={machine.id} className="space-y-6 mt-0">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Machine Status Card */}
                            <Card className="md:col-span-1 border-slate-200 shadow-sm">
                                <CardHeader className="bg-slate-50/50 pb-4 border-b">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{machine.model}</CardTitle>
                                            <CardDescription>SN: {machine.serial_number}</CardDescription>
                                        </div>
                                        <Badge variant="outline" className={health.color}>{health.label}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Uppskattad ålder</p>
                                        <p className="font-medium text-slate-800">{age.text}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Senaste service</p>
                                        <p className="font-medium text-slate-800">{machine.service_date ? format(new Date(machine.service_date), 'yyyy-MM-dd') : 'Ingen data'}</p>
                                    </div>
                                    
                                    {age.years >= 3 && (
                                        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex items-start gap-2 mt-4">
                                            <Wrench className="w-4 h-4 mt-0.5 shrink-0" />
                                            <p>Med en maskin äldre än 3 år kan underhållskostnaderna börja öka. Ett inbyte kan vara ekonomiskt fördelaktigt.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recommendations Space */}
                            <div className="md:col-span-2 space-y-6">
                                
                                {upgrades.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-amber-500" /> Rekommenderade Uppgraderingar
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {upgrades.map(upgrade => (
                                                <Card key={upgrade.id} className={`border-2 transition-all cursor-pointer ${selectedUpgrade?.id === upgrade.id ? 'border-emerald-500 shadow-md' : 'border-amber-100 hover:border-amber-300'}`} onClick={() => setSelectedUpgrade(upgrade)}>
                                                    <CardContent className="p-5">
                                                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 mb-3 border-0">Nästa generation</Badge>
                                                        <h4 className="font-bold text-slate-900 text-lg mb-1">{upgrade.name}</h4>
                                                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{upgrade.benefits || upgrade.description}</p>
                                                        
                                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                                            <span className="font-bold text-slate-900">{upgrade.suggested_retail_price?.toLocaleString()} kr</span>
                                                            <div className="flex gap-2">
                                                              {upgrade.education_url && (
                                                                  <Button variant="outline" size="icon" asChild className="h-8 w-8 text-slate-500">
                                                                      <a href={upgrade.education_url} target="_blank" rel="noreferrer" title="Läs mer / Utbildning"><BookOpen className="w-4 h-4"/></a>
                                                                  </Button>
                                                              )}
                                                              <Button variant={selectedUpgrade?.id === upgrade.id ? "default" : "ghost"} size="sm" className={selectedUpgrade?.id === upgrade.id ? "bg-emerald-600 hover:bg-emerald-700" : "text-emerald-600"}>
                                                                  Räkna på ROI <ChevronRight className="w-4 h-4 ml-1" />
                                                              </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-4">
                                        <PackageOpen className="w-5 h-5 text-blue-500" /> Kringprodukter & Merförsäljning
                                    </h3>
                                    {accessories.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {accessories.map(acc => (
                                                <Card key={acc.id} className="bg-white">
                                                    <CardContent className="p-4 flex gap-4 items-center">
                                                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                            <Sparkles className="w-6 h-6 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900">{acc.name}</h4>
                                                            <p className="text-xs text-slate-500 line-clamp-1">{acc.benefits}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                              <p className="text-sm font-bold text-blue-600">{acc.suggested_retail_price?.toLocaleString()} kr</p>
                                                              {acc.education_url && (
                                                                  <a href={acc.education_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center">
                                                                      Utbildning <ExternalLink className="w-3 h-3 ml-0.5"/>
                                                                  </a>
                                                              )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card className="bg-slate-50 border-dashed">
                                            <CardContent className="p-6 text-center text-slate-500 text-sm">
                                                Inga specifika kringprodukter inlagda för denna modell ännu.
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {packages?.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-4">
                                            <Gift className="w-5 h-5 text-purple-500" /> Skräddarsydda Paket
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {packages.map(pkg => {
                                                const isAiRecommended = analysisData && analysisData.focusAreas.some(f => 
                                                    pkg.name.toLowerCase().includes(f.toLowerCase().split(' ')[0]) || 
                                                    pkg.description?.toLowerCase().includes(f.toLowerCase().split(' ')[0])
                                                );
                                                return (
                                                <Card key={pkg.id} className={`bg-purple-50/50 border-purple-100 shadow-sm transition-all ${isAiRecommended ? 'ring-2 ring-purple-400 scale-[1.02]' : ''}`}>
                                                    <CardContent className="p-5 flex flex-col h-full">
                                                        <div className="flex gap-2 mb-3">
                                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-0 w-fit">Paketerbjudande</Badge>
                                                            {isAiRecommended && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 w-fit"><Sparkles className="w-3 h-3 mr-1"/> AI Match</Badge>}
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 text-lg mb-1">{pkg.name}</h4>
                                                        <p className="text-sm text-slate-600 mb-4 flex-grow">{pkg.description}</p>
                                                        {pkg.package_items?.length > 0 && (
                                                            <ul className="text-sm text-slate-700 space-y-1 mb-4">
                                                                {pkg.package_items.map((item, i) => <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5"/> <span className="leading-tight">{item}</span></li>)}
                                                            </ul>
                                                        )}
                                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-purple-100">
                                                            <span className="font-bold text-slate-900">{pkg.suggested_retail_price?.toLocaleString()} kr</span>
                                                            {pkg.education_url && (
                                                                <Button variant="outline" size="sm" asChild className="text-purple-700 border-purple-200 hover:bg-purple-100">
                                                                    <a href={pkg.education_url} target="_blank" rel="noreferrer">Läs mer <ExternalLink className="w-3.5 h-3.5 ml-1"/></a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )})}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {renderCalculator()}

                    </TabsContent>
                );
            })}
        </Tabs>
      )}

      {!showAnalyzer && pastAnalyses.length > 0 && (
        <div className="mt-12 space-y-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" /> Historiska Analyser
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pastAnalyses.map(analysis => (
                    <Card key={analysis.id} className="bg-slate-50 border-slate-200">
                        <CardHeader className="pb-2 border-b border-slate-100">
                            <CardTitle className="text-sm text-slate-500 font-normal">
                                {format(new Date(analysis.created_date), "d MMM yyyy HH:mm")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Mål</p>
                                <p className="text-sm font-medium text-slate-800">{analysis.goal}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Investering</p>
                                <p className="text-sm font-medium text-slate-800">{analysis.investment}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Fokusområden</p>
                                <div className="flex flex-wrap gap-1">
                                    {analysis.focus_areas?.map((area, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px] bg-white">{area}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}