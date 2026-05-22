import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ShieldAlert, FileText, Activity, AlertTriangle, CheckCircle, Users, Info, Settings2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RadiationSafety() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("methods");
  
  // Method State
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState({});

  // Incident State
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [currentIncident, setCurrentIncident] = useState({});

  // Treatment State
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState({});

  // New States
  const [personnelModalOpen, setPersonnelModalOpen] = useState(false);
  const [currentPersonnel, setCurrentPersonnel] = useState({});
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);
  const [currentDelegation, setCurrentDelegation] = useState({});
  const [clientInfoModalOpen, setClientInfoModalOpen] = useState(false);
  const [currentClientInfo, setCurrentClientInfo] = useState({});
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState({});

  const isCustomer = user?.role === 'customer';
  const clinicId = isCustomer ? user.id : 'all'; // Simplified for demo, normally handled via selected customer

  // Queries
  const { data: methods = [] } = useQuery({
    queryKey: ['methods', clinicId],
    queryFn: () => base44.entities.MethodDescription.filter(isCustomer ? { clinic_id: user.id } : {}),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', clinicId],
    queryFn: () => base44.entities.IncidentReport.filter(isCustomer ? { clinic_id: user.id } : {}),
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', clinicId],
    queryFn: () => base44.entities.TreatmentDocumentation.filter(isCustomer ? { clinic_id: user.id } : {}),
  });

  const { data: personnel = [] } = useQuery({
    queryKey: ['personnel', clinicId],
    queryFn: () => base44.entities.PersonnelCompetence.filter(isCustomer ? { clinic_id: user.id } : {}),
  });

  const { data: delegations = [] } = useQuery({
    queryKey: ['delegations', clinicId],
    queryFn: () => base44.entities.ResponsibilityDelegation.filter(isCustomer ? { clinic_id: user.id } : {}),
  });

  const { data: clientInfos = [] } = useQuery({
    queryKey: ['clientInfos', clinicId],
    queryFn: () => base44.entities.ClientInformationSheet.filter(isCustomer ? { clinic_id: user.id } : {}),
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements', clinicId],
    queryFn: () => base44.entities.MeasurementReport.filter(isCustomer ? { clinic_id: user.id } : {}),
  });

  // Mutations
  const saveMethod = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, clinic_id: user.id };
      if (data.id) return base44.entities.MethodDescription.update(data.id, payload);
      return base44.entities.MethodDescription.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['methods']);
      setMethodModalOpen(false);
      toast({ title: "Sparad", description: "Metodbeskrivningen har sparats." });
    }
  });

  const saveIncident = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, clinic_id: user.id };
      if (data.id) return base44.entities.IncidentReport.update(data.id, payload);
      return base44.entities.IncidentReport.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents']);
      setIncidentModalOpen(false);
      toast({ title: "Sparad", description: "Incidenten har sparats." });
    }
  });

  const saveTreatment = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, clinic_id: user.id };
      if (data.id) return base44.entities.TreatmentDocumentation.update(data.id, payload);
      return base44.entities.TreatmentDocumentation.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['treatments']);
      setTreatmentModalOpen(false);
      toast({ title: "Sparad", description: "Dokumentationen har sparats." });
    }
  });

  const savePersonnel = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, clinic_id: user.id };
      if (data.id) return base44.entities.PersonnelCompetence.update(data.id, payload);
      return base44.entities.PersonnelCompetence.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['personnel']); setPersonnelModalOpen(false); toast({ title: "Sparad" }); }
  });

  const saveDelegation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, clinic_id: user.id };
      if (data.id) return base44.entities.ResponsibilityDelegation.update(data.id, payload);
      return base44.entities.ResponsibilityDelegation.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['delegations']); setDelegationModalOpen(false); toast({ title: "Sparad" }); }
  });

  const saveClientInfo = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, clinic_id: user.id };
      if (data.id) return base44.entities.ClientInformationSheet.update(data.id, payload);
      return base44.entities.ClientInformationSheet.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['clientInfos']); setClientInfoModalOpen(false); toast({ title: "Sparad" }); }
  });

  const saveMeasurement = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, clinic_id: user.id };
      if (data.id) return base44.entities.MeasurementReport.update(data.id, payload);
      return base44.entities.MeasurementReport.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries(['measurements']); setMeasurementModalOpen(false); toast({ title: "Sparad" }); }
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="personnel">Personal & Ansvar</TabsTrigger>
            <TabsTrigger value="client_info">Klientinfo</TabsTrigger>
            <TabsTrigger value="methods">Metoder</TabsTrigger>
            <TabsTrigger value="measurements">Mätrapporter</TabsTrigger>
            <TabsTrigger value="treatments">Dokumentation</TabsTrigger>
            <TabsTrigger value="incidents">Incidenter</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info" className="mt-6 space-y-4">
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
        </TabsContent>

        <TabsContent value="methods" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Metoder & Rutiner</h2>
            <Button onClick={() => { setCurrentMethod({}); setMethodModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Ny Metod
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {methods.map(method => (
              <Card key={method.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentMethod(method); setMethodModalOpen(true); }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> {method.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{method.description}</p>
                  {method.is_routine && <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Allmän Rutin</span>}
                </CardContent>
              </Card>
            ))}
            {methods.length === 0 && <p className="text-muted-foreground">Inga metoder inlagda ännu.</p>}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Incidentrapporter</h2>
            <Button onClick={() => { setCurrentIncident({ status: 'open' }); setIncidentModalOpen(true); }} variant="destructive">
              <AlertTriangle className="w-4 h-4 mr-2" /> Ny Incident
            </Button>
          </div>
          
          <div className="space-y-4">
            {incidents.map(inc => (
              <Card key={inc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentIncident(inc); setIncidentModalOpen(true); }}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${inc.status === 'closed' ? 'text-green-500' : 'text-red-500'}`} />
                      {inc.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{new Date(inc.incident_date).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm">{inc.description}</p>
                </CardContent>
              </Card>
            ))}
            {incidents.length === 0 && <p className="text-muted-foreground">Inga incidenter registrerade.</p>}
          </div>
        </TabsContent>

        <TabsContent value="treatments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Behandlingsdokumentation</h2>
            <Button onClick={() => { setCurrentTreatment({}); setTreatmentModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Ny Dokumentation
            </Button>
          </div>

          <div className="space-y-4">
            {treatments.map(trt => (
              <Card key={trt.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentTreatment(trt); setTreatmentModalOpen(true); }}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Patient: {trt.patient_id || 'Okänd'}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{trt.treatment_date ? new Date(trt.treatment_date).toLocaleString() : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className={`w-3 h-3 ${trt.individual_assessment_done ? 'text-green-500' : 'text-slate-300'}`} /> Bedömning
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className={`w-3 h-3 ${trt.pre_treatment_info_given ? 'text-green-500' : 'text-slate-300'}`} /> Info given
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {treatments.length === 0 && <p className="text-muted-foreground">Ingen dokumentation registrerad.</p>}
          </div>
        </TabsContent>

        <TabsContent value="personnel" className="mt-6 space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ansvarsdelegering</h2>
              <Button onClick={() => { setCurrentDelegation({}); setDelegationModalOpen(true); }} size="sm">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Personal & Kompetens</h2>
              <Button onClick={() => { setCurrentPersonnel({}); setPersonnelModalOpen(true); }} size="sm">
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
        </TabsContent>

        <TabsContent value="client_info" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Klientinformationsblad</h2>
            <Button onClick={() => { setCurrentClientInfo({}); setClientInfoModalOpen(true); }}>
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
        </TabsContent>

        <TabsContent value="measurements" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Mätrapporter (Laser/IPL)</h2>
            <Button onClick={() => { setCurrentMeasurement({}); setMeasurementModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Ny Mätning
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {measurements.map(meas => (
              <Card key={meas.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setCurrentMeasurement(meas); setMeasurementModalOpen(true); }}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" />Mätning</CardTitle>
                    <span className="text-xs text-muted-foreground">{meas.measurement_date ? new Date(meas.measurement_date).toLocaleDateString() : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm">Effekt: {meas.laser_power_measured}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
            <div className="grid gap-2">
              <Label>Beskrivning</Label>
              <Textarea value={currentMethod.description || ''} onChange={e => setCurrentMethod({...currentMethod, description: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Krav på kompetens</Label>
              <Input value={currentMethod.required_competence || ''} onChange={e => setCurrentMethod({...currentMethod, required_competence: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Utrustning & Inställningar</Label>
              <Textarea value={currentMethod.equipment_settings || ''} onChange={e => setCurrentMethod({...currentMethod, equipment_settings: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Riskbedömning inför behandling</Label>
              <Textarea value={currentMethod.risk_assessment || ''} onChange={e => setCurrentMethod({...currentMethod, risk_assessment: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Skyddsutrustning</Label>
              <Input value={currentMethod.protective_equipment || ''} onChange={e => setCurrentMethod({...currentMethod, protective_equipment: e.target.value})} />
            </div>
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
                <Input value={currentIncident.title || ''} onChange={e => setCurrentIncident({...currentIncident, title: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Datum</Label>
                <Input type="datetime-local" value={currentIncident.incident_date?.slice(0,16) || ''} onChange={e => setCurrentIncident({...currentIncident, incident_date: new Date(e.target.value).toISOString()})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Händelseförlopp</Label>
              <Textarea value={currentIncident.description || ''} onChange={e => setCurrentIncident({...currentIncident, description: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Vidtagna åtgärder</Label>
              <Textarea value={currentIncident.actions_taken || ''} onChange={e => setCurrentIncident({...currentIncident, actions_taken: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="ssm" checked={currentIncident.reported_to_ssm || false} onCheckedChange={c => setCurrentIncident({...currentIncident, reported_to_ssm: c})} />
                <Label htmlFor="ssm">Rapporterad till SSM</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentIncident.status || 'open'} 
                  onChange={e => setCurrentIncident({...currentIncident, status: e.target.value})}
                >
                  <option value="open">Öppen</option>
                  <option value="investigated">Utreds</option>
                  <option value="closed">Stängd/Åtgärdad</option>
                </select>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Behandlingsdokumentation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Patient Ref / ID</Label>
                <Input value={currentTreatment.patient_id || ''} onChange={e => setCurrentTreatment({...currentTreatment, patient_id: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Datum och tid</Label>
                <Input type="datetime-local" value={currentTreatment.treatment_date?.slice(0,16) || ''} onChange={e => setCurrentTreatment({...currentTreatment, treatment_date: new Date(e.target.value).toISOString()})} />
              </div>
            </div>
            
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <Checkbox id="ind_ass" checked={currentTreatment.individual_assessment_done || false} onCheckedChange={c => setCurrentTreatment({...currentTreatment, individual_assessment_done: c})} />
                <Label htmlFor="ind_ass">Individuell bedömning utförd enligt rutin</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="pre_info" checked={currentTreatment.pre_treatment_info_given || false} onCheckedChange={c => setCurrentTreatment({...currentTreatment, pre_treatment_info_given: c})} />
                <Label htmlFor="pre_info">Skriftlig och muntlig information given till kund</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="prot_eq" checked={currentTreatment.protective_equipment_used || false} onCheckedChange={c => setCurrentTreatment({...currentTreatment, protective_equipment_used: c})} />
                <Label htmlFor="prot_eq">Skyddsutrustning använd (t.ex. glasögon)</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Utrustningsinställningar (som användes)</Label>
              <Textarea value={currentTreatment.equipment_settings_used || ''} onChange={e => setCurrentTreatment({...currentTreatment, equipment_settings_used: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Avvikelser under behandling</Label>
              <Textarea placeholder="Lämna tomt om inga avvikelser skedde" value={currentTreatment.deviations || ''} onChange={e => setCurrentTreatment({...currentTreatment, deviations: e.target.value})} />
            </div>
            
            <Button onClick={() => saveTreatment.mutate(currentTreatment)} className="w-full" disabled={saveTreatment.isPending}>
              Spara Dokumentation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delegation Modal */}
      <Dialog open={delegationModalOpen} onOpenChange={setDelegationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{currentDelegation.id ? 'Redigera Delegering' : 'Ny Delegering'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Roll/Titel</Label><Input value={currentDelegation.role_title || ''} onChange={e => setCurrentDelegation({...currentDelegation, role_title: e.target.value})} placeholder="t.ex. Strålskyddsansvarig" /></div>
            <div className="grid gap-2"><Label>Namn på ansvarig</Label><Input value={currentDelegation.assigned_to_name || ''} onChange={e => setCurrentDelegation({...currentDelegation, assigned_to_name: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Datum tilldelat</Label><Input type="date" value={currentDelegation.date_assigned || ''} onChange={e => setCurrentDelegation({...currentDelegation, date_assigned: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Ansvarsområden</Label><Textarea value={currentDelegation.responsibilities || ''} onChange={e => setCurrentDelegation({...currentDelegation, responsibilities: e.target.value})} /></div>
            <Button onClick={() => saveDelegation.mutate(currentDelegation)} className="w-full">Spara</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Personnel Modal */}
      <Dialog open={personnelModalOpen} onOpenChange={setPersonnelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{currentPersonnel.id ? 'Redigera Personal' : 'Ny Personal'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Namn</Label><Input value={currentPersonnel.employee_name || ''} onChange={e => setCurrentPersonnel({...currentPersonnel, employee_name: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Yrkesroll</Label><Input value={currentPersonnel.role || ''} onChange={e => setCurrentPersonnel({...currentPersonnel, role: e.target.value})} placeholder="t.ex. Hudterapeut" /></div>
            <div className="flex items-center gap-2 mt-2"><Checkbox id="rad_saf" checked={currentPersonnel.radiation_safety_training || false} onCheckedChange={c => setCurrentPersonnel({...currentPersonnel, radiation_safety_training: c})} /><Label htmlFor="rad_saf">Har genomgått strålskyddsutbildning</Label></div>
            <div className="grid gap-2"><Label>Datum för utbildning</Label><Input type="date" value={currentPersonnel.training_date || ''} onChange={e => setCurrentPersonnel({...currentPersonnel, training_date: e.target.value})} /></div>
            <Button onClick={() => savePersonnel.mutate(currentPersonnel)} className="w-full">Spara</Button>
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
            <div className="grid gap-2"><Label>Datum</Label><Input type="date" value={currentMeasurement.measurement_date || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, measurement_date: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Uppmätt effekt (J/cm2 etc)</Label><Input value={currentMeasurement.laser_power_measured || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, laser_power_measured: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Pulsparametrar</Label><Input value={currentMeasurement.pulse_parameters || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, pulse_parameters: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Avvikelse från grundvärde</Label><Input value={currentMeasurement.deviation_from_baseline || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, deviation_from_baseline: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Utförd av</Label><Input value={currentMeasurement.measured_by || ''} onChange={e => setCurrentMeasurement({...currentMeasurement, measured_by: e.target.value})} /></div>
            <Button onClick={() => saveMeasurement.mutate(currentMeasurement)} className="w-full">Spara</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}