import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DistanceDisplay({ address, postalCode, city }) {
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address && !city) {
      setLoading(false);
      return;
    }
    
    const fetchDistance = async () => {
      try {
        const fullAddress = `${address || ''}, ${postalCode || ''} ${city || ''}`.trim();
        const res = await base44.functions.invoke("getDistanceToCustomer", { customerAddress: fullAddress });
        
        if (res.data && res.data.distance_km !== undefined) {
          setDistance(res.data.distance_km);
        } else {
          setDistance("Ingen data");
        }
      } catch (err) {
        console.error("Failed to fetch distance", err);
        setDistance("Fel vid hämtning");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDistance();
  }, [address, postalCode, city]);

  if (loading) {
    return (
      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
        <MapPin className="w-3 h-3 animate-pulse" /> Beräknar avstånd...
      </div>
    );
  }
  
  if (distance === null || distance === "Ingen data" || distance === "Fel vid hämtning") {
    return (
      <div className="text-xs text-red-500 mt-2 flex items-center gap-1 bg-red-50 p-1.5 rounded-md w-fit border border-red-200">
        <MapPin className="w-3.5 h-3.5" /> <span className="font-medium">{distance || "Kunde inte beräkna"}</span>
      </div>
    );
  }

  return (
    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-md w-fit border border-slate-200/50" title="Avstånd från Kungens Kurva">
      <MapPin className="w-3.5 h-3.5 text-slate-400" /> <span className="font-medium text-slate-600">{distance} km</span> <span className="text-slate-400">från Kungens Kurva</span>
    </div>
  );
}