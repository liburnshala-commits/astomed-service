import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calculator as CalcIcon, ArrowRight, AlertTriangle, ShieldCheck, TrendingUp, Lightbulb, CheckCircle2, Info, BookOpen, ClipboardCheck, GraduationCap, Wrench, FileText, Handshake } from "lucide-react";

const astomedCategories = [
  {
    id: "harborttagning",
    title: "Permanent hårborttagning",
    description: "Vi på Astomed levererar utrustning för permanent hårborttagning. Hos oss hittar du IPL-Laser, Diodlaser och Alexandrit-laser som behandlar flera olika hår- och hudtyper.",
    image: "https://astomed.se/cdn/shop/files/harborttagning-astomed.jpg?v=1780057540&width=360",
    machines: [
      { id: "aldix", name: "Aldix Smart Laser", subtitle: "Permanent hårborttagning", description: "Laserhårborttagning med välbeprövad diodlaser", image: "https://astomed.se/cdn/shop/files/Aldix-smart-laser-astomed_641a1065-8411-4a13-88f0-dc814e6999ff.png?v=1777023855&width=360", price: 350000, leasingPrice: 7071 },
      { id: "pento", name: "Pento Laser", subtitle: "Laserbehandling", description: "Utrustning som ger resultat med YAG- och Alexandritlaser", image: "https://astomed.se/cdn/shop/files/Pento-astomed_cf1f9d36-4e60-49f1-98ab-7128fe3e8555.png?v=1777023891&width=360", price: 775000, leasingPrice: 15199 },
      { id: "splendorx", name: "Splendor X", subtitle: "Permanent hårborttagning", description: "Laserutrustning i världsklass från välkända Lumenis", image: "https://astomed.se/cdn/shop/files/Splendor-astomed_44e60ad1-527b-4c98-af94-01f04c08a9e1.png?v=1777023900&width=360", price: 1330000, leasingPrice: 25646 },
      { id: "clearlight", name: "Clear light IPL", subtitle: "Skin rejuvenation", description: "Välbeprövad IPL som behandlar flera indikationer", image: "https://astomed.se/cdn/shop/files/Clearlight-ipl-astomed_22012080-31ca-4dee-97ea-8297bae9c6c6.png?v=1777023054&width=360", price: 278000, leasingPrice: 5616 },
      { id: "sopranoice", name: "Soprano Ice Platinum", subtitle: "Permanent hårborttagning", description: "#1 på hårborttagning i Sverige sedan 10 år tillbaka", image: "https://astomed.se/cdn/shop/files/Soprano.png?v=1777030661&width=360", price: 624000, leasingPrice: 12443 },
      { id: "sopranotitanium", name: "Soprano Titanium", subtitle: "Permanent hårborttagning", description: "Laserhårborttagning i toppklass med tre-i en teknologi", image: "https://astomed.se/cdn/shop/files/Soprano-titanium.png?v=1777030764&width=360", price: 885000, leasingPrice: 17469 }
    ]
  },
  {
    id: "tatuering",
    title: "Tatueringsborttagning",
    description: "Tatueringsborttagning med laser är idag den säkraste och mest effektiva metoden för att bleka eller helt avlägsna oönskade tatueringar utan att skada den omgivande huden.",
    image: "https://astomed.se/cdn/shop/files/tattoo-astomed.jpg?v=1780063168&width=360",
    machines: [
      { id: "picolo", name: "Picolo Laser", subtitle: "Tatueringsborttagning", description: "PicoLO laseroptek tatueringsborttagning & hudföryngring", image: "https://astomed.se/cdn/shop/files/PICOLO.png?v=1777031074&width=360", price: 890000, leasingPrice: 17568 },
      { id: "helios", name: "Helios III", subtitle: "Tatueringsborttagning", description: "YAG Laser med 4 handenheter för alla tatueringsfärger", image: "https://astomed.se/cdn/shop/files/HELIOSIII_f1abc78e-5eea-4a9a-aea3-844587184f7b.png?v=1777033137&width=360", price: 429000, leasingPrice: 8667 },
      { id: "pento_t", name: "Pento Laser", subtitle: "Tatueringsborttagning", description: "Utrustning som ger resultat med YAG- och Alexandritlaser", image: "https://astomed.se/cdn/shop/files/Pento-astomed_cf1f9d36-4e60-49f1-98ab-7128fe3e8555.png?v=1777023891&width=360", price: 775000, leasingPrice: 15199 }
    ]
  },
  {
    id: "hudforyngring",
    title: "Hudföryngring",
    description: "Hudföryngring är ett samlingsnamn för olika hudvårdsmetoder som syftar till att återge huden dess spänst, minska rynkor och jämna ut hudtonen.",
    image: "https://astomed.se/cdn/shop/files/hudforyngring-astomed.jpg?v=1780063667&width=360",
    machines: [
      { id: "dermadrop", name: "Dermadrop", subtitle: "Hudföryngring", description: "En världsunik teknologi för anti-ageing behandling", image: "https://astomed.se/cdn/shop/files/Dermadrop-Astomed_18342eda-1761-416f-9301-b77252032001.png?v=1777023000&width=360", price: 229000, leasingPrice: 4570 },
      { id: "hydrabeauty", name: "Hydra Beauty 2", subtitle: "Ansiktsbehandling", description: "Med tre teknologier i en och samma utrustning", image: "https://astomed.se/cdn/shop/files/HYDRA-BEAUTY2-ASTOMED.png?v=1777023406&width=360", price: 129000, leasingPrice: 2594 },
      { id: "ioxo", name: "IOXO Laser", subtitle: "Hudföryngring", description: "Erbiumlaser med överlägsen teknologi och smärtfri behandling", image: "https://astomed.se/cdn/shop/files/IOXO-laser.png?v=1777032520&width=360", price: 285000, leasingPrice: 5758 },
      { id: "powershape", name: "PowerShape 2", subtitle: "Bindvävsmassage", description: "Tre-i-en teknologi med RF, Vakum och laser.", image: "https://astomed.se/cdn/shop/files/Powershape.png?v=1777032793&width=360", price: 330000, leasingPrice: 6667 },
      { id: "focusdual", name: "Focus Dual", subtitle: "Hudföryngring", description: "Hifu + Fraktionerad RF needling för effektiv hudföryngring", image: "https://astomed.se/cdn/shop/files/Focus-astomed_5b2bbc84-c61f-4bcc-83b7-83187aae3a0d.png?v=1777023906&width=360", price: 386000, leasingPrice: 7798 },
      { id: "mezotix", name: "Mezotix", subtitle: "Öppna kanaler", description: "Hudföryngring genom öppna kanaler ned i huden", image: "https://astomed.se/cdn/shop/files/Mezotix.png?v=1777032973&width=360", price: 198000, leasingPrice: 4150 },
      { id: "indiba", name: "Indiba RF", subtitle: "Radiofrekvens", description: "Hudförbättrande behandling för kropp och ansikte", image: "https://astomed.se/cdn/shop/files/Indiba.png?v=1777033074&width=360", price: 395000, leasingPrice: 7980 },
      { id: "fractionco2", name: "Fraction CO2", subtitle: "Fraktionell laser", description: "Nya generationens fraktionerade CO2 laser för kropp och ansikte.", image: "https://astomed.se/cdn/shop/files/Fraction.png?v=1777031026&width=360", price: 328000, leasingPrice: 6626 },
      { id: "carbomed", name: "Carbomed", subtitle: "Carboxyterapi", description: "Injektionsbehandling med medicinsk koldioxid som har läkande effekt", image: "https://astomed.se/cdn/shop/files/Carbomed.png?v=1777033204&width=360", price: 129000, leasingPrice: 2606 },
      { id: "refit", name: "Refit", subtitle: "Hudåtstramning", description: "Stramar åt huden med hjälp av radiofrekvens (RF)", image: "https://astomed.se/cdn/shop/files/Refit.png?v=1777032357&width=360", price: 300000, leasingPrice: 6000 }
    ]
  },
  {
    id: "pigmenteringar",
    title: "Pigmenteringar",
    description: "Pigmenteringar är mörka fläckar på huden som uppstår när kroppen överproducerar melanin. Med utrustning från Astomed kan du behandla dessa hudproblem enkelt och effektivt.",
    image: "https://astomed.se/cdn/shop/files/Pigment-astomed.jpg?v=1780064267&width=360",
    machines: [
      { id: "cryopen", name: "Cryopen O+", subtitle: "Cryoterapi", description: "Peka och frys! På 20 sekunder eliminerar du oönskade hudfläckar", image: "https://astomed.se/cdn/shop/files/Cryopen_bf185c87-971c-4743-9001-669abfafcca8.png?v=1777032103&width=360", price: 23500, leasingPrice: null },
      { id: "cryoiq", name: "Cryo IQ", subtitle: "Cryoterapi", description: "Frys bort vårtor och hudfläckar enkelt och smärtfritt", image: "https://astomed.se/cdn/shop/files/Cryo-iq.png?v=1777033475&width=360", price: 6950, leasingPrice: null },
      { id: "clearlight_p", name: "Clear light IPL", subtitle: "Skin rejuvenation", description: "Välbeprövad IPL som behandlar flera indikationer", image: "https://astomed.se/cdn/shop/files/Clearlight-ipl-astomed_22012080-31ca-4dee-97ea-8297bae9c6c6.png?v=1777023054&width=360", price: 278000, leasingPrice: 5616 }
    ]
  },
  {
    id: "ovriga",
    title: "Övriga maskiner",
    description: "Vi har utrustning för många olika typer av behandlingar inom skönhet men även hälsa. Kroppen läker inifrån och även ålderstecken kan reduceras.",
    image: "https://astomed.se/cdn/shop/files/maskiner-astomed-2-1.webp?v=1777021758&width=360",
    machines: [
      { id: "coolshaping", name: "Coolshaping 2", subtitle: "Fettfrysning", description: "Frys bort fett med Coolshaping 2 som använder 4 handenheter", image: "https://astomed.se/cdn/shop/files/Coolshaping2.png?v=1777032099&width=360", price: 285000, leasingPrice: 5758 },
      { id: "reoxy", name: "Reoxy", subtitle: "Syreterapi", description: "Andas och lev ett bättre liv, med innovativ andningsterapi", image: "https://astomed.se/cdn/shop/files/Reoxy-astomed.png?v=1777022741&width=360", price: 229000, leasingPrice: 4570 },
      { id: "cmslim", name: "CMSlim", subtitle: "Kroppsskulptering", description: "Som att utföra 20 000 situps eller squats på 30 minuter", image: "https://astomed.se/cdn/shop/files/CMslim.png?v=1777032274&width=360", price: 295000, leasingPrice: 5960 },
      { id: "hbot", name: "Oxyhelp", subtitle: "Syrekammare", description: "Bli Starkare och friskare med HBOT syrekammare.", image: "https://astomed.se/cdn/shop/files/HBot.jpg?v=1777032737&width=360", price: 545000, leasingPrice: 10648 },
      { id: "rokutsug", name: "TBH Health Pro", subtitle: "Rökutsug", description: "Ordenligt skydd under laserbehandlingar är en säker investering", image: "https://astomed.se/cdn/shop/files/Rokutsug.png?v=1777033562&width=360", price: 24000, leasingPrice: null },
      { id: "cryoshot", name: "Eskimo luftkylare", subtitle: "Luftkylare", description: "Minska obehag och smärta under behandlingarna", image: "https://astomed.se/cdn/shop/files/Cryoshot-luftkylare.jpg?v=1777033714&width=360", price: 39000, leasingPrice: null },
      { id: "asto", name: "Astomed behandlingssäng", subtitle: "Behandlingssäng", description: "Elektrisk behandlingssäng med 5 motorer", image: "https://astomed.se/cdn/shop/files/Behandlingssang.png?v=1777035752&width=360", price: 19800, leasingPrice: null },
      { id: "brite", name: "Brite LED", subtitle: "Klinikbelysning", description: "Bra belysning är ett måste för en säker arbetsmiljö", image: "https://astomed.se/cdn/shop/files/Halo.png?v=1777035670&width=360", price: 10200, leasingPrice: null }
    ]
  }
];

export default function Calculator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categoryStep, setCategoryStep] = useState(0);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    categoryIds: [],
    machineIds: [],
    trainingIds: [],
    machineStats: {},
    rent: 15000,
    hasEmployees: false,
    salaryPerEmployee: 35000,
    employeeCount: 1,
    isAesthetic: true,
    fullName: "",
    company: "",
    email: "",
    phone: "",
    municipalityFee: 3000,
    interiorCost: 25000,
    otherStartup: 10000,
    bookingSystem: 799,
    insuranceAndOther: 2000,
    includeServiceAgreement: true,
    financingType: "leasing", // "cash" or "leasing"
    leasingInterestRate: 11,
    leasingMonths: 60
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.Product.list().then(setProducts).catch(console.error);
    base44.entities.ServiceAgreementTemplate.list().then(setTemplates).catch(console.error);
  }, []);

  const handleUpdate = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const trainings = products.filter(p => p.category === "Utbildning");

  const allCategoryMachines = astomedCategories.flatMap(c => c.machines);
  // Använd de inbyggda priserna från config, eller hämta från DB om de finns där.
  const selectedMachines = allCategoryMachines.filter(m => formData.machineIds.includes(m.id)).map(m => {
    const dbProduct = products.find(p => p.name.toLowerCase() === m.name.toLowerCase());
    return { ...m, price: (dbProduct && dbProduct.suggested_retail_price > 0) ? dbProduct.suggested_retail_price : m.price };
  });

  const selectedTrainings = trainings.filter(t => formData.trainingIds.includes(t.id));
  const trainingCost = selectedTrainings.reduce((sum, t) => sum + (t.suggested_retail_price || 0), 0);

  // Skatter och avgifter
  const vatRate = formData.isAesthetic ? 0.25 : 0;

  let totalTreatmentsPerWeek = 0;
  const monthlyRevenueExVat = selectedMachines.reduce((sum, m) => {
    const stat = formData.machineStats[m.id] || { price: 1500, treatments: 20 };
    const priceEx = stat.price / (1 + vatRate);
    totalTreatmentsPerWeek += Number(stat.treatments);
    return sum + (Number(stat.treatments) * 4 * priceEx);
  }, 0);

  const baseSalaryTotal = formData.hasEmployees ? formData.salaryPerEmployee * formData.employeeCount : 0;
  const socialFees = baseSalaryTotal * 0.3142; // Arbetsgivaravgifter 31.42%
  const vacationPay = baseSalaryTotal * 0.12; // Semesterersättning 12%
  const pensionAndInsurance = baseSalaryTotal * 0.10; // Tjänstepension & försäkringar ~10%
  const totalSalaryCost = baseSalaryTotal + socialFees + vacationPay + pensionAndInsurance;
  
  const serviceAgreementBaseCost = selectedMachines.reduce((sum, m) => {
    const template = templates.find(t => t.name.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(t.name.toLowerCase()));
    let price = template && template.price_per_month ? template.price_per_month : 399;
    return sum + price;
  }, 0);
  
  const hasServiceDiscount = selectedMachines.length > 1;
  const serviceAgreementDiscountedCost = hasServiceDiscount ? serviceAgreementBaseCost * 0.9 : serviceAgreementBaseCost;
  const serviceAgreementCost = formData.includeServiceAgreement ? serviceAgreementDiscountedCost : 0;

  // Maskiner som har ett leasingpris leasas, medan övriga betalas vid start
  const machinesBoughtDirectly = selectedMachines.filter(m => !m.leasingPrice);
  const machinesLeased = selectedMachines.filter(m => m.leasingPrice);

  const machineStartupCost = machinesBoughtDirectly.reduce((sum, m) => sum + m.price, 0);
  const totalStartupCost = machineStartupCost + trainingCost + formData.municipalityFee + formData.interiorCost + formData.otherStartup;
  const machinePrice = selectedMachines.reduce((sum, m) => sum + m.price, 0); // För databasen/rapporten
  
  // Månadskostnad för utrustning är leasingpriser på de valda maskinerna
  // Om träningar ingår kan de behöva leasas, men här antar vi att summan av leasingpriserna räcker.
  let monthlyLeasingCost = machinesLeased.reduce((sum, m) => sum + m.leasingPrice, 0);

  const monthlyCost = formData.rent + totalSalaryCost + formData.bookingSystem + formData.insuranceAndOther + (totalTreatmentsPerWeek * 4 * 100) + serviceAgreementCost + monthlyLeasingCost; 

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
  
  const breakEvenMonths = selectedMachines.length > 0 && monthlyProfitAfterTax > 0 ? (totalStartupCost / monthlyProfitAfterTax).toFixed(1) : "N/A";
  
  const roi1Month = totalStartupCost > 0 ? ((monthlyProfitAfterTax / totalStartupCost) * 100).toFixed(1) : 0;
  const roi6Months = totalStartupCost > 0 ? ((profit6Months / totalStartupCost) * 100).toFixed(1) : 0;
  const roi12Months = totalStartupCost > 0 ? ((profit12Months / totalStartupCost) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-3 sm:p-6 flex items-center justify-center relative overflow-hidden">
      {/* Dekorativa geometriska former som bakgrund */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-600 opacity-20 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-blue-500 opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-500 opacity-20 blur-3xl" />
      </div>
      <div className="max-w-3xl w-full relative z-10 my-4 sm:my-0">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-700 via-teal-600 to-slate-800 text-white relative">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="absolute right-4 top-4 text-white hover:bg-white/20">
              Avbryt / Hem
            </Button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white/20">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" 
                  alt="Astomed" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-white text-sm tracking-wide">Astomed Pro</div>
                <div className="text-xs text-white/70">Klinikkalkylator</div>
              </div>
            </div>
            <div className="mt-8 mb-4 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-medium"><CalcIcon className="w-5 h-5" /> Skapa din affärsplan</CardTitle>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
              <div className="h-full bg-teal-400 transition-all duration-500 ease-out" style={{ width: `${(step / 9) * 100}%` }} />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8">
            
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Astomed som partner</Badge>
                  <h3 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Vi bygger din klinik tillsammans</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Innan vi tittar på specifik utrustning vill vi visa hur vi stöttar dig genom hela din kliniks livscykel. Vi är inte bara en maskinleverantör, vi är din helhetspartner för trygg klinikutveckling.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCategoryStep(0); setStep(2); }}>
                    <CardContent className="p-4 sm:p-5 flex gap-4 flex-col h-full">
                      <div className="flex gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl h-fit"><Handshake className="w-6 h-6 text-blue-600" /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">Process {"&"} Start</h4>
                          <p className="text-sm text-slate-600 mt-1">Vi hjälper dig med affärsplan, finansieringslösningar och guidar dig genom de anmälningar som krävs till kommunen.</p>
                        </div>
                      </div>
                      <div className="text-xs text-teal-600 font-semibold flex items-center gap-1 mt-auto pt-3 border-t border-slate-100 justify-end">
                        Gå vidare <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCategoryStep(0); setStep(2); }}>
                    <CardContent className="p-4 sm:p-5 flex gap-4 flex-col h-full">
                      <div className="flex gap-4">
                        <div className="bg-emerald-50 p-3 rounded-xl h-fit"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">Regelverk {"&"} Säkerhet</h4>
                          <p className="text-sm text-slate-600 mt-1">Få stöd att uppfylla kraven från SSMFS och Miljöbalken, inklusive egenkontroll och upprättande av skyddsrutiner.</p>
                        </div>
                      </div>
                      <div className="text-xs text-teal-600 font-semibold flex items-center gap-1 mt-auto pt-3 border-t border-slate-100 justify-end">
                        Gå vidare <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCategoryStep(0); setStep(2); }}>
                    <CardContent className="p-4 sm:p-5 flex gap-4 flex-col h-full">
                      <div className="flex gap-4">
                        <div className="bg-purple-50 p-3 rounded-xl h-fit"><GraduationCap className="w-6 h-6 text-purple-600" /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">Utbildning {"&"} Kompetens</h4>
                          <p className="text-sm text-slate-600 mt-1">Gedigna certifieringsutbildningar för dig och din personal, samt löpande kunskapslyft för att ni alltid ska ligga i framkant.</p>
                        </div>
                      </div>
                      <div className="text-xs text-teal-600 font-semibold flex items-center gap-1 mt-auto pt-3 border-t border-slate-100 justify-end">
                        Gå vidare <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCategoryStep(0); setStep(2); }}>
                    <CardContent className="p-4 sm:p-5 flex gap-4 flex-col h-full">
                      <div className="flex gap-4">
                        <div className="bg-orange-50 p-3 rounded-xl h-fit"><Wrench className="w-6 h-6 text-orange-600" /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">Service {"&"} Drift</h4>
                          <p className="text-sm text-slate-600 mt-1">Våra serviceavtal säkerställer att er utrustning fungerar tryggt, minimerar driftstopp och ger snabb teknisk support.</p>
                        </div>
                      </div>
                      <div className="text-xs text-teal-600 font-semibold flex items-center gap-1 mt-auto pt-3 border-t border-slate-100 justify-end">
                        Gå vidare <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 cursor-pointer" onClick={() => { setCategoryStep(0); setStep(2); }}>
                    <CardContent className="p-4 sm:p-5 flex gap-4 flex-col h-full">
                      <div className="flex gap-4">
                        <div className="bg-rose-50 p-3 rounded-xl h-fit"><FileText className="w-6 h-6 text-rose-600" /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">Portal {"&"} Aktuell info</h4>
                          <p className="text-sm text-slate-600 mt-1">I vår kundportal får du direkt tillgång till dina certifikat, behandlingsprotokoll, serviceloggar och den senaste branschinformationen.</p>
                        </div>
                      </div>
                      <div className="text-xs text-teal-600 font-semibold flex items-center gap-1 mt-auto pt-3 border-t border-slate-100 justify-end">
                        Gå vidare <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">
                    Behandlingsområden
                  </Badge>
                  <h3 className="font-bold text-2xl mb-1">
                    Vilka behandlingar vill du erbjuda?
                  </h3>
                  <p className="text-slate-500 text-sm max-w-2xl mx-auto">
                    Välj ett eller flera områden du vill arbeta med på din klinik.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {astomedCategories.map((category) => (
                    <div 
                      key={category.id}
                      className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${formData.categoryIds.includes(category.id) ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md' : 'border-slate-200 hover:border-teal-300'}`} 
                      onClick={() => {
                        const isSelected = formData.categoryIds.includes(category.id);
                        handleUpdate("categoryIds", isSelected 
                          ? formData.categoryIds.filter(id => id !== category.id)
                          : [...formData.categoryIds, category.id]
                        );
                      }}
                    >
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        {category.image && (
                          <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
                        )}
                        <div className={`absolute inset-0 transition-all ${formData.categoryIds.includes(category.id) ? 'bg-teal-600/20' : 'bg-black/0'}`} />
                      </div>
                      <div className={`p-5 flex-1 flex flex-col gap-3 ${formData.categoryIds.includes(category.id) ? 'bg-teal-50' : 'bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={formData.categoryIds.includes(category.id)} 
                            onCheckedChange={() => {}} 
                            className="w-5 h-5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 pointer-events-none"
                          />
                          <Label className="text-base font-bold text-slate-900 cursor-pointer flex-1 pointer-events-none">
                            {category.title}
                          </Label>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 pointer-events-none">{category.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setStep(1)} 
                    className="w-full sm:w-1/3 h-14"
                  >
                    Tillbaka
                  </Button>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-2/3 h-14" 
                    onClick={() => setStep(3)}
                    disabled={formData.categoryIds.length === 0}
                  >
                    Se rekommenderad utrustning <ArrowRight className="ml-2 w-4 h-4"/>
                  </Button>
                </div>
                {formData.categoryIds.length === 0 && (
                  <p className="text-center text-sm text-amber-600 mt-2 font-medium">Du måste välja minst ett område för att gå vidare.</p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Utrustning {"&"} Support</Badge>
                  <h3 className="font-bold text-2xl mb-1">Välj din utrustning</h3>
                  <p className="text-slate-500 text-sm max-w-2xl mx-auto">
                    Här är utrustning som passar för dina valda områden. <strong>I varje köp ingår vår Astomed-garanti:</strong> Omfattande utbildning, startkit för egenkontroll samt löpande rådgivning för en trygg uppstart och driftsättning.
                  </p>
                </div>
                <div className="space-y-6">
                  {astomedCategories.filter(c => formData.categoryIds.length === 0 || formData.categoryIds.includes(c.id)).map(category => (
                    <div key={category.id} className="bg-white rounded-xl border-2 border-slate-100 overflow-hidden shadow-sm">
                      <div className="flex flex-col sm:flex-row border-b border-slate-100">
                        <div className="w-full sm:w-1/3 min-h-[140px] bg-slate-100 relative">
                           <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="p-5 sm:w-2/3 flex flex-col justify-center">
                           <h4 className="font-bold text-lg text-slate-800">{category.title}</h4>
                           <p className="text-sm text-slate-500 mt-2 leading-relaxed">{category.description}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50/50">
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                          {category.machines.map(m => {
                            const dbProduct = products.find(p => p.name.toLowerCase() === m.name.toLowerCase());
                            const price = (dbProduct && dbProduct.suggested_retail_price > 0) ? dbProduct.suggested_retail_price : m.price;
                            
                            return (
                              <div 
                                 key={m.id} 
                                 onClick={() => {
                                   const isSelected = formData.machineIds.includes(m.id);
                                   const newIds = isSelected 
                                     ? formData.machineIds.filter(id => id !== m.id)
                                     : [...formData.machineIds, m.id];
                                   setFormData(prev => ({
                                     ...prev,
                                     machineIds: newIds
                                   }));
                                 }}
                                 className={`shrink-0 snap-center w-[85vw] max-w-[280px] sm:w-[280px] bg-white rounded-xl border-2 shadow-sm transition-all flex flex-col overflow-hidden cursor-pointer ${formData.machineIds.includes(m.id) ? 'border-teal-600 ring-2 ring-teal-600/20' : 'border-slate-200 hover:border-teal-300'}`}
                               >
                                 {m.image && (
                                   <div className="h-44 bg-white relative border-b border-slate-100 p-4 flex items-center justify-center">
                                     <img src={m.image} alt={m.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                     <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full p-1 shadow-sm pointer-events-none">
                                       <Checkbox 
                                         id={`machine-${m.id}`}
                                         checked={formData.machineIds.includes(m.id)}
                                         onCheckedChange={() => {}}
                                         className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                       />
                                     </div>
                                   </div>
                                 )}
                                 <div className="p-4 flex-1 flex flex-col pointer-events-none">
                                   <div className="flex-1 flex flex-col">
                                     <div className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mb-1">{m.subtitle}</div>
                                     <div className="text-base font-bold text-slate-800 mb-2 leading-tight">{m.name}</div>
                                     <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">
                                       {m.description}
                                     </p>
                                     <div className="mt-auto pt-3 border-t border-slate-100">
                                       {m.leasingPrice ? (
                                         <div className="text-xs font-semibold text-slate-800 bg-slate-100 inline-block px-2.5 py-1.5 rounded-md w-full text-center">
                                           Från {m.leasingPrice.toLocaleString()} kr/mån
                                         </div>
                                       ) : price > 0 ? (
                                         <div className="text-xs font-semibold text-slate-800 bg-slate-100 inline-block px-2.5 py-1.5 rounded-md w-full text-center">
                                           Pris: {price.toLocaleString()} kr
                                         </div>
                                       ) : (
                                         <div className="text-xs font-medium text-slate-400 italic text-center w-full">
                                           Pris på förfrågan
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
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

                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t">
                  <Button variant="outline" size="lg" onClick={() => setStep(2)} className="w-full sm:w-1/3 h-14">Tillbaka</Button>
                  <Button size="lg" className="w-full sm:w-2/3 h-14" onClick={() => setStep(4)} disabled={formData.machineIds.length === 0}>
                    Vidare till tilläggstjänster {"&"} produkter <ArrowRight className="ml-2 w-4 h-4"/>
                  </Button>
                </div>
                </div>
                )}

                {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Mer än bara maskiner</Badge>
                  <h3 className="font-bold text-2xl mb-1">Tilläggstjänster, Utbildning &amp; Hudvård</h3>
                  <p className="text-slate-500 text-sm max-w-2xl mx-auto">
                    För att din klinik ska bli framgångsrik erbjuder vi ett komplett utbud av tjänster och produkter som kompletterar din utrustning.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Tilläggstjänster */}
                  <div className="bg-blue-50/50 p-5 sm:p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg"><Wrench className="w-5 h-5 text-blue-700" /></div>
                      <h4 className="font-bold text-lg text-slate-800">Tilläggstjänster kring Klinikutrustning</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Din utrustning är kärnan i din verksamhet, och vi ser till att den alltid fungerar optimalt. Vi erbjuder trygga <strong>serviceavtal</strong>, årliga <strong>funktionskontroller</strong> och snabb teknisk support. Dessutom hjälper vi dig med förmånliga <strong>finansieringslösningar</strong> och leasingupplägg som är skräddarsydda för klinikverksamhet.
                    </p>
                  </div>

                  {/* Utbildningar */}
                  <div className="bg-purple-50/50 p-5 sm:p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-100 p-2 rounded-lg"><GraduationCap className="w-5 h-5 text-purple-700" /></div>
                      <h4 className="font-bold text-lg text-slate-800">Våra Utbildningar</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      Kunskap är nyckeln till nöjda kunder och hög säkerhet. Vi erbjuder certifierande utbildningar inom bland annat:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Laser &amp; IPL (Grund och Avancerad)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Estetiska Injektioner</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Hudvård &amp; Kemisk Peeling</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Microneedling</li>
                    </ul>
                  </div>

                  {/* Hudvårdsprodukter */}
                  <div className="bg-amber-50/50 p-5 sm:p-6 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-amber-100 p-2 rounded-lg"><Lightbulb className="w-5 h-5 text-amber-700" /></div>
                      <h4 className="font-bold text-lg text-slate-800">Hudvårdsprodukter för Klinik &amp; Hemmabruk</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      Förstärk resultaten av dina maskinbehandlingar med resultatinriktad hudvård. Vi tillhandahåller professionella produkter för:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Kemiska peels &amp; Salongsbehandlingar</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Anti-age &amp; Hudföryngring</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Lugnande eftervård &amp; Återfuktning</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Pigmentreducering &amp; Solskydd</li>
                    </ul>
                    <p className="text-xs text-slate-500 mt-4 italic">Med rätt hudvård ökar du inte bara kundens resultat, utan skapar även en lukrativ merförsäljning på kliniken.</p>
                  </div>
                </div>

                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t">
                  <Button variant="outline" size="lg" onClick={() => setStep(3)} className="w-full sm:w-1/3 h-14">Tillbaka</Button>
                  <Button size="lg" className="w-full sm:w-2/3 h-14" onClick={() => setStep(5)}>
                    Vidare till regelverk &amp; strålskydd <ArrowRight className="ml-2 w-4 h-4"/>
                  </Button>
                </div>
                </div>
                )}

                {step === 5 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Trygghet {"&"} Samarbete</Badge>
                  <h3 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Grattis till ett klokt val!</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Med Astomed som partner får du inte bara fantastisk utrustning, du får en <strong>trygg och långsiktig partner</strong>. Vi hjälper dig hela vägen så att du kan fokusera på dina kunder, medan vi tillsammans ser till att alla regelverk uppfylls på ett smidigt sätt.
                  </p>
                </div>
                
                {/* Pedagogisk Regelverks-sektion */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-l-4 border-teal-500 pl-3 mb-4">
                    <div className="bg-teal-50 p-2 rounded-lg"><ShieldCheck className="w-5 h-5 text-teal-700" /></div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">Så här hjälper vi dig</h4>
                      <p className="text-sm text-slate-500">Tillsammans säkerställer vi en trygg och laglig verksamhet</p>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full bg-white rounded-xl border shadow-sm" defaultValue="item-1">
                    <AccordionItem value="item-1" className="border-b px-4">
                      <AccordionTrigger className="hover:no-underline font-semibold text-slate-800">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Anmälan till Kommunen</div>
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm pb-4 leading-relaxed">
                        När du startar din verksamhet behöver du göra en anmälan till kommunen. Du behöver inte oroa dig – <strong>vi guidar dig genom hela processen</strong>. Vi hjälper dig att förbereda rätt underlag och skicka in din anmälan i god tid (senast 6 veckor före start) så att din verksamhet är fullt godkänd från dag ett.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2" className="border-b px-4">
                      <AccordionTrigger className="hover:no-underline font-semibold text-slate-800">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Egenkontroll {"&"} Rutiner</div>
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm pb-4 leading-relaxed">
                        För att din klinik ska följa Miljöbalken behövs ett system för egenkontroll. <strong>Det fixar vi enkelt tillsammans.</strong> Du får tillgång till färdiga mallar och smidiga checklistor för allt från städ- och hygienrutiner till riskavfallshantering. Med vårt stöd har du alltid full koll vid eventuella inspektioner.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3" className="border-b px-4">
                      <AccordionTrigger className="hover:no-underline font-semibold text-slate-800">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Strålsäkerhet {"&"} Injektionslagen</div>
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm pb-4 leading-relaxed">
                        <strong>Arbetar du med Laser eller IPL?</strong> Vi hjälper dig att uppfylla Strålsäkerhetsmyndighetens (SSM) krav. Vi ser till att du har rätt dokumentation, godkända skyddsglasögon och skyltning på plats. 
                        <br/><br/>
                        <strong>Injektionsbehandlingar?</strong> Vi vägleder dig kring lagkraven så att du och dina kunder känner er trygga med att alla estetiska injektioner utförs på ett korrekt och certifierat sätt.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Uppstartskostnader */}
                <div className="pt-6 border-t mt-6">
                  <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-3 mb-6">
                    <div className="bg-slate-100 p-2 rounded-lg"><CalcIcon className="w-5 h-5 text-slate-700" /></div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">Engångskostnader</h4>
                      <p className="text-sm text-slate-500">Investeringar för uppstarten (exklusive din maskin)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-slate-50 p-5 md:p-6 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Inredning {"&"} Brits (kr)</Label>
                      <Input type="number" className="bg-white text-slate-900 font-medium h-11" value={formData.interiorCost} onChange={e => handleUpdate("interiorCost", Number(e.target.value))}/>
                      <Slider value={[formData.interiorCost]} onValueChange={v => handleUpdate("interiorCost", v[0])} max={200000} step={1000} className="py-2" />
                      <p className="text-xs text-slate-500 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0" /> Möbler och belysning.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Övriga Kostnader (kr)</Label>
                      <Input type="number" className="bg-white text-slate-900 font-medium h-11" value={formData.otherStartup} onChange={e => handleUpdate("otherStartup", Number(e.target.value))}/>
                      <Slider value={[formData.otherStartup]} onValueChange={v => handleUpdate("otherStartup", v[0])} max={150000} step={1000} className="py-2" />
                      <p className="text-xs text-slate-500 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0" /> El, vatten, avfall och andra utgifter.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t">
                  <Button variant="outline" size="lg" onClick={() => setStep(4)} className="w-full sm:w-1/3 h-14">Tillbaka</Button>
                  <Button size="lg" className="w-full sm:w-2/3 h-14" onClick={() => setStep(6)}>Vidare till finansiering <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Finansiering</Badge>
                  <h3 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Finansiering</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Hur vill du finansiera din utrustning? Det vanligaste alternativet är leasing, vilket binder mindre kapital vid uppstart.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border-2 border-teal-600 bg-teal-50/50">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <div className="w-6 h-6 rounded border-2 border-teal-600 bg-teal-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                      <div>
                        <Label className="text-base font-bold text-slate-900 cursor-pointer">Leasingavtal</Label>
                        <p className="text-sm text-slate-600 mt-1">Det mest flexibla alternativet. Dela upp kostnaden månadsvis utan att binda upp stort kapital vid uppstart.</p>
                        <p className="text-xs text-slate-500 mt-2"><em>Intresserad av direktköp? Kontakta oss för ett möte så diskuterar vi dina behov och alternativen.</em></p>
                      </div>
                    </div>
                  </div>

                  {formData.financingType === "leasing" && (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4">
                      <h4 className="font-bold text-lg text-slate-800">Leasinguppgifter</h4>
                      <p className="text-sm text-slate-600">Baserat på aktuella rekommenderade marknadspriser för leasingavtal från Astomed.</p>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Uppskattad månadskostnad för utrustning:</span>
                          <span className="font-bold text-lg">{Math.round(monthlyLeasingCost).toLocaleString()} kr</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t">
                  <Button variant="outline" size="lg" onClick={() => setStep(5)} className="w-full sm:w-1/3 h-14">Tillbaka</Button>
                  <Button size="lg" className="w-full sm:w-2/3 h-14" onClick={() => setStep(7)}>Gå vidare till ekonomi <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Live result floating bar */}
                <div className="sticky top-[70px] sm:top-4 z-40 bg-slate-900 text-white p-4 rounded-xl shadow-2xl mb-6 flex justify-between items-center border border-slate-700/50 backdrop-blur-md">
                  <div>
                    <div className="text-[10px] sm:text-xs text-teal-300 uppercase font-bold tracking-wider mb-0.5">Förväntad Vinst / Mån</div>
                    <div className="text-xl sm:text-2xl font-black text-white">{Math.round(monthlyProfitAfterTax).toLocaleString()} kr</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xs text-amber-300 uppercase font-bold tracking-wider mb-0.5">Break-even</div>
                    <div className="text-lg sm:text-xl font-bold">{breakEvenMonths} mån</div>
                  </div>
                </div>

                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Ekonomi</Badge>
                  <h3 className="font-bold text-2xl mb-1">Löpande Månadskostnader {"&"} Intäkter</h3>
                  <p className="text-slate-500 text-sm max-w-2xl mx-auto">Fyll i dina förväntade löpande kostnader och priser för att se lönsamheten per månad.</p>
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
                   <div className="sm:col-span-2 space-y-4 mb-4">
                     <h4 className="font-bold text-lg text-slate-800 border-b pb-2">Behandlingar {"&"} Priser per maskin</h4>
                     {selectedMachines.map(m => {
                       const stat = formData.machineStats[m.id] || { price: 1500, treatments: 20 };
                       return (
                         <div key={m.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <h5 className="font-semibold text-slate-800 mb-3">{m.name}</h5>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div className="space-y-2">
                               <Label>Snittpris / behandling (inkl. moms)</Label>
                               <Input type="number" className="bg-white text-slate-900 font-medium h-11" value={stat.price} onChange={e => {
                                 setFormData(prev => ({
                                   ...prev, machineStats: { ...prev.machineStats, [m.id]: { ...stat, price: Number(e.target.value) } }
                                 }));
                               }}/>
                               <Slider value={[stat.price]} onValueChange={v => {
                                 setFormData(prev => ({
                                   ...prev, machineStats: { ...prev.machineStats, [m.id]: { ...stat, price: v[0] } }
                                 }));
                               }} max={10000} step={100} className="py-2" />
                             </div>
                             <div className="space-y-2">
                               <Label>Behandlingar / vecka</Label>
                               <Input type="number" className="bg-white text-slate-900 font-medium h-11" value={stat.treatments} onChange={e => {
                                 setFormData(prev => ({
                                   ...prev, machineStats: { ...prev.machineStats, [m.id]: { ...stat, treatments: Number(e.target.value) } }
                                 }));
                               }}/>
                               <Slider value={[stat.treatments]} onValueChange={v => {
                                 setFormData(prev => ({
                                   ...prev, machineStats: { ...prev.machineStats, [m.id]: { ...stat, treatments: v[0] } }
                                 }));
                               }} max={100} step={1} className="py-2" />
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>

                   <div className="sm:col-span-2 mt-4 bg-slate-900 rounded-xl overflow-hidden relative shadow-sm text-white border border-slate-800">
                     <div className="absolute inset-0 z-0">
                       <img src="https://astomed.se/cdn/shop/files/PICOLO.png?v=1777031074" alt="Picolo Laser" className="w-full h-full object-cover opacity-30 mix-blend-luminosity" />
                       <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-teal-900/80" />
                     </div>
                     
                     <div className="relative z-10 p-6 sm:p-8">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                         <h4 className="font-bold text-xl text-white">Personal {"&"} Löner</h4>
                         <div className="flex items-center gap-2">
                           <Checkbox 
                             id="has-employees"
                             checked={formData.hasEmployees}
                             onCheckedChange={(checked) => handleUpdate("hasEmployees", checked)}
                             className="border-white/50 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                           />
                           <Label htmlFor="has-employees" className="text-teal-50 cursor-pointer">Jag har anställd personal</Label>
                         </div>
                       </div>
                       
                       {formData.hasEmployees ? (
                         <>
                           <p className="text-teal-50 text-sm mb-6 max-w-lg opacity-90">
                             Att ha rätt personal är avgörande. Beräkna dina personalkostnader för att se hur det påverkar lönsamheten.
                           </p>
                           
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-300">
                             <div className="space-y-2">
                               <Label className="text-teal-50">Antal anställda (heltid)</Label>
                               <Input type="number" min="1" className="bg-white/10 border-white/20 text-white font-medium h-11 focus:bg-white/20" value={formData.employeeCount} onChange={e => handleUpdate("employeeCount", Math.max(1, Number(e.target.value)))}/>
                               <Slider value={[formData.employeeCount]} onValueChange={v => handleUpdate("employeeCount", Math.max(1, v[0]))} max={10} step={1} className="py-2 [&_[role=slider]]:bg-teal-400 [&_[role=slider]]:border-teal-400 [&_.bg-primary]:bg-teal-400" />
                               {formData.employeeCount < selectedMachines.length && (
                                 <p className="text-xs text-amber-300 font-medium mt-1">Tips: Med {selectedMachines.length} maskiner kan du behöva fler anställda.</p>
                               )}
                             </div>
                             <div className="space-y-2">
                               <Label className="text-teal-50">Snittlön (brutto per anställd)</Label>
                               <Input type="number" className="bg-white/10 border-white/20 text-white font-medium h-11 focus:bg-white/20" value={formData.salaryPerEmployee} onChange={e => handleUpdate("salaryPerEmployee", Number(e.target.value))}/>
                               <Slider value={[formData.salaryPerEmployee]} onValueChange={v => handleUpdate("salaryPerEmployee", v[0])} max={80000} step={1000} className="py-2 [&_[role=slider]]:bg-teal-400 [&_[role=slider]]:border-teal-400 [&_.bg-primary]:bg-teal-400" />
                               <p className="text-xs text-teal-100/70 mt-1">Kalkylen lägger till sociala avgifter (31,42%), semester (12%) {"&"} pension (~10%).</p>
                             </div>
                           </div>
                         </>
                       ) : (
                         <p className="text-teal-50 text-sm opacity-90">
                           Kryssa i rutan ovan om du vill inkludera personalkostnader i kalkylen. Om du driver kliniken själv utan anställda kan du lämna rutan urbockad.
                         </p>
                       )}
                     </div>
                   </div>
                   
                   <div className="sm:col-span-2 pt-4 border-t">
                     <h4 className="font-bold text-lg text-slate-800 mb-1">Egenkostnader {"&"} Fasta utgifter</h4>
                     <p className="text-sm text-slate-600 mb-4">
                       Här anger du dina fasta månadsutgifter som hyra och försäkringar. <strong>Har du redan en befintlig salong eller klinik?</strong> Då kanske du inte behöver räkna med någon extra hyra här – sätt i så fall hyran till 0 kr.
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                       <div className="space-y-2">
                         <Label>Hyra (exkl. moms, kr/mån)</Label>
                         <Input type="number" className="bg-white text-slate-900 font-medium h-11" value={formData.rent} onChange={e => handleUpdate("rent", Number(e.target.value))}/>
                         <Slider value={[formData.rent]} onValueChange={v => handleUpdate("rent", v[0])} max={100000} step={1000} className="py-2" />
                         <p className="text-xs text-slate-500">Valfritt. Kan sättas till 0 om du redan har en lokal.</p>
                       </div>
                       <div className="space-y-2">
                         <Label>Bokningssystem (t.ex. Bokadirekt, kr/mån)</Label>
                         <Input type="number" className="bg-white text-slate-900 font-medium h-11" value={formData.bookingSystem} onChange={e => handleUpdate("bookingSystem", Number(e.target.value))}/>
                         <Slider value={[formData.bookingSystem]} onValueChange={v => handleUpdate("bookingSystem", v[0])} max={5000} step={100} className="py-2" />
                       </div>
                       <div className="space-y-2 sm:col-span-2">
                         <Label>Försäkring {"&"} Marknadsföring (kr/mån)</Label>
                         <Input type="number" className="bg-white text-slate-900 font-medium h-11" value={formData.insuranceAndOther} onChange={e => handleUpdate("insuranceAndOther", Number(e.target.value))}/>
                         <Slider value={[formData.insuranceAndOther]} onValueChange={v => handleUpdate("insuranceAndOther", v[0])} max={50000} step={500} className="py-2" />
                       </div>
                     </div>
                   </div>

                   {/* Astomed Serviceavtal */}
                   <div className="sm:col-span-2 pt-4 mt-2 border-t">
                     <div 
                       className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${formData.includeServiceAgreement ? 'border-teal-600 bg-teal-50/50' : 'border-slate-200 bg-white hover:border-teal-300'}`} 
                       onClick={() => handleUpdate("includeServiceAgreement", !formData.includeServiceAgreement)}
                     >
                       <div className="flex items-start gap-4">
                         <div className="mt-1">
                           <Checkbox 
                             id="service-agreement" 
                             checked={formData.includeServiceAgreement} 
                             onCheckedChange={(c) => handleUpdate("includeServiceAgreement", c)}
                             onClick={(e) => e.stopPropagation()}
                           />
                         </div>
                         <div className="flex-1 space-y-2">
                           <Label htmlFor="service-agreement" className="text-base font-bold text-slate-900 cursor-pointer flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                             Astomed Serviceavtal Trygghet (gäller vald utrustning)
                             <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-none hover:bg-teal-200">
                               {selectedMachines.length === 0 ? "Välj maskiner" : hasServiceDiscount ? (
                                 <span>
                                   <span className="line-through opacity-70 mr-1">{Math.round(serviceAgreementBaseCost).toLocaleString()} kr</span>
                                   {Math.round(serviceAgreementDiscountedCost).toLocaleString()} kr/mån (-10%)
                                 </span>
                               ) : (
                                 <span>{Math.round(serviceAgreementDiscountedCost).toLocaleString()} kr/mån</span>
                               )}
                             </Badge>
                           </Label>
                           <p className="text-sm text-slate-600 leading-relaxed">
                             Ett aktivt serviceavtal eliminerar oväntade utgifter och ger dig dokumenterad servicehistorik vilket gör din klinik <strong>redo för de nya lagkraven (SSMFS 2026:1)</strong>. Ingår: regelbunden funktions- och säkerhetskontroll, fri teknisk support och en förutsägbar, fast månadskostnad. Priset baseras på din valda utrustning.
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t">
                  <Button variant="outline" size="lg" onClick={() => setStep(6)} className="w-full sm:w-1/3 h-14">Tillbaka</Button>
                  <Button size="lg" className="w-full sm:w-2/3 h-14" onClick={() => setStep(8)}>Gå vidare till slutförande <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Avslutande steg</Badge>
                  <h3 className="font-bold text-2xl mb-1">Dina Kontaktuppgifter</h3>
                  <p className="text-slate-500 text-sm max-w-2xl mx-auto">Fyll i dina uppgifter för att se kalkylen och få en komplett affärsplan skickad till din e-post.</p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <Label>För- och Efternamn *</Label>
                     <Input className="bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="Anna Andersson" value={formData.fullName} onChange={e => handleUpdate("fullName", e.target.value)}/>
                   </div>
                   <div className="space-y-2">
                     <Label>E-postadress *</Label>
                     <Input type="email" className="bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="anna@kliniken.se" value={formData.email} onChange={e => handleUpdate("email", e.target.value)}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Telefonnummer *</Label>
                     <Input type="tel" className="bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="070-123 45 67" value={formData.phone} onChange={e => handleUpdate("phone", e.target.value)}/>
                   </div>
                   <div className="space-y-2">
                     <Label>Företagsnamn (Frivilligt)</Label>
                     <Input className="bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="Min Klinik AB" value={formData.company} onChange={e => handleUpdate("company", e.target.value)}/>
                   </div>
                </div>
                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t">
                  <Button variant="outline" size="lg" onClick={() => setStep(7)} disabled={isSubmitting} className="w-full sm:w-1/3 h-14">Tillbaka</Button>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-2/3 h-14" 
                    disabled={!formData.fullName || !formData.email || !formData.phone || isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await base44.functions.invoke("sendClinicBusinessPlan", { 
                          formData: {
                            ...formData,
                            treatmentsPerWeek: totalTreatmentsPerWeek
                          }, 
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
                            profit12Months,
                            monthlyLeasingCost,
                            roi1Month,
                            roi6Months,
                            roi12Months,
                            serviceAgreementCost
                          },
                          machineName: selectedMachines.map(m => m.name).join(", ")
                        });
                        setStep(9);
                      } catch (err) {
                        console.error(err);
                        alert(`Ett fel uppstod när planen skulle skickas: ${err?.data?.error || err?.message || err}. Du kan fortfarande se resultatet.`);
                        setStep(9);
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

            {step === 9 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Section */}
                <div className="text-center space-y-3 pb-6 border-b">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Din Personliga Affärsplan</Badge>
                  <h3 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Klar för start?</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Enligt experter på Almi och Skatteverket är en väl genomarbetad affärsplan avgörande. Den är ditt starkaste kort mot banker, investerare och Arbetsförmedlingen (för starta eget-bidrag). Här har vi strukturerat resan i tre enkla steg för att ge dig full kontroll.
                  </p>
                  <p className="text-sm text-primary font-medium flex items-center justify-center gap-1.5 mt-4">
                    <CheckCircle2 className="w-4 h-4" /> En PDF har även skickats till din e-post!
                  </p>
                </div>

                {/* Pillar A: Lagkrav & Trygghet */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-3">
                    <div className="bg-slate-100 p-2 rounded-lg"><ShieldCheck className="w-5 h-5 text-slate-700" /></div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">1. Lagkrav &amp; Trygghet</h4>
                      <p className="text-sm text-slate-500">Fundamentet. Följ dessa för att bygga ett tryggt varumärke.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
                        <h5 className="font-semibold text-sm">Miljöbalken</h5>
                        <p className="text-xs text-slate-600">Yrkesmässig hygienisk verksamhet kräver anmälan till kommunen senast 6 veckor innan start.</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
                        <h5 className="font-semibold text-sm">Strålsäkerhet (SSMFS)</h5>
                        <p className="text-xs text-slate-600">Kräver dokumenterad egenkontroll och godkänd skyddsutrustning vid IPL och Laser.</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
                        <h5 className="font-semibold text-sm">Injektionslagen</h5>
                        <p className="text-xs text-slate-600">Vid estetiska injektioner är legitimation (läkare, ssk, tandläkare) ett lagkrav.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Pillar B: Affärsmannaskapet */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-3">
                    <div className="bg-slate-100 p-2 rounded-lg"><BookOpen className="w-5 h-5 text-slate-700" /></div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">2. Strategi &amp; Affärsmannaskap</h4>
                      <p className="text-sm text-slate-500">Hur du fyller kliniken och skapar hållbar lönsamhet.</p>
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full bg-white rounded-xl border shadow-sm">
                    <AccordionItem value="item-1" className="border-b-0 px-4">
                      <AccordionTrigger className="hover:no-underline font-semibold text-slate-800">
                        Kundanskaffning &amp; Marknadsföring
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm pb-4 leading-relaxed">
                        Att investera i utrustning är steg ett. Steg två är att berätta för världen att du existerar. 
                        Avsätt budget för sociala medier (Instagram/TikTok), lokal SEO (Google My Business) och influencermetoder i närområdet. 
                        <br/><br/><em>Pro-tips: Skapa före/efter-bilder (med medgivande) - det är din starkaste säljpitch.</em>
                      </AccordionContent>
                    </AccordionItem>
                    <div className="h-px bg-slate-100 mx-4" />
                    <AccordionItem value="item-2" className="border-b-0 px-4">
                      <AccordionTrigger className="hover:no-underline font-semibold text-slate-800">
                        Prissättning &amp; Paketering
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm pb-4 leading-relaxed">
                        Tävla aldrig på pris, tävla på värde. Om du säljer behandlingar styckvis blir kunden prisokänslig. 
                        Paketera istället kurer (t.ex. "Köp 5, få 1 på köpet"). Du får in likviditet direkt och säkrar ett långsiktigt resultat för kunden.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Pillar C: Investeringskollen (Traffic Light) */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 border-l-4 border-primary pl-3">
                    <div className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">3. Investeringskollen</h4>
                      <p className="text-sm text-slate-500">Kalkylen baserad på totalt {totalTreatmentsPerWeek} kundbesök/vecka.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left: Financial Breakdown */}
                    <div className="md:col-span-8 p-6 bg-slate-50 border rounded-xl space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Uppstartsinvestering</span>
                        <strong className="text-lg">{Math.round(totalStartupCost).toLocaleString()} kr</strong>
                      </div>
                      
                      <div className="space-y-2 py-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Snittomsättning/mån (ex. moms):</span>
                          <span className="font-medium text-slate-700">{Math.round(monthlyRevenueExVat).toLocaleString()} kr</span>
                        </div>
                        
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="costs-breakdown" className="border-b-0">
                            <AccordionTrigger className="py-2 hover:no-underline flex justify-between w-full">
                              <span className="text-slate-500 font-normal">Löpande kostnader inkl. lön:</span>
                              <span className="font-medium text-slate-700">- {Math.round(monthlyCost).toLocaleString()} kr</span>
                            </AccordionTrigger>
                            <AccordionContent className="bg-slate-100/50 rounded-lg p-3 space-y-2 text-xs">
                              <div className="flex justify-between text-slate-600">
                                <span>Hyra:</span>
                                <span>{Math.round(formData.rent).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Personalkostnad (inkl avgifter):</span>
                                <span>{Math.round(totalSalaryCost).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Leasing av maskiner:</span>
                                <span>{Math.round(monthlyLeasingCost).toLocaleString()} kr</span>
                              </div>
                              {serviceAgreementCost > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Serviceavtal:</span>
                                  <span>{Math.round(serviceAgreementCost).toLocaleString()} kr</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-600">
                                <span>Bokningssystem:</span>
                                <span>{Math.round(formData.bookingSystem).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Försäkring & Marknadsföring:</span>
                                <span>{Math.round(formData.insuranceAndOther).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Förbrukningsmaterial:</span>
                                <span>{Math.round(totalTreatmentsPerWeek * 4 * 100).toLocaleString()} kr</span>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Bolagsskatt (20.6%):</span>
                          <span className="font-medium text-slate-700">- {Math.round(corporateTax).toLocaleString()} kr</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <span className="font-bold text-slate-800">Vinst efter skatt / mån</span>
                        <strong className="text-xl text-primary">{Math.round(monthlyProfitAfterTax).toLocaleString()} kr</strong>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-bold text-slate-800">Avkastning på investering (ROI)</span>
                        <strong className="text-sm text-primary">{roi1Month}%</strong>
                      </div>
                    </div>

                    {/* Right: Break Even Traffic Light */}
                    <div className={
                      `md:col-span-4 p-6 rounded-xl border flex flex-col items-center justify-center text-center space-y-3 transition-colors ` + 
                      (parseFloat(breakEvenMonths) < 6 ? "bg-green-50 border-green-200 text-green-900" : 
                       parseFloat(breakEvenMonths) <= 12 ? "bg-amber-50 border-amber-200 text-amber-900" : 
                       "bg-red-50 border-red-200 text-red-900")
                    }>
                      <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Break-Even</div>
                      <div className="text-4xl font-black">{breakEvenMonths}</div>
                      <div className="text-sm opacity-90">månader</div>
                      <div className="text-xs mt-2 opacity-80 pt-2 border-t border-current/10">
                        {parseFloat(breakEvenMonths) < 6 ? "Fantastiskt! Din ROI är mycket snabb. Du har sunda marginaler." : 
                         parseFloat(breakEvenMonths) <= 12 ? "Hälsosam investering. Full återbetalning inom ett år." : 
                         "Långsiktig investering. Se över om du kan öka antalet kunder eller minska fasta utgifter."}
                      </div>
                    </div>
                  </div>

                  {/* Forecast */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full" />
                      <div className="font-bold text-slate-800 mb-3">6 Månader Prognos</div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Omsättning</span> <span className="font-medium">{Math.round(revenue6Months).toLocaleString()} kr</span></div>
                        
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="costs-breakdown-6" className="border-b-0">
                            <AccordionTrigger className="py-1 hover:no-underline flex justify-between w-full">
                              <span className="text-slate-500 font-normal">Kostnader</span>
                              <span className="font-medium text-red-600/80">-{Math.round(cost6Months).toLocaleString()} kr</span>
                            </AccordionTrigger>
                            <AccordionContent className="bg-slate-100/50 rounded-lg p-3 mt-1 space-y-2 text-xs">
                              <div className="flex justify-between text-slate-600">
                                <span>Hyra:</span>
                                <span>{Math.round(formData.rent * 6).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Personalkostnad (inkl avgifter):</span>
                                <span>{Math.round(totalSalaryCost * 6).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Leasing av maskiner:</span>
                                <span>{Math.round(monthlyLeasingCost * 6).toLocaleString()} kr</span>
                              </div>
                              {serviceAgreementCost > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Serviceavtal:</span>
                                  <span>{Math.round(serviceAgreementCost * 6).toLocaleString()} kr</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-600">
                                <span>Bokningssystem:</span>
                                <span>{Math.round(formData.bookingSystem * 6).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Försäkring & Marknadsföring:</span>
                                <span>{Math.round(formData.insuranceAndOther * 6).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Förbrukningsmaterial:</span>
                                <span>{Math.round(totalTreatmentsPerWeek * 4 * 100 * 6).toLocaleString()} kr</span>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        
                        <div className="flex justify-between pt-2 mt-1 border-t"><span className="font-bold text-slate-700">Ren Vinst</span> <span className="font-bold text-primary">{Math.round(profit6Months).toLocaleString()} kr</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">ROI</span> <span className="font-bold text-primary">{roi6Months}%</span></div>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full" />
                      <div className="font-bold text-slate-800 mb-3">1 År Prognos</div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Omsättning</span> <span className="font-medium">{Math.round(revenue12Months).toLocaleString()} kr</span></div>
                        
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="costs-breakdown-12" className="border-b-0">
                            <AccordionTrigger className="py-1 hover:no-underline flex justify-between w-full">
                              <span className="text-slate-500 font-normal">Kostnader</span>
                              <span className="font-medium text-red-600/80">-{Math.round(cost12Months).toLocaleString()} kr</span>
                            </AccordionTrigger>
                            <AccordionContent className="bg-slate-100/50 rounded-lg p-3 mt-1 space-y-2 text-xs">
                              <div className="flex justify-between text-slate-600">
                                <span>Hyra:</span>
                                <span>{Math.round(formData.rent * 12).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Personalkostnad (inkl avgifter):</span>
                                <span>{Math.round(totalSalaryCost * 12).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Leasing av maskiner:</span>
                                <span>{Math.round(monthlyLeasingCost * 12).toLocaleString()} kr</span>
                              </div>
                              {serviceAgreementCost > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Serviceavtal:</span>
                                  <span>{Math.round(serviceAgreementCost * 12).toLocaleString()} kr</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-600">
                                <span>Bokningssystem:</span>
                                <span>{Math.round(formData.bookingSystem * 12).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Försäkring & Marknadsföring:</span>
                                <span>{Math.round(formData.insuranceAndOther * 12).toLocaleString()} kr</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Förbrukningsmaterial:</span>
                                <span>{Math.round(totalTreatmentsPerWeek * 4 * 100 * 12).toLocaleString()} kr</span>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        
                        <div className="flex justify-between pt-2 mt-1 border-t"><span className="font-bold text-slate-700">Ren Vinst</span> <span className="font-bold text-primary">{Math.round(profit12Months).toLocaleString()} kr</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">ROI</span> <span className="font-bold text-primary">{roi12Months}%</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-900 mt-6">
                  <Lightbulb className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                  <div className="text-sm leading-relaxed">
                    <strong>Ett tips från marknaden:</strong> Det finns inget som heter "passiv inkomst" den första tiden. Succén ligger i en dedikerad kundupplevelse och konsekvent närvaro i sociala kanaler. Utbildning (som du valt) bygger förtroende och är din snabbaste väg till lönsamhet.
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
                  <Button variant="outline" size="lg" onClick={() => setStep(8)} className="w-full sm:w-1/3 h-14">Tillbaka till uppgifter</Button>
                  <Button size="lg" className="w-full sm:w-2/3 h-14" onClick={() => window.location.reload()}>Gör en ny beräkning <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </div>
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}