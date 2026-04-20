import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function RemoveContractDialog({ machine, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    const updateData = {
      service_contract: "none",
      service_contract_status: null,
      contract_start_date: null,
      contract_created_date: null,
      contract_binding_months: null,
      service_agreement_template_id: null,
      service_agreement_instance_id: null,
      contract_status: "inactive",
      contract_discount_percent: 0,
    };

    if (reason === "cancellation") {
      const startDate = machine.contract_start_date || "Okänt datum";
      const serviceDate = machine.service_date || "Ingen service utförd";
      const contractType = machine.service_contract === "basic" ? "BAS – Astomed 3.0" : machine.service_contract;
      
      const logText = `\n\n--- SERVICEAVTAL UPPSAGT ---\nDatum för uppsägning: ${new Date().toISOString().split("T")[0]}\nTidigare avtal: ${contractType}\nAvtalsstart: ${startDate}\nSenaste service: ${serviceDate}\n---------------------------`;
      
      updateData.notes = (machine.notes || "") + logText;
    }

    try {
      const currentUser = await base44.auth.me();
      base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'Machine',
        entity_id: machine.id,
        entity_label: `${machine.model} – SN: ${machine.serial_number}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: reason === "cancellation" ? "Serviceavtal uppsagt" : "Serviceavtal borttaget (Fel inlagt)"
      });
    } catch (e) {
      console.error(e);
    }

    onConfirm(updateData, reason);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="z-[250]">
        <DialogHeader>
          <DialogTitle>Ta bort serviceavtal</DialogTitle>
          <DialogDescription>
            {machine.model} (SN: {machine.serial_number})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Varför tas avtalet bort?</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Välj anledning..." />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="cancellation">Uppsägning (Behåll historik)</SelectItem>
                <SelectItem value="mistake">Fel inlagt (Makulera)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {reason === "cancellation" && (
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border">
              Vid uppsägning kommer avtalets startdatum och senaste servicedatum att sparas i maskinens anteckningar så att historiken bevaras.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button variant="destructive" disabled={!reason} onClick={handleConfirm}>
            Ta bort avtal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}