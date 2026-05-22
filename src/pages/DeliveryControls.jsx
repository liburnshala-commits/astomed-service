import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Plus, Box, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function DeliveryControls() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      if (user) {
         const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
         const cust = ownCustomers[0];
         if (cust) {
            const data = await base44.entities.DeliveryControl.filter({ customer_id: cust.id }, "-created_date");
            setControls(data);
         } else {
             // For admins/technicians viewing all
             if (user.role === 'admin' || user.role === 'technician') {
                 const data = await base44.entities.DeliveryControl.list("-created_date");
                 setControls(data);
             }
         }
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Laddar...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       <div className="bg-[#0088ff] text-white p-4">
         <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white hover:opacity-80">
              <ChevronLeft className="w-5 h-5" /> Tillbaka
            </button>
         </div>
         <h1 className="text-xl font-bold">Leveranskontroll</h1>
         <p className="text-sm opacity-90">{controls.length} kontroller</p>
       </div>
       <div className="p-4 space-y-3 max-w-lg mx-auto">
         <Button variant="outline" className="w-full bg-white text-[#0088ff] border-blue-200 justify-center h-12 rounded-xl mb-2" asChild>
           <Link to={createPageUrl("DeliveryControlForm")}>
             <Plus className="w-4 h-4 mr-2" /> Ny leveranskontroll
           </Link>
         </Button>

         {controls.map(c => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow border-slate-200 rounded-xl">
               <CardContent className="p-4 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0088ff]">
                    <Box className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                    <div className="font-semibold text-sm">{c.model || "Okänd modell"}</div>
                    <div className="text-xs text-slate-500">{c.control_date ? format(new Date(c.control_date), "yyyy-MM-dd") : "Inget datum"}</div>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${c.delivery_control_status === 'Ej godkänd' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                       {c.delivery_control_status || "Godkänd"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                 </div>
               </CardContent>
            </Card>
         ))}
         
         {controls.length === 0 && (
             <div className="text-center p-8 text-slate-500 text-sm">
                 Du har inga leveranskontroller ännu.
             </div>
         )}
       </div>
    </div>
  );
}