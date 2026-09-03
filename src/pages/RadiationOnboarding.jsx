import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, CheckCircle2, Info, BookOpen, AlertCircle, Eye, Settings, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const sections = [
  {
    id: 'myndighetskrav',
    title: 'Myndighetskrav & Anmälningsplikt',
    icon: BookOpen,
    content: (
      <div className="space-y-4 text-sm">
        <p><strong>Vilka tekniker omfattas:</strong> Laser (Klass 3B/4), IPL, Radiofrekvens (RF), Högintensivt fokuserat ultraljud (HIFU/kavitation) samt Elektromagnetiska fält (EMF/muskelstimulering).</p>
        <p><strong>Tillsynsansvar:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>SSM (Strålsäkerhetsmyndigheten):</strong> Tillsyn över strålsäkerhet.</li>
          <li><strong>Läkemedelsverket (MDR):</strong> Tillsyn över medicintekniska produkter.</li>
          <li><strong>Kommunens miljö- och hälsoskyddsnämnd:</strong> Ansvar för anmälan av hygienisk verksamhet.</li>
        </ul>
        <p><strong>Verksamhetsanmälan:</strong> Kliniken och utrustningen måste vara anmäld i SSM:s register per adress där behandling bedrivs.</p>
      </div>
    )
  },
  {
    id: 'lokalkrav',
    title: 'Lokalkrav & Säkerhetszoner',
    icon: Shield,
    content: (
      <div className="space-y-4 text-sm">
        <p><strong>Tillträdeskontroll:</strong> Behandlingsrummets dörr ska vara stängd, gärna låst. Dörrbrytare (interlocks) rekommenderas vid Klass 4-laserbehandlingar för att förhindra obehörigt tillträde.</p>
        <p><strong>Varningsskyltning:</strong> Godkänd varningsskylt ska sitta tydligt på dörren in till behandlingsrummet. Den ska specificera laserklass (t.ex. Klass 4) och våglängd.</p>
        <p><strong>Optisk miljö:</strong> Fönster ska täckas med persienner eller lasergardiner för att förhindra att strålning läcker ut. Reflekterande ytor (speglar, blanka metaller) får inte finnas i strålgången.</p>
        <p><strong>Arbetsmiljö & Luft:</strong> Punktutsug (smoke evacuator) med HEPA- och kolfilter måste användas vid ablativ laser och tatueringsborttagning för att undvika inandning av skadlig laserplym.</p>
      </div>
    )
  },
  {
    id: 'ppe',
    title: 'Personlig Skyddsutrustning (PPE) – Daglig Rutin',
    icon: Eye,
    content: (
      <div className="space-y-4 text-sm">
        <div className="bg-blue-50 text-blue-800 p-3 rounded-md flex items-start gap-3 border border-blue-200">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-semibold">Regel: "Glasögon på innan fotpedalen/handstycket aktiveras."</p>
        </div>
        <p><strong>Skyddsglasögon:</strong> Används av all personal i rummet. Glasögonen MÅSTE matcha maskinens specifika våglängd (nm) och ha rätt optisk densitet (OD/LB-märkning).</p>
        <p><strong>Patientens skydd:</strong> Vid ansiktsbehandlingar eller vid behandling nära ögonen ska patienten bära adekvat ögonskydd, till exempel metallsköldar (blinders) eller specifika patientglasögon.</p>
      </div>
    )
  },
  {
    id: 'kundresan',
    title: 'Kundresan & Rättssäker Dokumentation',
    icon: FileText,
    content: (
      <div className="space-y-4 text-sm">
        <p><strong>Information före behandling (13 §):</strong> Kunden måste ges skriftlig och muntlig information om förväntat resultat, eventuella risker och skillnaden mellan normala och onormala reaktioner.</p>
        <p><strong>Individuell bedömning & Hälsodeklaration:</strong> Kontrollera alltid kontraindikationer, hudtyp (Fitzpatrick-skalan) och användning av ljuskänsliggörande läkemedel inför VARJE behandling.</p>
        <p><strong>Behandlingsdokumentation:</strong> Vid varje session måste följande loggas i journalen: energinivå, pulslängd/antal pulser, behandlat område, datum och vem som utförde behandlingen.</p>
        <div className="bg-amber-50 text-amber-900 p-3 rounded-md flex items-start gap-3 border border-amber-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p><strong>Rapportering av skador:</strong> Skyldighet finns att utreda och anmäla sidoskador, till exempel oväntade brännskador, till SSM (Strålsäkerhetsmyndigheten).</p>
        </div>
      </div>
    )
  },
  {
    id: 'maskinunderhall',
    title: 'Maskinunderhåll, Funktionskontroller & Service (14 § & 15 §)',
    icon: Settings,
    content: (
      <div className="space-y-4 text-sm">
        <p><strong>Funktionskontroll före start:</strong> Utför daglig kontroll av kablar, handstycken, kylsystem och att nödstopp fungerar korrekt.</p>
        <p><strong>Regelbundet underhåll:</strong> Det är obligatoriskt att följa tillverkarens servicemanual, vilket ofta inkluderar årliga filterbyten och kalibrering utförd av auktoriserad tekniker.</p>
        <p><strong>Apparatregister:</strong> All dokumentation och alla servicerapporter ska finnas samlade och tillgängliga för granskning (t.ex. vid tillsyn).</p>
      </div>
    )
  }
];

export default function RadiationOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkedSections, setCheckedSections] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [employeeName, setEmployeeName] = useState('');

  const handleCheck = (id, checked) => {
    setCheckedSections(prev => ({ ...prev, [id]: checked }));
  };

  const allChecked = sections.every(s => checkedSections[s.id]);

  const handleSign = async () => {
    if (!allChecked) return;
    setIsSubmitting(true);
    
    try {
      // Create tracing record
      await base44.entities.RadiationSafetyOnboarding.create({
        user_id: user.id,
        user_email: user.email,
        user_name: employeeName.trim(),
        clinic_id: user.role === 'customer' ? user.id : (user.customer_id || ''),
        completed_sections: sections.map(s => s.id),
        all_sections_completed: true,
        signed: true,
        signed_date: new Date().toISOString()
      });

      // (User profile update removed since it's no longer a blocking requirement, tracked via the entity)

      toast({ title: 'Klart', description: 'Onboarding slutförd och signerad.' });
      
      // Navigate back to the radiation safety dashboard
      navigate('/RadiationSafety');
      
    } catch (error) {
      console.error('Error signing onboarding:', error);
      toast({ title: 'Fel', description: 'Något gick fel vid sparningen. Försök igen.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  const handleScrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-primary text-primary-foreground py-6 px-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Strålsäkerhet & Säker Klinik (SSMFS 2026:1)
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Obligatorisk introduktionsguide för medarbetare
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => handleScrollTo(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  activeSection === s.id 
                    ? "bg-white text-primary border-white" 
                    : "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 text-white"
                )}
              >
                {checkedSections[s.id] && <CheckCircle2 className="w-3 h-3 inline-block mr-1" />}
                {s.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 py-8 space-y-8">
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
          <p className="text-sm text-blue-800">
            Denna guide måste läsas och avbockas. Genom att signera i slutet intygar du att du tagit del av och förstått innehållet.
          </p>
        </div>

        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isChecked = checkedSections[section.id];
          
          return (
            <Card 
              key={section.id} 
              id={section.id} 
              className={cn(
                "scroll-mt-32 transition-all duration-300", 
                isChecked ? "border-green-200 shadow-sm" : "border-slate-200 shadow-md",
                activeSection === section.id ? "ring-2 ring-primary/20" : ""
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-xl", 
                    isChecked ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                  )}>
                    <SectionIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                    <div className="prose prose-sm max-w-none mb-6">
                      {section.content}
                    </div>
                    
                    <div className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer",
                      isChecked ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    )}
                    onClick={() => handleCheck(section.id, !isChecked)}
                    >
                      <Checkbox 
                        id={`check-${section.id}`} 
                        checked={isChecked}
                        onCheckedChange={(c) => handleCheck(section.id, c)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 w-5 h-5"
                      />
                      <label 
                        htmlFor={`check-${section.id}`} 
                        className={cn("text-sm font-medium leading-none cursor-pointer select-none", isChecked ? "text-green-800" : "text-slate-700")}
                      >
                        Jag har läst och förstått informationen i detta avsnitt.
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        <Card className={cn(
          "mt-12 transition-all duration-500 overflow-hidden",
          allChecked ? "opacity-100 translate-y-0" : "opacity-50 translate-y-4 pointer-events-none grayscale"
        )}>
          <div className="bg-primary p-6 text-primary-foreground text-center">
            <h2 className="text-2xl font-bold">Slutför och Signera</h2>
            <p className="mt-2 text-primary-foreground/80">Bekräfta att du tagit del av rutinerna</p>
          </div>
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="bg-amber-50 text-amber-900 p-4 rounded-lg border border-amber-200 max-w-2xl w-full">
              <div className="flex justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <p className="font-medium">
                "Jag intygar härmed att jag har tagit del av klinikens strålsäkerhetsrutiner och förbinder mig att följa dem."
              </p>
            </div>
            
            <div className="grid gap-2 text-left w-full max-w-sm mb-4">
              <label className="text-sm font-semibold">Ditt för- och efternamn (Medarbetare)</label>
              <input 
                type="text" 
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Skriv ditt namn här..."
              />
            </div>
            
            <Button 
              size="lg" 
              className="w-full max-w-sm h-14 text-lg" 
              disabled={!allChecked || isSubmitting || !employeeName.trim()}
              onClick={handleSign}
            >
              {isSubmitting ? 'Signerar...' : 'Signera och Gå vidare'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Signeringen registreras med dagens datum och sparas på din användarprofil.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}