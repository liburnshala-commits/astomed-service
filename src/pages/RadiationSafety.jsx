import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ShieldAlert, FileText, Activity, AlertTriangle, CheckCircle, Users, Info, Settings2, Trophy, Target, AlertCircle, CheckCircle2, Clock, BookOpen, Zap, Award, ClipboardList, ShieldCheck, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import AnnualWheel from '@/components/safety/AnnualWheel';

import { useSearchParams } from 'react-router-dom';

const useDraftState = (key, defaultStateFn) => {
  const [state, setState] = useState({});
  
  useEffect(() => {
    if (state && !state.id && Object.keys(state).length > 0) {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [state, key]);

  const openNew = () => {
    try {
      const draft = localStorage.getItem(key);
      if (draft) {
        setState(JSON.parse(draft));
        return;
      }
    } catch(e) {}
    setState(defaultStateFn());
  };

  const clearDraft = () => {
    localStorage.removeItem(key);
    setState(defaultStateFn());
  };

  return [state, setState, openNew, clearDraft];
};

export default function RadiationSafety() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("methods");
  
  // Method State
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [currentMethod, setCurrentMethod, openNewMethod, clearMethodDraft] = useDraftState('rs_draft_method', () => ({}));

  // Incident State
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [currentIncident, setCurrentIncident, openNewIncident, clearIncidentDraft] = useDraftState('rs_draft_incident', () => ({ status: 'open' }));

  // Treatment State
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [currentTreatment, setCurrentTreatment, openNewTreatment, clearTreatmentDraft] = useDraftState('rs_draft_treatment', () => ({}));

  // New States
  const [personnelModalOpen, setPersonnelModalOpen] = useState(false);
  const [currentPersonnel, setCurrentPersonnel, openNewPersonnel, clearPersonnelDraft] = useDraftState('rs_draft_personnel', () => ({}));
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);
  const [currentDelegation, setCurrentDelegation, openNewDelegation, clearDelegationDraft] = useDraftState('rs_draft_delegation', () => ({}));
  const [clientInfoModalOpen, setClientInfoModalOpen] = useState(false);
  const [currentClientInfo, setCurrentClientInfo, openNewClientInfo, clearClientInfoDraft] = useDraftState('rs_draft_clientInfo', () => ({}));
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [currentMeasurement, setCurrentMeasurement, openNewMeasurement, clearMeasurementDraft] = useDraftState('rs_draft_measurement', () => ({}));
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [currentLocationCheck, setCurrentLocationCheck, openNewLocationCheck, clearLocationCheckDraft] = useDraftState('rs_draft_locationCheck', () => ({}));
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [currentAudit, setCurrentAudit, openNewAudit, clearAuditDraft] = useDraftState('rs_draft_audit', () => ({}));

  const [selectedAdminClinicId, setSelectedAdminClinicId] = useState('all');
  const isCustomer = user?.role === 'customer';
  const clinicId = isCustomer ? user.id : selectedAdminClinicId;

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.filter({}),
    enabled: !isCustomer
  });

  // Queries
  const { data: methods = [] } = useQuery({
    queryKey: ['methods', clinicId],
    queryFn: () => base44.entities.MethodDescription.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', clinicId],
    queryFn: () => base44.entities.IncidentReport.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', clinicId],
    queryFn: () => base44.entities.TreatmentDocumentation.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: personnel = [] } = useQuery({
    queryKey: ['personnel', clinicId],
    queryFn: () => base44.entities.PersonnelCompetence.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: delegations = [] } = useQuery({
    queryKey: ['delegations', clinicId],
    queryFn: () => base44.entities.ResponsibilityDelegation.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: clientInfos = [] } = useQuery({
    queryKey: ['clientInfos', clinicId],
    queryFn: () => base44.entities.ClientInformationSheet.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements', clinicId],
    queryFn: () => base44.entities.MeasurementReport.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: serviceRecords = [] } = useQuery({
    queryKey: ['serviceRecords', clinicId],
    queryFn: () => base44.entities.ServiceRecord.filter(clinicId !== 'all' ? { customer_id: clinicId } : {}),
  });

  const { data: locationChecks = [] } = useQuery({
    queryKey: ['locationChecks', clinicId],
    queryFn: () => base44.entities.LocationSafetyCheck.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: annualAudits = [] } = useQuery({
    queryKey: ['annualAudits', clinicId],
    queryFn: () => base44.entities.AnnualAudit.filter(clinicId !== 'all' ? { clinic_id: clinicId } : {}),
  });

  const { data: machines = [] } = useQuery({
    queryKey: ['machines', clinicId],
    queryFn: () => base44.entities.Machine.filter(clinicId !== 'all' ? { customer_id: clinicId } : {}),
  });

  React.useEffect(() => {
    const incidentId = searchParams.get('incidentId');
    if (incidentId && incidents.length > 0) {
      const incident = incidents.find(i => i.id === incidentId);
      if (incident) {
        setActiveTab("incidents");
        setCurrentIncident(incident);
        setIncidentModalOpen(true);
      }
    }
  }, [searchParams, incidents]);

  // Gamification & Progress
  const openIncidentsCount = incidents.filter(i => i.status !== 'closed').length;
  
  let score = 0;
  if (methods.length > 0) score += 15;
  if (treatments.length > 0) score += 15;
  if (personnel.length > 0) score += 15;
  if (delegations.length > 0) score += 15;
  if (clientInfos.length > 0) score += 10;
  if (measurements.length > 0 || serviceRecords.length > 0) score += 10;
  if (locationChecks.length > 0) score += 10;
  if (annualAudits.length > 0) score += 10;

  const getStatusIcon = (isComplete, hasWarning = false) => {
    if (hasWarning) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    if (isComplete) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <Clock className="w-5 h-5 text-slate-300" />;
  };

  // Mutations
  const getPayload = (data, dateField = null, isDateTime = false) => {
    const targetClinicId = clinicId !== 'all' ? clinicId : (data.clinic_id || user.id);
    const payload = { ...data, clinic_id: targetClinicId };
    if (!data.id && dateField) {
      payload[dateField] = isDateTime ? new Date().toISOString() : new Date().toISOString().split('T')[0];
    }
    return payload;
  };

  const saveMethod = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data);
      if (data.id) return base44.entities.MethodDescription.update(data.id, payload);
      return base44.entities.MethodDescription.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['methods']);
      setMethodModalOpen(false);
      clearMethodDraft();
      toast({ title: "Sparad", description: "Metodbeskrivningen har sparats." });
    }
  });

  const saveIncident = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data, 'incident_date', true);
      if (data.id) return base44.entities.IncidentReport.update(data.id, payload);
      return base44.entities.IncidentReport.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents']);
      setIncidentModalOpen(false);
      clearIncidentDraft();
      toast({ title: "Sparad", description: "Incidenten har sparats." });
    }
  });

  const saveTreatment = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data, 'treatment_date', true);
      if (data.id) return base44.entities.TreatmentDocumentation.update(data.id, payload);
      return base44.entities.TreatmentDocumentation.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['treatments']);
      setTreatmentModalOpen(false);
      clearTreatmentDraft();
      toast({ title: "Sparad", description: "Dokumentationen har sparats." });
    }
  });

  const savePersonnel = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data, 'training_date', false);
      if (data.id) return base44.entities.PersonnelCompetence.update(data.id, payload);
      return base44.entities.PersonnelCompetence.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['personnel']); setPersonnelModalOpen(false); clearPersonnelDraft(); toast({ title: "Sparad" }); }
  });

  const saveDelegation = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data, 'date_assigned', false);
      if (data.id) return base44.entities.ResponsibilityDelegation.update(data.id, payload);
      return base44.entities.ResponsibilityDelegation.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['delegations']); setDelegationModalOpen(false); clearDelegationDraft(); toast({ title: "Sparad" }); }
  });

  const saveClientInfo = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data);
      if (data.id) return base44.entities.ClientInformationSheet.update(data.id, payload);
      return base44.entities.ClientInformationSheet.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['clientInfos']); setClientInfoModalOpen(false); clearClientInfoDraft(); toast({ title: "Sparad" }); }
  });

  const saveMeasurement = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data, 'measurement_date', false);
      if (data.id) return base44.entities.MeasurementReport.update(data.id, payload);
      return base44.entities.MeasurementReport.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['measurements']); setMeasurementModalOpen(false); clearMeasurementDraft(); toast({ title: "Sparad" }); }
  });

  const saveLocationCheck = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data, 'check_date', false);
      if (data.id) return base44.entities.LocationSafetyCheck.update(data.id, payload);
      return base44.entities.LocationSafetyCheck.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['locationChecks']); setLocationModalOpen(false); clearLocationCheckDraft(); toast({ title: "Sparad" }); }
  });

  const saveAudit = useMutation({
    mutationFn: (data) => {
      const payload = getPayload(data, 'audit_date', false);
      if (data.id) return base44.entities.AnnualAudit.update(data.id, payload);
      return base44.entities.AnnualAudit.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['annualAudits']); setAuditModalOpen(false); clearAuditDraft(); toast({ title: "Sparad" }); }
  });

  const deleteDelegation = useMutation({
    mutationFn: (id) => base44.entities.ResponsibilityDelegation.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['delegations']); setDelegationModalOpen(false); toast({ title: "Borttagen" }); }
  });

  const deletePersonnel = useMutation({
    mutationFn: (id) => base44.entities.PersonnelCompetence.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['personnel']); setPersonnelModalOpen(false); toast({ title: "Borttagen" }); }
  });

  const deleteLocationCheck = useMutation({
    mutationFn: (id) => base44.entities.LocationSafetyCheck.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['locationChecks']); setLocationModalOpen(false); toast({ title: "Borttagen" }); }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-primary" />
          Strålsäkerhet (SSMFS 2026:1)
        </h1>
        <p className="text-muted-foreground mt-2">
          Hantera metoder, rutiner, incidenter och behandlingsdokumentation enligt Strålsäkerhetsmyndighetens föreskrifter.
        </p>
      </div>

      {!isCustomer && (
        <Card className="mb-8 border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-indigo-800">
              <Users className="w-5 h-5" />
              <span className="font-semibold whitespace-nowrap">Se som kund:</span>
            </div>
            <select 
              className="flex h-10 w-full md:max-w-md items-center justify-between rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedAdminClinicId}
              onChange={e => setSelectedAdminClinicId(e.target.value)}
            >
              <option value="all">Alla kunder (Översikt)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
            {selectedAdminClinicId !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setSelectedAdminClinicId('all')} className="whitespace-nowrap">
                Återställ vy
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gamification Dashboard */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6 pb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 bg-white p-4 rounded-full shadow-sm border border-blue-100">
            {score === 100 ? <Trophy className="w-12 h-12 text-yellow-500" /> : <Target className="w-12 h-12 text-blue-500" />}
          </div>
          <div className="flex-1 w-full space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {score === 100 ? "Wow! Din klinik är 100% compliant! 🎉" : "Din väg mot en säker klinik"}
                </h2>
                <p className="text-sm text-slate-600">
                  Du har slutfört {score}% av de rekommenderade stegen för en komplett strålsäkerhetsdokumentation.
                </p>
              </div>
              <span className="text-2xl font-black text-blue-600">{score}%</span>
            </div>
            <Progress value={score} className="h-3 bg-blue-100" />
          </div>
        </CardContent>
      </Card>

      <AnnualWheel 
        audits={annualAudits} 
        locationChecks={locationChecks} 
        measurements={measurements} 
        personnel={personnel} 
        serviceRecords={serviceRecords}
      />

      <Accordion type="single" collapsible value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <AccordionItem value="info" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-semibold flex-1 text-left">Information & Lagkrav</span>
              <Info className="w-5 h-5 text-slate-400 mr-2" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anmälningsplikt och Krav</CardTitle>
              <CardDescription>Vad som gäller för din verksamhet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Anmälan vart 5:e år</h3>
                  <p className="text-sm text-muted-foreground">Verksamheter som använder icke-joniserande strålning för estetiska behandlingar (t.ex. laser, IPL, RF, ultraljud) måste anmälas till SSM. Befintliga verksamheter ska anmälas senast 4 juli 2026.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Metodbeskrivningar & Rutiner</h3>
                  <p className="text-sm text-muted-foreground">Du måste ha skriftliga metodbeskrivningar för alla behandlingar, samt rutiner för underhåll och kontroll av utrustningen.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Individuell Bedömning & Dokumentation</h3>
                  <p className="text-sm text-muted-foreground">Inför varje behandling ska en bedömning göras och dokumenteras. All information ska bevaras i 3 år.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="methods" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <FileText className="w-5 h-5 text-indigo-500" />
              <span className="text-lg font-semibold flex-1 text-left">Metoder & Rutiner</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">{methods.length} st</span>
              <div className="mr-2">{getStatusIcon(methods.length > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
              <CardContent className="pt-6 pb-6 flex items-start gap-4">
                <div className="bg-white p-2 rounded-full"><Zap className="w-6 h-6 text-yellow-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Dags att beskriva era arbetsmetoder!</h3>
                  <p className="text-sm text-slate-600">
                    Dokumentera exakt hur varje behandling ska genomföras. Beskriv utrustningsinställningar, exponeringstider, vilka som får utföra behandlingen, riskbedömning och skyddsutrustning.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Dina Metoder</h2>
              <Button onClick={() => { openNewMethod(); setMethodModalOpen(true); }} className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Lägg till
              </Button>
            </div>

            {methods.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-slate-50/50">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Inga metoder inlagda ännu</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-4">Låt oss lägga grunden för en säker klinik! Klicka på knappen ovan för att lägga till er första metod.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {methods.map(method => (
                  <Card key={method.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setCurrentMethod(method); setMethodModalOpen(true); }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" /> {method.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 line-clamp-2">{method.description}</p>
                      {method.is_routine && <span className="inline-block mt-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Allmän Rutin</span>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="incidents" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-lg font-semibold flex-1 text-left">Incidenter</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">
                {openIncidentsCount > 0 ? <span className="text-red-500 font-medium">{openIncidentsCount} öppna</span> : `${incidents.length} st`}
              </span>
              <div className="mr-2">{getStatusIcon(true, openIncidentsCount > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t">
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 mb-6">
              <CardContent className="pt-6 pb-6 flex items-start gap-4">
                <div className="bg-white p-2 rounded-full"><AlertCircle className="w-6 h-6 text-red-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Rapportera för att lära och förbättra</h3>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>
                      Rapportera alla oväntade händelser eller skador. Dokumentera vad som hände och vilka åtgärder som togs.
                    </p>
                    <p>
                      <strong>Strålsäkerhetsmyndigheten (SSM):</strong> Incidenter som har betydelse från strålskyddssynpunkt ska rapporteras. 
                      <a href="https://www.stralsakerhetsmyndigheten.se/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">Läs mer hos SSM</a>
                    </p>
                    <p>
                      <strong>Läkemedelsverket:</strong> Allvarliga tillbud som rör en medicinteknisk produkt ska rapporteras hit. 
                      <a href="https://www.lakemedelsverket.se/sv/medicinteknik/folj-upp-anvandning/rapportering-av-allvarliga-tillbud" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">Läs mer hos Läkemedelsverket</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Dina Incidenter</h2>
              <Button onClick={() => { openNewIncident(); setIncidentModalOpen(true); }} variant="destructive" className="shadow-sm">
                <AlertTriangle className="w-4 h-4 mr-2" /> Rapportera
              </Button>
            </div>

            {incidents.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-slate-50/50">
                <Award className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Härligt, inga incidenter!</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-4">Bra jobbat med säkerheten! Skulle något hända, vet du var du ska rapportera det.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map(inc => (
                  <Card key={inc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setCurrentIncident(inc); setIncidentModalOpen(true); }}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${inc.status === 'closed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {inc.status === 'closed' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          {inc.title}
                        </CardTitle>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{new Date(inc.incident_date).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-slate-600 line-clamp-2">{inc.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="treatments" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <Activity className="w-5 h-5 text-teal-500" />
              <span className="text-lg font-semibold flex-1 text-left">Behandlingsdokumentation</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">{treatments.length} st</span>
              <div className="mr-2">{getStatusIcon(treatments.length > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t">
            <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 mb-6">
              <CardContent className="pt-6 pb-6 flex items-start gap-4">
                <div className="bg-white p-2 rounded-full"><Activity className="w-6 h-6 text-teal-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Spåra dina behandlingar (Journalföring)</h3>
                  <p className="text-sm text-slate-600">
                    Dokumentera varje behandling noga. Bekräfta att individuell bedömning gjorts och att patienten fått information. Enligt lag ska detta bevaras i minst 3 år.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Din Dokumentation</h2>
              <Button onClick={() => { openNewTreatment(); setTreatmentModalOpen(true); }} className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Lägg till
              </Button>
            </div>

            {treatments.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-slate-50/50">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Ingen dokumentation registrerad</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-4">Det är dags att logga er första behandling. Klicka på knappen ovan för att komma igång.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {treatments.map(trt => (
                  <Card key={trt.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setCurrentTreatment(trt); setTreatmentModalOpen(true); }}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md flex items-center gap-2">
                          <div className="bg-teal-100 text-teal-700 p-1.5 rounded-full"><Activity className="w-4 h-4" /></div>
                          Patient: {trt.patient_id || 'Okänd'}
                        </CardTitle>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{trt.treatment_date ? new Date(trt.treatment_date).toLocaleString('sv-SE').slice(0,16) : ''}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 space-y-2">
                      {trt.signature && (
                        <p className="text-xs text-slate-500">Utförd av: {trt.signature}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs font-medium mt-1">
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${trt.individual_assessment_done ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'}`}>
                          <CheckCircle className={`w-3 h-3 ${trt.individual_assessment_done ? 'text-green-500' : 'text-slate-400'}`} /> Bedömning
                        </span>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${trt.pre_treatment_info_given ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'}`}>
                          <CheckCircle className={`w-3 h-3 ${trt.pre_treatment_info_given ? 'text-green-500' : 'text-slate-400'}`} /> Info given
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="personnel" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-lg font-semibold flex-1 text-left">Personal & Ansvar</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">{personnel.length} pers, {delegations.length} roller</span>
              <div className="mr-2">{getStatusIcon(personnel.length > 0 && delegations.length > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t space-y-8">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 mb-6">
              <CardContent className="pt-6 pb-6 flex items-start gap-4">
                <div className="bg-white p-2 rounded-full"><Users className="w-6 h-6 text-purple-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Rätt person på rätt plats</h3>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>1. <strong>Ansvarsdelegering:</strong> Tilldela viktiga roller (t.ex. Strålskyddsansvarig) till din personal.</p>
                    <p>2. <strong>Personal & Kompetens:</strong> Registrera teamet och bocka av deras strålskyddsutbildningar.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ansvarsdelegering</h2>
              <Button onClick={() => { openNewDelegation(); setDelegationModalOpen(true); }} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Ny Delegering
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {delegations.map(del => (
                <Card key={del.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentDelegation(del); setDelegationModalOpen(true); }}>
                  <CardHeader className="py-3"><CardTitle className="text-md">{del.role_title}</CardTitle></CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm font-semibold">{del.assigned_to_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{del.responsibilities}</p>
                    <div className="mt-2">
                      {del.employee_approved ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Godkänd</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚠ Avvaktar godkännande</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Personal & Kompetens</h2>
              <Button onClick={() => { openNewPersonnel(); setPersonnelModalOpen(true); }} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Lägg till
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personnel.map(pers => (
                <Card key={pers.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentPersonnel(pers); setPersonnelModalOpen(true); }}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-md flex items-center gap-2"><Users className="w-4 h-4" />{pers.employee_name}</CardTitle>
                    <CardDescription>{pers.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-2">
                    {pers.radiation_safety_training && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Strålskyddsutbildad</span>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="client_info" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <ClipboardList className="w-5 h-5 text-pink-500" />
              <span className="text-lg font-semibold flex-1 text-left">Klientinformationsblad</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">{clientInfos.length} st</span>
              <div className="mr-2">{getStatusIcon(clientInfos.length > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t">
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardHeader>
              <CardTitle className="text-base">Vad du behöver göra här</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Skapa skriftliga informationsblad för varje behandling. Dessa ska innehålla behandlingsbeskrivning, möjliga risker, biverkningar och eftervårdsinstruktioner. Du måste ge denna information till klienterna innan behandling.
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Klientinformationsblad</h2>
            <Button onClick={() => { openNewClientInfo(); setClientInfoModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nytt Blad
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {clientInfos.map(info => (
              <Card key={info.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentClientInfo(info); setClientInfoModalOpen(true); }}>
                <CardHeader className="py-3">
                  <CardTitle className="text-md flex items-center gap-2"><Info className="w-4 h-4 text-primary" />{info.title}</CardTitle>
                  <CardDescription>Version {info.version}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="measurements" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <Settings2 className="w-5 h-5 text-cyan-500" />
              <span className="text-lg font-semibold flex-1 text-left">Mätrapporter</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">{measurements.length + serviceRecords.length} st</span>
              <div className="mr-2">{getStatusIcon(measurements.length > 0 || serviceRecords.length > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t">
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardHeader>
              <CardTitle className="text-base">Vad du behöver göra här</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Registrera mätningar av lasereffekt och andra tekniska parametrar. Dessa mätningar visar att utrustningen fungerar korrekt och dokumenteras för kontroll- och kalibreringssyften.
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Mätrapporter (Laser/IPL)</h2>
            <Button onClick={() => { openNewMeasurement(); setMeasurementModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Ny Mätning
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {measurements.map(meas => (
              <Card key={meas.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentMeasurement(meas); setMeasurementModalOpen(true); }}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" />Manuell Mätning</CardTitle>
                    <span className="text-xs text-muted-foreground">{meas.measurement_date ? new Date(meas.measurement_date).toLocaleDateString() : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm">Effekt: {meas.laser_power_measured}</p>
                  {meas.pulse_parameters && <p className="text-sm text-slate-500">Pulser: {meas.pulse_parameters}</p>}
                </CardContent>
              </Card>
            ))}
            {serviceRecords.map(record => (
              <Card key={record.id} className="bg-slate-50 border-slate-200">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center gap-2"><Settings2 className="w-4 h-4 text-indigo-500" />Servicemätning</CardTitle>
                    <span className="text-xs text-muted-foreground">{record.service_date ? new Date(record.service_date).toLocaleDateString() : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm">Beskrivning: {record.description || 'Ingen beskrivning'}</p>
                  {record.measured_laser_power && <p className="text-sm mt-1">Uppmätt effekt: <span className="font-semibold">{record.measured_laser_power}</span></p>}
                  {record.pulse_count && <p className="text-sm text-slate-500">Antal pulser: {record.pulse_count}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-semibold flex-1 text-left">Lokal & Skydd</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">{locationChecks.length} st</span>
              <div className="mr-2">{getStatusIcon(locationChecks.length > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t">
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardHeader><CardTitle className="text-base">Vad du behöver göra här</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Kontrollera löpande att behandlingsrummet uppfyller säkerhetskraven (skyltar, fönster, inga speglar) och att skyddsutrustningen är i gott skick.
            </CardContent>
          </Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Lokalsäkerhet & Skyddsutrustning</h2>
            <Button onClick={() => { openNewLocationCheck(); setLocationModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Ny Kontroll</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {locationChecks.map(check => (
              <Card key={check.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentLocationCheck(check); setLocationModalOpen(true); }}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-primary" />Kontroll</CardTitle>
                    <span className="text-xs text-muted-foreground">{check.check_date ? new Date(check.check_date).toLocaleDateString() : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-2 text-sm text-muted-foreground">
                  <p>Utförd av: {check.checked_by}</p>
                </CardContent>
              </Card>
            ))}
            {locationChecks.length === 0 && <p className="text-muted-foreground">Inga kontroller registrerade.</p>}
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="audit" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <Award className="w-5 h-5 text-fuchsia-500" />
              <span className="text-lg font-semibold flex-1 text-left">Årlig Internrevision</span>
              <span className="text-sm font-normal text-muted-foreground hidden md:inline">{annualAudits.length} st</span>
              <div className="mr-2">{getStatusIcon(annualAudits.length > 0)}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-4 border-t">
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardHeader><CardTitle className="text-base">Vad du behöver göra här</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Utför en årlig internrevision (egenkontroll) av strålskyddet. Gå igenom rutiner, incidenter och personalens utbildningar för att se om något behöver förbättras.
            </CardContent>
          </Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Årlig Internrevision</h2>
            <Button onClick={() => { openNewAudit(); setAuditModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Ny Revision</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {annualAudits.map(audit => (
              <Card key={audit.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentAudit(audit); setAuditModalOpen(true); }}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />Revision</CardTitle>
                    <span className="text-xs text-muted-foreground">{audit.audit_date ? new Date(audit.audit_date).toLocaleDateString() : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-2 text-sm text-muted-foreground">
                  <p>Utförd av: {audit.auditor_name}</p>
                </CardContent>
              </Card>
            ))}
            {annualAudits.length === 0 && <p className="text-muted-foreground">Inga revisioner registrerade.</p>}
          </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Method Modal */}
      <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentMethod.id ? 'Redigera Metod' : 'Ny Metodbeskrivning'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Titel</Label>
              <Input value={currentMethod.title || ''} onChange={e => setCurrentMethod({...currentMethod, title: e.target.value})} placeholder="t.ex. Hårborttagning Laser" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_routine" checked={currentMethod.is_routine || false} onCheckedChange={c => setCurrentMethod({...currentMethod, is_routine: c})} />
              <Label htmlFor="is_routine">Detta är en allmän rutin (t.ex. för underhåll) snarare än en behandlingsmetod</Label>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="overview">
                <AccordionTrigger>1. Behandlingsöversikt</AccordionTrigger>
                <AccordionContent className="space-y-4 p-1">
                  <div className="grid gap-2"><Label>Syfte</Label><Textarea value={currentMethod.description || ''} onChange={e => setCurrentMethod({...currentMethod, description: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Principer för metoden</Label><Textarea value={currentMethod.principles || ''} onChange={e => setCurrentMethod({...currentMethod, principles: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Indikationer</Label><Textarea value={currentMethod.indications || ''} onChange={e => setCurrentMethod({...currentMethod, indications: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Kontraindikationer</Label><Textarea value={currentMethod.contraindications || ''} onChange={e => setCurrentMethod({...currentMethod, contraindications: e.target.value})} /></div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prep">
                <AccordionTrigger>2. Förberedelser</AccordionTrigger>
                <AccordionContent className="space-y-4 p-1">
                  <div className="grid gap-2"><Label>Inför kundbesöket</Label><Textarea value={currentMethod.pre_visit_instructions || ''} onChange={e => setCurrentMethod({...currentMethod, pre_visit_instructions: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Vid kundens ankomst</Label><Textarea value={currentMethod.arrival_procedure || ''} onChange={e => setCurrentMethod({...currentMethod, arrival_procedure: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Informationsgivning & Samtycke</Label><Textarea value={currentMethod.consent_and_info || ''} onChange={e => setCurrentMethod({...currentMethod, consent_and_info: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Hudbedömning / Patchtest</Label><Textarea value={currentMethod.skin_assessment || ''} onChange={e => setCurrentMethod({...currentMethod, skin_assessment: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Kontroll av utrustning före start</Label><Textarea value={currentMethod.equipment_check || ''} onChange={e => setCurrentMethod({...currentMethod, equipment_check: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Hygienrutiner</Label><Textarea value={currentMethod.hygiene_routines || ''} onChange={e => setCurrentMethod({...currentMethod, hygiene_routines: e.target.value})} /></div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="execution">
                <AccordionTrigger>3. Utförande av Behandling</AccordionTrigger>
                <AccordionContent className="space-y-4 p-1">
                  <div className="grid gap-2"><Label>Krav på kompetens</Label><Input value={currentMethod.required_competence || ''} onChange={e => setCurrentMethod({...currentMethod, required_competence: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Steg-för-steg-instruktioner</Label><Textarea value={currentMethod.step_by_step_instructions || ''} onChange={e => setCurrentMethod({...currentMethod, step_by_step_instructions: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Utrustning & Inställningar</Label><Textarea value={currentMethod.equipment_settings || ''} onChange={e => setCurrentMethod({...currentMethod, equipment_settings: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Exponeringstider / Antal pulser</Label><Input value={currentMethod.exposure_times || ''} onChange={e => setCurrentMethod({...currentMethod, exposure_times: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Skyddsutrustning (Personal)</Label><Input value={currentMethod.staff_protective_equipment || ''} onChange={e => setCurrentMethod({...currentMethod, staff_protective_equipment: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Skyddsutrustning (Kund)</Label><Input value={currentMethod.customer_protective_equipment || ''} onChange={e => setCurrentMethod({...currentMethod, customer_protective_equipment: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Riskbedömning under behandling</Label><Textarea value={currentMethod.risk_assessment || ''} onChange={e => setCurrentMethod({...currentMethod, risk_assessment: e.target.value})} /></div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="after">
                <AccordionTrigger>4. Efter Behandlingen</AccordionTrigger>
                <AccordionContent className="space-y-4 p-1">
                  <div className="grid gap-2"><Label>Omedelbar eftervård</Label><Textarea value={currentMethod.immediate_aftercare || ''} onChange={e => setCurrentMethod({...currentMethod, immediate_aftercare: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Information om eftervård (till kund)</Label><Textarea value={currentMethod.aftercare_info || ''} onChange={e => setCurrentMethod({...currentMethod, aftercare_info: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Dokumentation i journal</Label><Textarea value={currentMethod.documentation_routines || ''} onChange={e => setCurrentMethod({...currentMethod, documentation_routines: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Städning och desinfektion</Label><Textarea value={currentMethod.cleaning_routines || ''} onChange={e => setCurrentMethod({...currentMethod, cleaning_routines: e.target.value})} /></div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="safety">
                <AccordionTrigger>5. Säkerhet & Nödrutiner</AccordionTrigger>
                <AccordionContent className="space-y-4 p-1">
                  <div className="grid gap-2"><Label>Risker och möjliga biverkningar</Label><Textarea value={currentMethod.risks_and_side_effects || ''} onChange={e => setCurrentMethod({...currentMethod, risks_and_side_effects: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Åtgärder vid biverkningar/skada</Label><Textarea value={currentMethod.emergency_actions || ''} onChange={e => setCurrentMethod({...currentMethod, emergency_actions: e.target.value})} /></div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button onClick={() => saveMethod.mutate(currentMethod)} className="w-full" disabled={saveMethod.isPending}>
              Spara Metod
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Incident Modal */}
      <Dialog open={incidentModalOpen} onOpenChange={setIncidentModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{currentIncident.id ? 'Redigera Incident' : 'Rapportera Incident'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Titel</Label>
                <Input value={currentIncident.title || ''} onChange={e => setCurrentIncident({...currentIncident, title: e.target.value})} placeholder="Kort titel på händelsen" />
              </div>
              <div className="grid gap-2">
                <Label>Plats för händelsen</Label>
                <Input value={currentIncident.location || ''} onChange={e => setCurrentIncident({...currentIncident, location: e.target.value})} placeholder="T.ex. Behandlingsrum 1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Datum</Label>
                {currentIncident.id ? (
                  <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border">{new Date(currentIncident.incident_date).toLocaleString('sv-SE').slice(0,16)}</div>
                ) : (
                  <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border text-muted-foreground">Sätts automatiskt till dagens datum</div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Maskin/Utrustning (Frivilligt)</Label>
                <Input value={currentIncident.machine_id || ''} onChange={e => setCurrentIncident({...currentIncident, machine_id: e.target.value})} placeholder="Serie- eller modellnummer" />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Händelseförlopp</Label>
              <Textarea value={currentIncident.description || ''} onChange={e => setCurrentIncident({...currentIncident, description: e.target.value})} placeholder="Beskriv vad som hände i detalj..." className="min-h-[100px]" />
            </div>
            <div className="grid gap-2">
              <Label>Vidtagna åtgärder / Förbättringar</Label>
              <Textarea value={currentIncident.actions_taken || ''} onChange={e => setCurrentIncident({...currentIncident, actions_taken: e.target.value})} placeholder="Vad har gjorts för att förhindra att det händer igen?" className="min-h-[100px]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3 border rounded-md bg-muted/20">
                <Label className="font-semibold text-sm">Extern rapportering</Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="ssm" checked={currentIncident.reported_to_ssm || false} onCheckedChange={c => setCurrentIncident({...currentIncident, reported_to_ssm: c})} />
                  <Label htmlFor="ssm">Rapporterad till SSM</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="lakemedelsverket" checked={currentIncident.reported_to_lakemedelsverket || false} onCheckedChange={c => setCurrentIncident({...currentIncident, reported_to_lakemedelsverket: c})} />
                  <Label htmlFor="lakemedelsverket">Rapporterad till Läkemedelsverket</Label>
                </div>
                <div className="grid gap-2 mt-2">
                  <Label className="text-xs">Rapporterad till annan (t.ex. tillverkare, IVO)</Label>
                  <Input value={currentIncident.reported_to_other || ''} onChange={e => setCurrentIncident({...currentIncident, reported_to_other: e.target.value})} placeholder="T.ex. Tillverkaren" className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label>Status på utredning:</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={currentIncident.status || 'open'} 
                    onChange={e => setCurrentIncident({...currentIncident, status: e.target.value})}
                  >
                    <option value="open">Öppen (Ohanterad)</option>
                    <option value="investigated">Utreds</option>
                    <option value="closed">Stängd/Åtgärdad</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Patient/Behandlings-ID (Frivilligt)</Label>
                  <Input value={currentIncident.treatment_id || ''} onChange={e => setCurrentIncident({...currentIncident, treatment_id: e.target.value})} placeholder="Referens till behandling" />
                </div>
              </div>
            </div>
            <Button onClick={() => saveIncident.mutate(currentIncident)} className="w-full" disabled={saveIncident.isPending}>
              Spara Incident
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Treatment Modal */}
      <Dialog open={treatmentModalOpen} onOpenChange={setTreatmentModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Behandlingsdokumentation (Journalföring)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Patient Ref / ID (Anonymiserad)</Label>
                <Input value={currentTreatment.patient_id || ''} onChange={e => setCurrentTreatment({...currentTreatment, patient_id: e.target.value})} placeholder="t.ex. Patient 123" />
              </div>
              <div className="grid gap-2">
                <Label>Datum och tid</Label>
                {currentTreatment.id ? (
                  <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border">{new Date(currentTreatment.treatment_date).toLocaleString('sv-SE').slice(0,16)}</div>
                ) : (
                  <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border text-muted-foreground">Sätts automatiskt vid sparning</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Använd maskin / utrustning</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentTreatment.machine_id || ''} 
                  onChange={e => setCurrentTreatment({...currentTreatment, machine_id: e.target.value})}
                >
                  <option value="">-- Välj maskin --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.model} {m.serial_number ? `(${m.serial_number})` : ''}</option>
                  ))}
                  <option value="other">Annan / Olistad maskin</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Tillämpad metodbeskrivning</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentTreatment.method_id || ''} 
                  onChange={e => setCurrentTreatment({...currentTreatment, method_id: e.target.value})}
                >
                  <option value="">-- Välj metod --</option>
                  {methods.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <Label className="font-semibold text-sm">Checklista inför behandling</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="ind_ass" checked={currentTreatment.individual_assessment_done || false} onCheckedChange={c => setCurrentTreatment({...currentTreatment, individual_assessment_done: c})} />
                <Label htmlFor="ind_ass">Individuell bedömning utförd och dokumenterad enligt rutin</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="pre_info" checked={currentTreatment.pre_treatment_info_given || false} onCheckedChange={c => setCurrentTreatment({...currentTreatment, pre_treatment_info_given: c})} />
                <Label htmlFor="pre_info">Skriftlig och muntlig information har getts till kunden</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="prot_eq" checked={currentTreatment.protective_equipment_used || false} onCheckedChange={c => setCurrentTreatment({...currentTreatment, protective_equipment_used: c})} />
                <Label htmlFor="prot_eq">Skyddsutrustning använd enligt metodbeskrivning</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Utrustningsinställningar (Exakta värden under denna behandling)</Label>
              <Textarea value={currentTreatment.equipment_settings_used || ''} onChange={e => setCurrentTreatment({...currentTreatment, equipment_settings_used: e.target.value})} placeholder="T.ex. Fluens: 25 J/cm2, Pulslängd: 30 ms..." />
            </div>
            <div className="grid gap-2">
              <Label>Avvikelser under behandling / Kommentarer</Label>
              <Textarea placeholder="Lämna tomt om behandlingen förlöpte enligt standardrutin. Skriv in om hudreaktion uppstod eller om inställningar ändrades." value={currentTreatment.deviations || ''} onChange={e => setCurrentTreatment({...currentTreatment, deviations: e.target.value})} />
            </div>

            <div className="grid gap-2">
              <Label>Signatur (Namn på utförare)</Label>
              <Input value={currentTreatment.signature || ''} onChange={e => setCurrentTreatment({...currentTreatment, signature: e.target.value})} placeholder="Ditt namn" />
            </div>
            
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md mt-2">
              <strong>Lagkrav:</strong> Enligt SSM ska denna behandlingsdokumentation bevaras i minst tre (3) år.
            </div>
            
            <Button onClick={() => saveTreatment.mutate(currentTreatment)} className="w-full mt-2" disabled={saveTreatment.isPending}>
              Spara Dokumentation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delegation Modal */}
      <Dialog open={delegationModalOpen} onOpenChange={setDelegationModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{currentDelegation.id ? 'Redigera Ansvarsdelegering' : 'Formell Ansvarsdelegering'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-purple-50 text-purple-800 p-3 rounded-md text-sm mb-2">
              Använd denna mall för att formellt delegera uppgifter, till exempel rollen som <strong>Strålskyddsansvarig</strong>. Det är viktigt att delegeringen är tydlig och accepterad.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Delegerad Roll / Titel</Label>
                <Input value={currentDelegation.role_title || ''} onChange={e => setCurrentDelegation({...currentDelegation, role_title: e.target.value})} placeholder="t.ex. Strålskyddsansvarig" />
              </div>
              <div className="grid gap-2">
                <Label>Delegeras till (Namn)</Label>
                <Input value={currentDelegation.assigned_to_name || ''} onChange={e => setCurrentDelegation({...currentDelegation, assigned_to_name: e.target.value})} placeholder="Namn på anställd" />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Beskrivning av ansvarsområden och befogenheter</Label>
              <Textarea 
                value={currentDelegation.responsibilities || ''} 
                onChange={e => setCurrentDelegation({...currentDelegation, responsibilities: e.target.value})} 
                placeholder="Beskriv i detalj vad personen ansvarar för, t.ex. uppdatera metoder, hålla årlig internrevision, eller kontrollera utrustning."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Datum för delegering</Label>
              {currentDelegation.id ? (
                <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border">{currentDelegation.date_assigned}</div>
              ) : (
                <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border text-muted-foreground">Sätts automatiskt till dagens datum</div>
              )}
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 mt-4">
              <h4 className="font-semibold text-sm mb-2 text-slate-800">Formellt Godkännande (Signering)</h4>
              <p className="text-xs text-slate-600 mb-3">
                Genom att kryssa i nedan intygas att ovanstående person har tagit del av, förstått och accepterat ansvarsdelegeringen.
              </p>
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="emp_appr" 
                  checked={currentDelegation.employee_approved || false} 
                  onCheckedChange={c => setCurrentDelegation({...currentDelegation, employee_approved: c, approval_date: c ? new Date().toISOString().split('T')[0] : ''})} 
                />
                <label htmlFor="emp_appr" className="text-sm cursor-pointer font-medium text-slate-800">
                  Jag bekräftar att ansvaret har godkänts av den delegerade personen
                </label>
              </div>
              {currentDelegation.employee_approved && (
                <div className="mt-2 ml-6 text-sm text-green-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Signerad och godkänd: {currentDelegation.approval_date}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => saveDelegation.mutate(currentDelegation)} className="flex-1">Spara Delegering</Button>
              {currentDelegation.id && (
                <Button variant="destructive" onClick={() => { if (confirm('Ta bort denna delegering?')) deleteDelegation.mutate(currentDelegation.id); }} className="w-auto px-4">
                  Ta bort
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Personnel Modal */}
      <Dialog open={personnelModalOpen} onOpenChange={setPersonnelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{currentPersonnel.id ? 'Redigera Kompetens & Utbildning' : 'Ny Personal'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Namn på anställd</Label>
              <Input value={currentPersonnel.employee_name || ''} onChange={e => setCurrentPersonnel({...currentPersonnel, employee_name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Yrkesroll / Titel</Label>
              <Input value={currentPersonnel.role || ''} onChange={e => setCurrentPersonnel({...currentPersonnel, role: e.target.value})} placeholder="t.ex. Auktoriserad Hudterapeut, Sjuksköterska" />
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <Label className="font-semibold text-base">Strålskyddsutbildning</Label>
              <div className="p-3 bg-muted/20 border rounded-md space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="rad_saf" checked={currentPersonnel.radiation_safety_training || false} onCheckedChange={c => setCurrentPersonnel({...currentPersonnel, radiation_safety_training: c, training_date: c ? (currentPersonnel.training_date || new Date().toISOString().split('T')[0]) : ''})} />
                  <Label htmlFor="rad_saf" className="font-medium">Har genomgått dokumenterad strålskyddsutbildning</Label>
                </div>
                {currentPersonnel.radiation_safety_training && (
                  <div className="grid gap-2 pl-6">
                    <Label className="text-xs">Datum för senaste utbildning</Label>
                    <Input type="date" value={currentPersonnel.training_date || ''} onChange={e => setCurrentPersonnel({...currentPersonnel, training_date: e.target.value})} className="h-8" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Auktoriserad att utföra följande metoder/behandlingar</Label>
              <Textarea 
                value={currentPersonnel.authorized_methods ? currentPersonnel.authorized_methods.join(', ') : ''} 
                onChange={e => setCurrentPersonnel({...currentPersonnel, authorized_methods: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                placeholder="T.ex. Hårborttagning Laser, IPL Kärl (Separera med kommatecken)"
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">Listar vilka maskiner/metoder denna person bedömts ha kompetens att använda.</p>
            </div>

            <div className="grid gap-2">
              <Label>Övriga anteckningar / Certifikat</Label>
              <Textarea value={currentPersonnel.notes || ''} onChange={e => setCurrentPersonnel({...currentPersonnel, notes: e.target.value})} placeholder="Referens till sparat certifikat, diplom etc." />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => savePersonnel.mutate(currentPersonnel)} className="flex-1" disabled={savePersonnel.isPending}>Spara Kompetensprofil</Button>
              {currentPersonnel.id && (
                <Button variant="destructive" onClick={() => { if (confirm('Ta bort denna person?')) deletePersonnel.mutate(currentPersonnel.id); }} className="px-3"><Trash2 className="w-4 h-4" /></Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Info Modal */}
      <Dialog open={clientInfoModalOpen} onOpenChange={setClientInfoModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{currentClientInfo.id ? 'Redigera Informationsblad' : 'Nytt Informationsblad'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Titel</Label><Input value={currentClientInfo.title || ''} onChange={e => setCurrentClientInfo({...currentClientInfo, title: e.target.value})} placeholder="t.ex. Information om Laserbehandling" /></div>
            <div className="grid gap-2"><Label>Version</Label><Input value={currentClientInfo.version || ''} onChange={e => setCurrentClientInfo({...currentClientInfo, version: e.target.value})} placeholder="1.0" /></div>
            <div className="grid gap-2"><Label>Behandlingsbeskrivning</Label><Textarea value={currentClientInfo.treatment_description || ''} onChange={e => setCurrentClientInfo({...currentClientInfo, treatment_description: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Risker och biverkningar</Label><Textarea value={currentClientInfo.risks_and_side_effects || ''} onChange={e => setCurrentClientInfo({...currentClientInfo, risks_and_side_effects: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Eftervårdsinstruktioner</Label><Textarea value={currentClientInfo.aftercare_instructions || ''} onChange={e => setCurrentClientInfo({...currentClientInfo, aftercare_instructions: e.target.value})} /></div>
            <Button onClick={() => saveClientInfo.mutate(currentClientInfo)} className="w-full">Spara</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Measurement Modal */}
      <Dialog open={measurementModalOpen} onOpenChange={setMeasurementModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{currentMeasurement.id ? 'Redigera Mätrapport' : 'Ny Mätrapport'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Datum</Label>
              {currentMeasurement.id ? (
                <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border">{currentMeasurement.measurement_date}</div>
              ) : (
                <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border text-muted-foreground">Sätts automatiskt vid sparning</div>
              )}
            </div>
            <div className="grid gap-2"><Label>Uppmätt effekt (J/cm2 etc)</Label><Input value={currentMeasurement.laser_power_measured || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, laser_power_measured: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Pulsparametrar</Label><Input value={currentMeasurement.pulse_parameters || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, pulse_parameters: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Avvikelse från grundvärde</Label><Input value={currentMeasurement.deviation_from_baseline || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, deviation_from_baseline: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Utförd av</Label><Input value={currentMeasurement.measured_by || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, measured_by: e.target.value})} /></div>
            <Button onClick={() => saveMeasurement.mutate(currentMeasurement)} className="w-full">Spara</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Location Modal */}
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{currentLocationCheck.id ? 'Redigera Lokalkontroll' : 'Ny Lokalsäkerhetskontroll'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm mb-2">
              Regelbunden kontroll av behandlingsrum för att säkerställa att utrustning och lokaler uppfyller kraven från Strålsäkerhetsmyndigheten.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Datum för kontroll</Label>
                {currentLocationCheck.id ? (
                  <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border">{currentLocationCheck.check_date}</div>
                ) : (
                  <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border text-muted-foreground">Sätts automatiskt till dagens datum</div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Kontrollerad av</Label>
                <Input value={currentLocationCheck.checked_by || ''} onChange={e => setCurrentLocationCheck({...currentLocationCheck, checked_by: e.target.value})} placeholder="Ditt namn" />
              </div>
            </div>

            <div className="border-t pt-4 mt-4 space-y-4">
              <Label className="font-semibold text-base">Checklista för behandlingsrum</Label>
              
              <div className="p-4 bg-muted/20 border rounded-md space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox className="mt-1" id="chk_signs" checked={currentLocationCheck.warning_signs_present || false} onCheckedChange={c => setCurrentLocationCheck({...currentLocationCheck, warning_signs_present: c})} />
                  <label htmlFor="chk_signs" className="text-sm cursor-pointer">
                    <span className="font-medium">Varningsskyltar finns uppsatta</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Skyltar (t.ex. "Varning för laser") finns väl synliga vid entrén till behandlingsrummet.</p>
                  </label>
                </div>
                
                <div className="flex items-start gap-3">
                  <Checkbox className="mt-1" id="chk_win" checked={currentLocationCheck.windows_covered || false} onCheckedChange={c => setCurrentLocationCheck({...currentLocationCheck, windows_covered: c})} />
                  <label htmlFor="chk_win" className="text-sm cursor-pointer">
                    <span className="font-medium">Fönster är insynsskyddade</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Fönster i rummet hindrar att farlig strålning/laserljus reflekteras eller avges utåt.</p>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox className="mt-1" id="chk_ref" checked={currentLocationCheck.no_reflecting_surfaces || false} onCheckedChange={c => setCurrentLocationCheck({...currentLocationCheck, no_reflecting_surfaces: c})} />
                  <label htmlFor="chk_ref" className="text-sm cursor-pointer">
                    <span className="font-medium">Inga reflekterande ytor i strålgången</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Speglar, blanka metallverktyg eller liknande saknas i riskområdet för att undvika oavsiktliga reflektioner.</p>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox className="mt-1" id="chk_glass" checked={currentLocationCheck.safety_glasses_intact || false} onCheckedChange={c => setCurrentLocationCheck({...currentLocationCheck, safety_glasses_intact: c})} />
                  <label htmlFor="chk_glass" className="text-sm cursor-pointer">
                    <span className="font-medium">Skyddsglasögon intakta och märkta</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Skyddsglasögon för både personal och kund är fria från repor och CE-märkta för aktuell våglängd.</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-2 pt-2">
              <Label>Kommentarer / Åtgärder</Label>
              <Textarea 
                value={currentLocationCheck.comments || ''} 
                onChange={e => setCurrentLocationCheck({...currentLocationCheck, comments: e.target.value})} 
                placeholder="Skriv om du hittade några brister eller om något behövde åtgärdas..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => saveLocationCheck.mutate(currentLocationCheck)} className="flex-1" disabled={saveLocationCheck.isPending}>Spara Kontroll</Button>
              {currentLocationCheck.id && (
                <Button variant="destructive" onClick={() => { if (confirm('Ta bort denna kontroll?')) deleteLocationCheck.mutate(currentLocationCheck.id); }} className="px-3">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Modal */}
      <Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{currentAudit.id ? 'Redigera Revision' : 'Ny Årlig Internrevision'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Datum</Label>
              {currentAudit.id ? (
                <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border">{currentAudit.audit_date}</div>
              ) : (
                <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md border text-muted-foreground">Sätts automatiskt vid sparning</div>
              )}
            </div>
            <div className="grid gap-2"><Label>Utförd av</Label><Input value={currentAudit.auditor_name || ''} onChange={e => setCurrentAudit({...currentAudit, auditor_name: e.target.value})} /></div>
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2"><Checkbox id="aud_met" checked={currentAudit.methods_updated || false} onCheckedChange={c => setCurrentAudit({...currentAudit, methods_updated: c})} /><Label htmlFor="aud_met">Metoder genomgångna och uppdaterade</Label></div>
              <div className="flex items-center gap-2"><Checkbox id="aud_trn" checked={currentAudit.training_updated || false} onCheckedChange={c => setCurrentAudit({...currentAudit, training_updated: c})} /><Label htmlFor="aud_trn">Personalens utbildning är aktuell</Label></div>
              <div className="flex items-center gap-2"><Checkbox id="aud_inc" checked={currentAudit.incidents_reviewed || false} onCheckedChange={c => setCurrentAudit({...currentAudit, incidents_reviewed: c})} /><Label htmlFor="aud_inc">Årets incidenter har analyserats</Label></div>
            </div>
            <div className="grid gap-2"><Label>Sammanfattning</Label><Textarea value={currentAudit.summary || ''} onChange={e => setCurrentAudit({...currentAudit, summary: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Planerade åtgärder framåt</Label><Textarea value={currentAudit.planned_actions || ''} onChange={e => setCurrentAudit({...currentAudit, planned_actions: e.target.value})} /></div>
            <Button onClick={() => saveAudit.mutate(currentAudit)} className="w-full">Spara Revision</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}