import { X, Building2, Phone, Mail, MapPin, Cpu, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  new: { label: "Ny", color: "bg-blue-100 text-blue-800" },
  customer_created: { label: "Kund skapad", color: "bg-green-100 text-green-800" },
  assigned: { label: "Tilldelad", color: "bg-purple-100 text-purple-800" },
  archived: { label: "Arkiverad", color: "bg-gray-100 text-gray-600" }
};

export default function LeadDetailModal({ lead, onClose }) {
  const sc = statusConfig[lead.status] || statusConfig.new;

  const Row = ({ icon: IconComp, label, value }) => {
    const Icon = IconComp;
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#e8f2f2" }}>
          <Icon className="w-4 h-4" style={{ color: "#3a9e9e" }} />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm text-gray-800 font-medium">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold astomed-title">{lead.company_name}</h2>
            <Badge className={`text-xs mt-1 ${sc.color}`}>{sc.label}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Kunduppgifter</h3>
            <Row icon={User} label="Kontaktperson" value={lead.contact_person} />
            <Row icon={Mail} label="E-post" value={lead.email} />
            <Row icon={Phone} label="Telefon" value={lead.phone} />
            <Row icon={Building2} label="Organisationsnummer" value={lead.org_number} />
            <Row icon={MapPin} label="Adress" value={[lead.address, lead.postal_code, lead.city].filter(Boolean).join(", ")} />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Maskinuppgifter</h3>
            <Row icon={Cpu} label="Maskintyp" value={lead.machine_name} />
            <Row icon={Building2} label="Tillverkare" value={lead.manufacturer} />
            <Row icon={FileText} label="Serienummer" value={lead.serial_number} />
            <Row icon={FileText} label="Servicetyp" value={lead.service_type === "advanced" ? "Avancerad service" : "Standard service"} />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Beskrivning</h3>
            <p className="text-sm text-gray-700 p-3 rounded-lg" style={{ background: "#f4f9f9" }}>{lead.service_description}</p>
          </div>

          <p className="text-xs text-gray-400">
            Inkom: {new Date(lead.created_date).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <div className="flex justify-end p-6 border-t">
          <Button variant="outline" onClick={onClose}>Stäng</Button>
        </div>
      </div>
    </div>
  );
}