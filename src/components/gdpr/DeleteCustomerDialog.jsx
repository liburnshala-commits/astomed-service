import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";

// Personal data fields that must be erased per GDPR
// Company name, org number, address, city, postal_code are allowed to keep for accounting/legal purposes
const PERSONAL_DATA_FIELDS = {
  contact_person: null,
  email: null,
  phone: null,
  portal_token: null,
  notes: null,
};

export default function DeleteCustomerDialog({ customer, machineCount, onDeleted, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const handleAnonymize = async () => {
    setLoading(true);
    const user = await base44.auth.me();

    // Anonymize only personal identifying data – keep company, org number, address for legal/accounting
    await base44.entities.Customer.update(customer.id, {
      ...PERSONAL_DATA_FIELDS,
      company_name: `[RADERAD] ${customer.company_name}`,
    });

    // Log the action
    await base44.entities.AuditLog.create({
      action: "delete",
      entity_type: "Customer",
      entity_id: customer.id,
      entity_label: customer.company_name,
      user_email: user.email,
      user_name: user.full_name || user.email,
      details: `Personuppgifter raderade enligt GDPR (rätten att bli glömd): kontaktperson, e-post, telefon, portaltoken och anteckningar anonymiserades. Företagsnamn, organisationsnummer och adress behålls för bokföringssyfte.`
    });

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Personuppgifter raderade</h2>
          <p className="text-sm text-slate-500 mb-4">
            Alla personidentifierande uppgifter har anonymiserats och åtgärden har loggats i audit log.
          </p>
          <Button className="w-full" onClick={onDeleted}>Stäng</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Radera personuppgifter (GDPR)</h2>
            <p className="text-sm text-slate-500">Rätten att bli glömd</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3 text-sm text-red-800 space-y-1">
          <p className="font-semibold">Följande personuppgifter raderas permanent:</p>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>Kontaktperson</li>
            <li>E-postadress</li>
            <li>Telefonnummer</li>
            <li>Portaltoken</li>
            <li>Anteckningar</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-green-800 space-y-1">
          <p className="font-semibold">Följande data behålls (tillåtet enligt GDPR för bokföring):</p>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>Företagsnamn (anonymiserat)</li>
            <li>Organisationsnummer</li>
            <li>Adressuppgifter</li>
            <li>Maskiner och servicehistorik (utan persondata)</li>
          </ul>
          <p className="text-xs text-green-700 mt-1">Raderingen loggas i audit log (synlig enbart för admin).</p>
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
            onClick={handleAnonymize}
            disabled={confirm !== customer.company_name || loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? "Raderar..." : "Radera personuppgifter"}
          </Button>
        </div>
      </div>
    </div>
  );
}