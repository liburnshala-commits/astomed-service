import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, FileText, CheckCircle } from "lucide-react";

const emptyForm = {
  name: "",
  description: "",
  binding_months: 12,
  included_services: [],
  price_per_month: "",
  agreement_type: "BAS Astomed 3.0",
};

export default function ServiceAgreementTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [serviceInput, setServiceInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await base44.entities.ServiceAgreementTemplate.list();
    setTemplates(data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setServiceInput("");
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name || "",
      description: t.description || "",
      binding_months: t.binding_months || 12,
      included_services: t.included_services || [],
      price_per_month: t.price_per_month || "",
      agreement_type: t.agreement_type || "BAS Astomed 3.0",
    });
    setServiceInput("");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Är du säker på att du vill ta bort denna mall?")) return;
    await base44.entities.ServiceAgreementTemplate.delete(id);
    loadTemplates();
  };

  const addService = () => {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    setForm(f => ({ ...f, included_services: [...(f.included_services || []), trimmed] }));
    setServiceInput("");
  };

  const removeService = (idx) => {
    setForm(f => ({ ...f, included_services: f.included_services.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.agreement_type) return;
    setSaving(true);
    const payload = {
      ...form,
      price_per_month: form.price_per_month !== "" ? Number(form.price_per_month) : null,
      binding_months: 12,
    };
    if (editing) {
      await base44.entities.ServiceAgreementTemplate.update(editing.id, payload);
    } else {
      await base44.entities.ServiceAgreementTemplate.create(payload);
    }
    setSaving(false);
    setShowModal(false);
    loadTemplates();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1b3a3a" }}>Serviceavtalsmallar</h1>
          <p className="text-sm text-gray-500 mt-1">Skapa och hantera dina serviceavtalsmallar</p>
        </div>
        <Button onClick={openCreate} style={{ background: "#1b3a3a", color: "#fff" }}>
          <Plus className="w-4 h-4 mr-2" /> Nytt serviceavtal
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Inga serviceavtalsmallar skapade ännu.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{t.name}</span>
                  <Badge style={{ background: "#e8f2f2", color: "#1b3a3a" }}>{t.agreement_type}</Badge>
                  <Badge variant="outline">{t.binding_months || 12} mån</Badge>
                  {t.price_per_month && (
                    <Badge variant="outline">{t.price_per_month} kr/mån</Badge>
                  )}
                </div>
                {t.description && <p className="text-sm text-gray-500 mb-2">{t.description}</p>}
                {t.included_services && t.included_services.length > 0 && (
                  <ul className="space-y-0.5">
                    {t.included_services.map((s, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-teal-500 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                  <Pencil className="w-4 h-4 text-gray-500" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Redigera serviceavtal" : "Nytt serviceavtal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Namn *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="t.ex. Standardavtal Soprano" />
            </div>
            <div>
              <Label>Avtalstyp *</Label>
              <Select value={form.agreement_type} onValueChange={v => setForm(f => ({ ...f, agreement_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAS Astomed 3.0">BAS Astomed 3.0</SelectItem>
                  <SelectItem value="Inget serviceavtal">Inget serviceavtal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beskrivning</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Kort beskrivning av avtalet..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bindningstid (månader)</Label>
                <Input value={12} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Pris per månad (kr)</Label>
                <Input type="number" value={form.price_per_month} onChange={e => setForm(f => ({ ...f, price_per_month: e.target.value }))} placeholder="t.ex. 600" />
              </div>
            </div>
            <div>
              <Label>Inkluderade tjänster</Label>
              <div className="flex gap-2 mt-1">
                <Input value={serviceInput} onChange={e => setServiceInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addService()} placeholder="Lägg till en tjänst och tryck Enter..." />
                <Button type="button" variant="outline" onClick={addService}>Lägg till</Button>
              </div>
              {form.included_services && form.included_services.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.included_services.map((s, i) => (
                    <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 text-sm">
                      <span>{s}</span>
                      <button onClick={() => removeService(i)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} style={{ background: "#1b3a3a", color: "#fff" }}>
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}