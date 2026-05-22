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
    <div className="p-6 max-w-7xl mx-auto">
       <div className="mb-8 flex justify-between items-start">
         <div>
           <h1 className="text-3xl font-bold flex items-center gap-2">
             <CheckCircle className="w-8 h-8 text-primary" />
             Funktionskontroller
           </h1>
           <p className="text-muted-foreground mt-2">
             Hantera funktionskontroller för maskiner. {controls.length} kontroller registrerade.
           </p>
         </div>
         <Button asChild>
           <Link to={createPageUrl("FunctionControlForm")}>
             <Plus className="w-4 h-4 mr-2" /> Ny funktionskontroll
           </Link>
         </Button>
       </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

         {controls.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
               <CardContent className="p-6">
                 <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CheckCircle className="w-5 h-5" />
                     </div>
                     <div>
                        <div className="font-semibold">{c.machine_model || "Okänd maskin"}</div>
                        <div className="text-sm text-muted-foreground">{c.control_date ? format(new Date(c.control_date), "yyyy-MM-dd") : "Inget datum"}</div>
                     </div>
                   </div>
                   <button onClick={(e) => handleDelete(e, c.id)} className="text-destructive hover:text-destructive/80 p-2 rounded-md hover:bg-destructive/10 transition-colors" title="Ta bort">
                      <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
                 
                 <div className="flex items-center justify-between mt-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.status === 'Ej godkänd' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
                       {c.status || "Godkänd"}
                    </span>
                    {c.report_pdf_url && (
                       <a href={c.report_pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium" onClick={e => e.stopPropagation()}>
                         Visa Rapport (PDF)
                       </a>
                    )}
                 </div>
               </CardContent>
            </Card>
         ))}
       </div>

       {controls.length === 0 && (
           <div className="text-center p-12 bg-muted/30 rounded-xl border border-dashed mt-4 text-muted-foreground">
               Du har inga funktionskontroller registrerade ännu.
           </div>
       )}
    </div>
  );
}