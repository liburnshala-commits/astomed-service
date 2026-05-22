import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Plus, CheckCircle, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function FunctionControls() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Är du säker på att du vill ta bort denna funktionskontroll?")) {
      try {
        await base44.entities.FunctionControl.delete(id);
        setControls(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        alert("Kunde inte ta bort kontrollen.");
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
           if (user.role === 'admin' || user.role === 'technician') {
               const data = await base44.entities.FunctionControl.list("-created_date");
               setControls(data || []);
           } else {
               const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
               const cust = ownCustomers[0];
               if (cust) {
                  const data = await base44.entities.FunctionControl.filter({ customer_id: cust.id }, "-created_date");
                  setControls(data || []);
               }
           }
        }
      } catch (err) {
        console.error("Kunde inte ladda funktionskontroller:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Laddar...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       <div className="bg-primary text-primary-foreground p-4">
         <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground hover:opacity-80">
              <ChevronLeft className="w-5 h-5" /> Tillbaka
            </button>
         </div>
         <h1 className="text-xl font-bold">Funktionskontroll</h1>
         <p className="text-sm opacity-90">{controls.length} kontroller</p>
       </div>
       <div className="p-4 space-y-3 max-w-lg mx-auto">
         <Button variant="outline" className="w-full bg-white text-primary border-primary/20 justify-center h-12 rounded-xl mb-2 hover:bg-primary/5" asChild>
           <Link to={createPageUrl("FunctionControlForm")}>
             <Plus className="w-4 h-4 mr-2" /> Ny funktionskontroll
           </Link>
         </Button>

         {controls.map(c => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow border-slate-200 rounded-xl">
               <CardContent className="p-4 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                    <div className="font-semibold text-sm">{c.machine_model || "Okänd maskin"}</div>
                    <div className="text-xs text-slate-500">{c.control_date ? format(new Date(c.control_date), "yyyy-MM-dd") : "Inget datum"}</div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-medium px-2 py-1 rounded ${c.status === 'Ej godkänd' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                          {c.status || "Godkänd"}
                       </span>
                       <button onClick={(e) => handleDelete(e, c.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Ta bort">
                          <Trash2 className="w-4 h-4" />
                       </button>
                       <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    {c.report_pdf_url && (
                       <a href={c.report_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium" onClick={e => e.stopPropagation()}>
                         Visa PDF-rapport
                       </a>
                    )}
                 </div>
               </CardContent>
            </Card>
         ))}
         
         {controls.length === 0 && (
             <div className="text-center p-8 text-slate-500 text-sm">
                 Du har inga funktionskontroller ännu.
             </div>
         )}
       </div>
    </div>
  );
}