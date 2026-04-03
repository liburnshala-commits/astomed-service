import { Inbox, GripVertical, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

const typeColor = { standard: "bg-slate-100 text-slate-700", advanced: "bg-indigo-100 text-indigo-700" };
const typeLabel = { standard: "Standard", advanced: "Avancerad" };

export default function PendingQueue({ records, machines, customers, onDragStart, onBook }) {
  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  if (records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
        <Inbox className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">Inga väntande ärenden</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop List View */}
      <div className="hidden lg:flex flex-1 flex-col overflow-y-auto p-3 space-y-2">
        {records.map(r => {
          const machine = getMachine(r.machine_id);
          const customer = getCustomer(r.customer_id);
          return (
            <div
              key={r.id}
              draggable
              onDragStart={() => onDragStart(r)}
              className="bg-white border border-slate-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#3a9e9e] hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{machine?.model || "Okänd maskin"}</div>
                  <div className="text-xs text-slate-400 font-mono">SN: {machine?.serial_number || "–"}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">{customer?.company_name || "Okänd kund"}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Badge className={`text-xs ${typeColor[r.service_type]}`}>{typeLabel[r.service_type]}</Badge>
                    {r.technician_name && (
                      <span className="text-xs text-slate-400">{r.technician_name.split(" ")[0]}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 text-xs h-7 text-[#1b3a3a] border-[#dce8e8] hover:bg-[#e8f2f2]"
                onClick={() => onBook(r)}
              >
                <CalendarPlus className="w-3 h-3 mr-1" /> Boka in
              </Button>
            </div>
          );
        })}
      </div>

      {/* Mobile Carousel View */}
      <div className="lg:hidden p-4 w-full h-full pb-10">
        {records.length > 1 && (
          <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
            <span>←</span> Svep för fler köade ärenden ({records.length} st) <span>→</span>
          </div>
        )}
        <Carousel className="w-full" opts={{ align: "start" }}>
          <CarouselContent>
            {records.map(r => {
              const machine = getMachine(r.machine_id);
              const customer = getCustomer(r.customer_id);
              return (
                <CarouselItem key={r.id} className="basis-11/12 sm:basis-8/12">
                  <Card className="bg-white shadow-sm border-slate-200 mx-1 h-full flex flex-col">
                    <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg leading-tight text-slate-900 truncate">
                            {machine?.model || "Okänd maskin"}
                          </h3>
                          <Badge className={`border-0 px-2 py-0.5 text-[10px] ${typeColor[r.service_type]}`}>
                            {typeLabel[r.service_type]}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mb-3">SN: {machine?.serial_number || "–"}</div>
                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                          <div className="font-medium text-slate-800">{customer?.company_name || "Okänd kund"}</div>
                          <div className="text-xs text-slate-500">Tekniker: {r.technician_name || "Ej tilldelad"}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full h-11 text-[#1b3a3a] border-[#dce8e8] hover:bg-[#e8f2f2]"
                        onClick={() => onBook(r)}
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" /> Boka in
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </>
  );
}