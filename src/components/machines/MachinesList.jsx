import React from "react";
import { Monitor } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function MachinesList({ machines, renderCard }) {
  if (machines.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-slate-400">
        <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Inga maskiner hittades</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {machines.map(machine => renderCard(machine))}
      </div>

      <div className="md:hidden">
        {machines.length > 1 && (
          <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
            <span>←</span> Svep för fler maskiner ({machines.length} st) <span>→</span>
          </div>
        )}
        <Carousel className="w-full" opts={{ align: "start" }}>
          <CarouselContent>
            {machines.map(machine => (
              <CarouselItem key={machine.id} className="basis-11/12 sm:basis-8/12">
                {renderCard(machine, true)}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </>
  );
}