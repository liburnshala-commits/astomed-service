import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DeleteCustomerDialog({ customer, machineCount, onDeleted, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    const user = await base44.auth.me();

    // Fetch and delete all related machines
    const machines = await base44.entities.Machine.filter({ customer_id: customer.id });
    for (const machine of machines) {
      // Delete service records for each machine
      const records = await base44.entities.ServiceRecord.filter({ machine_id: machine.id });
      for (const record of records) {
        await base44.entities.ServiceRecord.delete(record.id);
      }
      await base44.entities.Machine.delete(machine.id);
    }

    // Delete service records directly linked to customer
    const directRecords = await base44.entities.ServiceRecord.filter({ customer_id: customer.id });
    for (const record of directRecords) {
      await base44.entities.ServiceRecord.delete(record.id);
    }

    // Log the deletion
    await base44.entities.AuditLog.create({
      action: "delete",
      entity_type: "Customer",
      entity_id: customer.id,
      entity_label: customer.company_name,
      user_email: user.email,
      user_name: user.full_name || user.email,
      details: `Kund och all tillhörande data raderades (GDPR – rätten att bli glömd). ${machines.length} maskin(er) och tillhörande serviceärenden raderades.`
    });

    // Delete the customer
    await base44.entities.Customer.delete(customer.id);

    setLoading(false);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Radera kunddata (GDPR)</h2>
            <p className="text-sm text-slate-500">Denna åtgärd kan inte ångras</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-800 space-y-1">
          <p className="font-semibold">Följande data kommer att raderas permanent:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Kundprofil: <strong>{customer.company_name}</strong></li>
            <li>{machineCount} maskin(er) kopplade till kunden</li>
            <li>Alla serviceärenden för dessa maskiner</li>
          </ul>
          <p className="mt-2 text-xs text-red-600">Raderingen loggas i audit log enligt GDPR-krav.</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Skriv <strong>{customer.company_name}</strong> för att bekräfta
          </label>
          <input
            type="text"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            placeholder={customer.company_name}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Avbryt
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={confirm !== customer.company_name || loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? "Raderar..." : "Radera all data"}
          </Button>
        </div>
      </div>
    </div>
  );
}