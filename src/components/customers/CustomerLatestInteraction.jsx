import { useState } from "react";
import { MessageSquare } from "lucide-react";
import CustomerInteractionsModal from "./CustomerInteractionsModal";

export default function CustomerLatestInteraction({ customerId }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="w-full mt-4 p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg text-sm text-slate-600 flex items-center justify-center gap-2 border border-dashed border-slate-200"
      >
        <MessageSquare className="w-4 h-4 opacity-50" />
        Loggbok & Händelser
      </button>
      {showModal && (
        <CustomerInteractionsModal 
          customerId={customerId} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}