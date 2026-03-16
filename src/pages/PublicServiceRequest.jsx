import { useState } from "react";
import { Send, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { machineServiceDetails } from "../components/MachineServiceDetails";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";

export default function PublicServiceRequest() {
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    org_number: "",
    address: "",
    postal_code: "",
    city: "",
    machine_name: "",
    serial_number: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isAuthorizedSignatory, setIsAuthorizedSignatory] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitData = {
        ...form,
        service_description: form.notes || `Serviceförfrågan för ${form.machine_name}.`
      };
      const appUrl = window.location.origin;
      const res = await fetch(`${appUrl}/api/functions/createPublicServiceLead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fel vid skickning");
      }
      setSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Ett fel uppstod: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.company_name && form.contact_person && form.email && form.phone && form.machine_name && privacyAccepted && isAuthorizedSignatory && (form.machine_name !== "Annan" || form.other_machine_name);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#002B3C" }}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#e8f2f2" }}>
            <Send className="w-8 h-8" style={{ color: "#3a9e9e" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#1b3a3a" }}>Förfrågan skickad!</h2>
          <p className="text-gray-500">Tack! Vi har tagit emot din serviceförfrågan och återkommer till dig så snart som möjligt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "#002B3C" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto mb-4" style={{ background: "#1b3a3a" }}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#ffffff" }}>Astomed Serviceavtal - kostnadsfri konsultation</h1>
          <p style={{ color: "#ffffff" }}>Fyll i formuläret nedan så kontaktar vi dig för kostnadsfri konsultation av serviceavtal för din/dina maskiner.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Kunduppgifter */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#254f4f" }}>Dina uppgifter</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <Label>Företagsnamn *</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Ditt företag AB" required />
              </div>
              <div className="space-y-1">
                <Label>Kontaktperson *</Label>
                <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="För- och efternamn" required />
              </div>
              <div className="space-y-1">
                <Label>Telefon *</Label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="07XXXXXXXX" required />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>E-post *</Label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="din@email.se" required />
              </div>
              <div className="space-y-1">
                <Label>Organisationsnummer</Label>
                <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
              </div>
              <div className="space-y-1">
                <Label>Stad</Label>
                <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Stad" />
              </div>
              <div className="space-y-1">
                <Label>Adress</Label>
                <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Gatuadress" />
              </div>
              <div className="space-y-1">
                <Label>Postnummer</Label>
                <Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} placeholder="XXX XX" />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Maskinuppgifter */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#254f4f" }}>Maskinuppgifter</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <Label>Maskintyp *</Label>
                <Select value={form.machine_name} onValueChange={v => set("machine_name", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj maskintyp" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(machineServiceDetails).map(machine => (
                      <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {form.machine_name === "Annan" && (
                <>
                  <div className="space-y-1">
                    <Label>Maskinnamn *</Label>
                    <Input value={form.other_machine_name || ""} onChange={e => set("other_machine_name", e.target.value)} placeholder="Ange maskinens namn" required />
                  </div>
                  <div className="space-y-1">
                    <Label>Serienummer</Label>
                    <Input value={form.other_serial_number || ""} onChange={e => set("other_serial_number", e.target.value)} placeholder="Ange serienummer" />
                  </div>
                </>
              )}

              {form.machine_name && machineServiceDetails[form.machine_name] && (
                <div className="sm:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {machineServiceDetails[form.machine_name].title}
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {machineServiceDetails[form.machine_name].details.map((detail, idx) => (
                     <li key={idx} className="flex gap-2">
                       <span className="text-blue-600">•</span>
                       <span dangerouslySetInnerHTML={{ __html: detail }} />
                     </li>
                    ))}
                  </ul>
                  {machineServiceDetails[form.machine_name].additionalInfo && (
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <p className="text-sm font-semibold text-blue-900">
                        {machineServiceDetails[form.machine_name].additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer select-none mb-3">
              <input
                type="checkbox"
                checked={isAuthorizedSignatory}
                onChange={e => setIsAuthorizedSignatory(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-700 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">Jag bekräftar att jag är firmatecknare.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={e => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-700 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                Jag har läst och godkänner{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyDialog(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  integritetspolicyn
                </button>
                .
              </span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            style={{ background: "#1b3a3a" }}
            disabled={!isValid || submitting}
          >
            {submitting ? "Skickar..." : "Skicka serviceförfrågan"}
          </Button>

          <p className="text-xs text-center text-gray-400">
            Dina uppgifter hanteras säkert och används enbart för att kunna kontakta dig angående din serviceförfrågan.
          </p>
        </form>

        {/* Login link bottom */}
        <div className="text-center mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            Har du redan ett konto hos Astomed Service och vill beställa service,{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              klicka på denna länk för att logga in på ditt konto
            </a>. (För att få ett konto måste du ha ett aktivt serviceavtal hos oss.)
          </p>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <PrivacyPolicyContent />
          <div className="p-6 border-t border-slate-100 flex-shrink-0">
            <Button
              className="w-full astomed-btn-primary"
              onClick={() => setShowPrivacyDialog(false)}
            >
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}