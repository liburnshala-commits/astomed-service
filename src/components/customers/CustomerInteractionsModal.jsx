import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerInteractions from "./CustomerInteractions";

export default function CustomerInteractionsModal({ customerId, leadId, title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{title || "Interaktioner"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-4 sm:p-6 flex-1">
          <CustomerInteractions customerId={customerId} leadId={leadId} />
        </div>
      </div>
    </div>
  );
}