import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  ChevronDown, ChevronUp, Camera, Check, Clock,
  Play, Phone, MapPin, User, Wrench, AlertCircle, X, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import SignatureModal from "./SignatureModal";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  awaiting_approval: "bg-orange-100 text-orange-800 border-orange-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  invoiced: "bg-purple-100 text-purple-800 border-purple-200",
};
const statusLabel = {
  pending: "Väntar",
  awaiting_approval: "Inv. godkänn.",
  in_progress: "Pågående",
  completed: "Slutförd",
  invoiced: "Fakturerad",
};

export default function MobileTechnicianCard({ record, machine, customer, onStatusUpdate, isOfflinePending, onReload }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [partName, setPartName] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [savingPart, setSavingPart] = useState(false);
  const fileInputRef = useRef(null);

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    const updatedImages = [...(record.images || []), ...newUrls];
    await base44.entities.ServiceRecord.update(record.id, { images: updatedImages });
    setUploading(false);
    onReload?.();
  }

  async function handleSaveNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    const updatedDesc = record.description
      ? `${record.description}\n\n[${format(new Date(), "d MMM HH:mm", { locale: sv })}] ${note.trim()}`
      : note.trim();
    await base44.entities.ServiceRecord.update(record.id, { description: updatedDesc });
    setNote("");
    setNoteSaved(true);
    setSavingNote(false);
    setTimeout(() => setNoteSaved(false), 2000);
    onReload?.();
  }

  async function handleRemoveImage(url) {
    const updated = (record.images || []).filter(i => i !== url);
    await base44.entities.ServiceRecord.update(record.id, { images: updated });
    onReload?.();
  }

  async function handleAddPart() {
    if (!partName.trim()) return;
    setSavingPart(true);
    const newPart = { part_name: partName.trim(), quantity: parseInt(partQty) || 1, part_number: "", unit_price: 0 };
    const updatedParts = [...(record.parts_used || []), newPart];
    await base44.entities.ServiceRecord.update(record.id, { parts_used: updatedParts });
    setPartName("");
    setPartQty(1);
    setSavingPart(false);
    onReload?.();
  }

  async function handleRemovePart(index) {
    const updatedParts = [...(record.parts_used || [])];
    updatedParts.splice(index, 1);
    await base44.entities.ServiceRecord.update(record.id, { parts_used: updatedParts });
    onReload?.();
  }

  const nextStatuses = {
    pending: [{ value: "in_progress", label: "Starta ärende", icon: Play, color: "bg-blue-600 text-white" }],
    in_progress: [
      { value: "awaiting_approval", label: "Skicka för godkänn.", icon: Clock, color: "bg-orange-500 text-white" },
      { value: "completed", label: "Markera slutförd", icon: Check, color: "bg-green-600 text-white" },
    ],
    awaiting_approval: [
      { value: "completed", label: "Markera slutförd", icon: Check, color: "bg-green-600 text-white" },
    ],
  };

  const actions = nextStatuses[record.status] || [];

  return (
    <>
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isOfflinePending ? "border-orange-300" : "border-slate-200"}`}>
      {/* Offline indicator */}
      {isOfflinePending && (
        <div className="bg-orange-50 px-4 py-1.5 flex items-center gap-1.5 text-xs text-orange-700 border-b border-orange-200">
          <AlertCircle className="w-3 h-3" />
          Uppdatering väntar på synkronisering
        </div>
      )}

      {/* Main row */}
      <div className="p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Wrench className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-slate-900 text-sm">{machine?.model || "Okänd maskin"}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[record.status]}`}>
                {statusLabel[record.status]}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono mb-1">SN: {machine?.serial_number}</div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />{customer?.company_name}
              </span>
              {record.service_date && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(record.service_date), "d MMM", { locale: sv })}
                </span>
              )}
            </div>
          </div>
          <button className="text-slate-400 mt-1 flex-shrink-0">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Quick actions always visible */}
        {actions.length > 0 && (
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          {actions.map(action => {
            const Icon = action.icon;
            const isComplete = action.value === "completed";
            return (
              <button
                key={action.value}
                onClick={() => isComplete ? setShowSignatureModal(true) : onStatusUpdate(record, action.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${action.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/50" onClick={e => e.stopPropagation()}>

          {/* Customer info */}
          <div className="bg-white rounded-xl p-3 space-y-2 border border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Kund</div>
            <div className="font-semibold text-slate-800 text-sm">{customer?.company_name}</div>
            {customer?.contact_person && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" /> {customer.contact_person}
              </div>
            )}
            {customer?.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-sm text-teal-700 font-medium">
                <Phone className="w-3.5 h-3.5" /> {customer.phone}
              </a>
            )}
            {customer?.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${customer.address}, ${customer.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-teal-700"
              >
                <MapPin className="w-3.5 h-3.5" /> {customer.address}, {customer.city}
              </a>
            )}
          </div>

          {/* Description */}
          {record.description && (
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Beskrivning</div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{record.description}</p>
            </div>
          )}

          {/* Replaced Parts */}
          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bytta reservdelar</div>
            
            {record.parts_used?.length > 0 && (
              <div className="space-y-2 mb-3">
                {record.parts_used.map((part, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm">
                    <span className="text-slate-700 font-medium">{part.part_name} <span className="text-slate-400 font-normal">x{part.quantity}</span></span>
                    <button onClick={() => handleRemovePart(i)} className="text-red-400 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Reservdelens namn..."
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50"
                value={partName}
                onChange={e => setPartName(e.target.value)}
              />
              <input
                type="number"
                min="1"
                className="w-16 text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50 text-center"
                value={partQty}
                onChange={e => setPartQty(e.target.value)}
              />
              <button
                onClick={handleAddPart}
                disabled={!partName.trim() || savingPart}
                className="bg-teal-700 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 disabled:opacity-50"
              >
                Lägg till
              </button>
            </div>
          </div>

          {/* Add note */}
          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lägg till notering</div>
            <textarea
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50"
              rows={3}
              placeholder="Skriv en notering om utfört arbete..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button
              onClick={handleSaveNote}
              disabled={!note.trim() || savingNote}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                noteSaved
                  ? "bg-green-500 text-white"
                  : "bg-teal-700 text-white disabled:opacity-50"
              }`}
            >
              {noteSaved ? "✓ Sparad!" : savingNote ? "Sparar..." : "Spara notering"}
            </button>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bilder & dokument</div>

            {record.images?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {record.images.map((img, i) => (
                  <div key={i} className="relative">
                    <a href={img} target="_blank" rel="noopener noreferrer">
                      <img src={img} alt={`Bild ${i+1}`} className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                    </a>
                    <button
                      onClick={() => handleRemoveImage(img)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-700 text-sm font-medium hover:bg-teal-50 transition-colors active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {uploading ? "Laddar upp..." : "Ta foto eller välj fil"}
            </button>
          </div>

          {/* Cost summary */}
          {record.total_cost > 0 && (
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Totalkostnad</span>
                <span className="font-bold text-slate-900">{record.total_cost.toLocaleString("sv-SE")} kr</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {showSignatureModal && (
      <SignatureModal
        record={record}
        machine={machine}
        customer={customer}
        onClose={() => setShowSignatureModal(false)}
        onComplete={() => {
          setShowSignatureModal(false);
          onReload?.();
        }}
      />
    )}
    </>
  );
}