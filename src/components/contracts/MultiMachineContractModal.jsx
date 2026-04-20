import { useState, useEffect } from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { MACHINE_MODELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MultiMachineContractModal({ onClose, onSave, initialCustomerId }) {
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachineForm, setNewMachineForm] = useState({
    model: "none",
    custom_model: "",
    serial_number: ""
  });

  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomerId || "");
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [templateQuantities, setTemplateQuantities] = useState({});
  
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percent");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [bindingMonths, setBindingMonths] = useState("12");
  const [contractStatus, setContractStatus] = useState("inactive");
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Customer.list().then(data => {
      const sortedCustomers = data.sort((a, b) => 
        (a.company_name || "").localeCompare(b.company_name || "", "sv")
      );
      setCustomers(sortedCustomers);
    });
    base44.entities.ServiceAgreementTemplate.list().then(setTemplates);
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      base44.entities.Machine.filter({ customer_id: selectedCustomer }).then(m => {
        setMachines(m);
      });
      setSelectedMachines([]);
    } else {
      setMachines([]);
    }
  }, [selectedCustomer]);

  const handleSave = async () => {
    if (!selectedCustomer || selectedMachines.length === 0 || selectedTemplates.length === 0) return;
    
    setSaving(true);
    try {
      for (const templateId of selectedTemplates) {
        const instance = await base44.entities.ServiceAgreementInstance.create({
          customer_id: selectedCustomer,
          service_agreement_template_id: templateId,
          machine_ids: selectedMachines,
          quantity: templateQuantities[templateId] || 1,
          discount: Number(discount),
          discount_type: discountType,
          start_date: startDate,
          binding_months: Number(bindingMonths),
          status: contractStatus
        });

        for (const machineId of selectedMachines) {
          await base44.entities.Machine.update(machineId, {
            service_contract: "basic",
            contract_status: contractStatus === "active" ? "active" : "pending_signature",
            service_agreement_template_id: templateId,
            service_agreement_instance_id: instance.id,
            contract_start_date: startDate,
            contract_created_date: new Date().toISOString().split("T")[0],
            contract_binding_months: Number(bindingMonths)
          });

          const machine = machines.find(m => m.id === machineId);
          if (machine && !machine.service_date) {
            const currentUser = await base44.auth.me();
            if (currentUser) {
              await base44.entities.Notification.create({
                user_email: currentUser.email,
                title: "Saknar servicedatum",
                message: `Serviceavtal skapades för ${machine.model} (SN: ${machine.serial_number}), men senaste servicedatum saknas.`,
                type: "warning",
                related_entity: "Machine",
                related_entity_id: machine.id
              });
            }
          }
        }
      }

      onSave();
    } finally {
      setSaving(false);
    }
  };
  
  const toggleMachine = (id) => {
    setSelectedMachines(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleAddMachine = async () => {
    setSaving(true);
    try {
      const actualModel = newMachineForm.model === "Annan" ? newMachineForm.custom_model : newMachineForm.model;
      const newMachine = await base44.entities.Machine.create({
        model: actualModel,
        serial_number: newMachineForm.serial_number,
        customer_id: selectedCustomer,
        status: "active",
        service_contract: "none",
        notes: "Skapad vid avtalsregistrering"
      });
      setMachines(prev => [...prev, newMachine]);
      setSelectedMachines(prev => [...prev, newMachine.id]);
      setShowAddMachine(false);
      setNewMachineForm({ model: "none", custom_model: "", serial_number: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = (id) => {
    setSelectedTemplates(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        setTemplateQuantities(q => {
          const newQ = { ...q };
          delete newQ[id];
          return newQ;
        });
        return prev.filter(t => t !== id);
      } else {
        setTemplateQuantities(q => ({ ...q, [id]: 1 }));
        return [...prev, id];
      }
    });
  };

  const updateTemplateQuantity = (id, qty) => {
    setTemplateQuantities(prev => ({ ...prev, [id]: qty }));
  };

  let basePrice = selectedTemplates.reduce((sum, templateId) => {
    const t = templates.find(temp => temp.id === templateId);
    const qty = templateQuantities[templateId] || 1;
    return sum + (t?.price_per_month ? Number(t.price_per_month) * qty : 0);
  }, 0);
  // Total price is just the sum of template prices, not multiplied by machines
  let totalPrice = basePrice;
  if (discountType === 'percent') {
      totalPrice = totalPrice * (1 - (Number(discount) / 100));
  } else {
      totalPrice = totalPrice - Number(discount);
  }
  totalPrice = Math.max(0, totalPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nytt Serviceavtal (Flera maskiner)</h2>
            <p className="text-sm text-slate-500">Skapa ett avtal för en eller flera maskiner med eventuell rabatt.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2 flex flex-col">
            <Label>Välj Kund</Label>
            <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomerPopover}
                  className="w-full justify-between font-normal border-input"
                >
                  <span className="truncate">
                    {selectedCustomer
                      ? customers.find((c) => c.id === selectedCustomer)?.company_name || "Välj kund..."
                      : "Välj kund..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Sök kund..." />
                  <CommandList>
                    <CommandEmpty>Ingen kund hittades.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.company_name}
                          onSelect={() => {
                            setSelectedCustomer(c.id === selectedCustomer ? "" : c.id);
                            setOpenCustomerPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedCustomer === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{c.company_name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Maskiner i avtalet</Label>
                <Button variant="outline" size="sm" onClick={() => setShowAddMachine(!showAddMachine)}>
                  {showAddMachine ? "Avbryt lägg till" : "+ Lägg till maskin"}
                </Button>
              </div>

              {machines.length > 0 && (() => {
                const currentCustomer = customers.find(c => c.id === selectedCustomer);
                return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {machines.map(m => (
                    <label key={m.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <Checkbox 
                        checked={selectedMachines.includes(m.id)} 
                        onCheckedChange={() => toggleMachine(m.id)} 
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{m.model}</div>
                        <div className="text-xs text-slate-500 mb-2">SN: {m.serial_number}</div>
                        
                        <div className="bg-white border rounded p-2 text-[10px] space-y-1">
                           <div className="flex justify-between">
                             <span className="text-slate-400">Senaste service:</span>
                             <span className="font-medium text-slate-700">{m.service_date || "Ingen"}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-slate-400">Avtal:</span>
                             <span className="font-medium text-slate-700">{m.service_contract === "none" ? "Inget" : (m.service_contract === "basic" ? "Basic" : m.service_contract)}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-slate-400">Ort:</span>
                             <span className="font-medium text-slate-700">{currentCustomer?.city || "Ej angiven"}</span>
                           </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )})()}

              {machines.length === 0 && !showAddMachine && (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                  Kunden har inga registrerade maskiner.
                </div>
              )}

              {showAddMachine && (
                <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Maskinmodell *</Label>
                      <Select value={newMachineForm.model} onValueChange={v => setNewMachineForm(prev => ({...prev, model: v}))}>
                        <SelectTrigger><SelectValue placeholder="Välj modell" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ingen vald</SelectItem>
                          {MACHINE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          <SelectItem value="Annan">Annan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newMachineForm.model === "Annan" && (
                      <div className="space-y-1">
                        <Label>Egen modell *</Label>
                        <Input value={newMachineForm.custom_model} onChange={e => setNewMachineForm(prev => ({...prev, custom_model: e.target.value}))} placeholder="Maskinmodell" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Serienummer *</Label>
                      <Input value={newMachineForm.serial_number} onChange={e => setNewMachineForm(prev => ({...prev, serial_number: e.target.value}))} placeholder="SN-XXXX" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="astomed-btn-primary"
                      disabled={newMachineForm.model === "none" || (newMachineForm.model === "Annan" && !newMachineForm.custom_model) || !newMachineForm.serial_number || saving}
                      onClick={handleAddMachine}
                    >
                      Spara och välj maskin
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedMachines.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Välj avtalsmallar</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {templates.map(t => {
                    const isSelected = selectedTemplates.includes(t.id);
                    return (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleTemplate(t.id)} 
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold text-sm">{t.name}</div>
                          {t.price_per_month && <div className="text-xs text-slate-500">{t.price_per_month} kr/mån</div>}
                        </div>
                      </label>
                      {isSelected && (
                        <div className="ml-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <span className="text-xs text-slate-500">Antal:</span>
                          <Select 
                            value={(templateQuantities[t.id] || 1).toString()} 
                            onValueChange={(val) => updateTemplateQuantity(t.id, parseInt(val))}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(n => (
                                <SelectItem key={n} value={n.toString()}>{n} st</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Startdatum</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bindningstid (månader)</Label>
                  <Select value={bindingMonths.toString()} onValueChange={setBindingMonths}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 månader</SelectItem>
                      <SelectItem value="12">12 månader</SelectItem>
                      <SelectItem value="24">24 månader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={contractStatus} onValueChange={setContractStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inactive">Inaktiv (Väntar på signering)</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-sm text-slate-700">Rabatt & Prisberäkning</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rabatt (%)</Label>
                    <Input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} />
                  </div>
                </div>
                
                {selectedTemplates.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      Grundpris: {basePrice} kr/mån
                    </span>
                    <span className="font-bold text-lg text-emerald-700">
                      Totalpris: {Math.round(totalPrice)} kr/mån
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={saving}>Avbryt</Button>
          <Button 
            className="astomed-btn-primary" 
            onClick={handleSave} 
            disabled={saving || !selectedCustomer || selectedMachines.length === 0 || selectedTemplates.length === 0}
          >
            {saving ? "Sparar..." : "Spara Avtal"}
          </Button>
        </div>
      </div>
    </div>
  );
}