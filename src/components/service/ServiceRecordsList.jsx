import React from "react";
import { Wrench } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ServiceRecordCard from "@/components/service/ServiceRecordCard.jsx";

export default function ServiceRecordsList({ 
  records, 
  filters, 
  setFilters,
  getMachine,
  getCustomer,
  isNyinkommen,
  userRole,
  setViewing,
  setEditing,
  setShowForm,
  handleCopyLink,
  handleDelete
}) {
  return (
    <Tabs value={filters.status} onValueChange={(val) => setFilters(f => ({ ...f, status: val }))} className="w-full mt-6">
      <div className="overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0">
        <TabsList className="h-auto p-1 bg-slate-100/50 flex w-max min-w-full">
          <TabsTrigger value="all" className="flex-1 whitespace-nowrap">Alla</TabsTrigger>
          <TabsTrigger value="in_progress" className="flex-1 whitespace-nowrap">Pågående</TabsTrigger>
          <TabsTrigger value="planned" className="flex-1 whitespace-nowrap">Planerad</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 whitespace-nowrap">Väntande</TabsTrigger>
          <TabsTrigger value="awaiting_approval" className="flex-1 whitespace-nowrap">Inväntar godkännande</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 whitespace-nowrap">Slutförd</TabsTrigger>
          <TabsTrigger value="invoiced" className="flex-1 whitespace-nowrap">Fakturerad</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value={filters.status} className="mt-4 focus-visible:outline-none focus-visible:ring-0">
        <div className="hidden md:flex flex-col space-y-3">
          {records.map(record => (
            <div key={record.id}>
              <ServiceRecordCard
                record={record}
                machine={getMachine(record.machine_id)}
                customer={getCustomer(record.customer_id)}
                isNyinkommen={isNyinkommen(record)}
                userRole={userRole}
                isMobile={false}
                setViewing={setViewing}
                setEditing={setEditing}
                setShowForm={setShowForm}
                handleCopyLink={handleCopyLink}
                handleDelete={handleDelete}
              />
            </div>
          ))}
        </div>

        <div className="md:hidden pb-4 mt-4">
          {records.length > 1 && (
            <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
              <span>←</span> Svep för fler ärenden ({records.length} st) <span>→</span>
            </div>
          )}
          <Carousel className="w-full" opts={{ align: "start" }}>
            <CarouselContent>
              {records.map(record => (
                <CarouselItem key={record.id} className="basis-11/12 sm:basis-8/12">
                  <ServiceRecordCard
                    record={record}
                    machine={getMachine(record.machine_id)}
                    customer={getCustomer(record.customer_id)}
                    isNyinkommen={isNyinkommen(record)}
                    userRole={userRole}
                    isMobile={true}
                    setViewing={setViewing}
                    setEditing={setEditing}
                    setShowForm={setShowForm}
                    handleCopyLink={handleCopyLink}
                    handleDelete={handleDelete}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {records.length === 0 && (
          <div className="text-center py-12 text-slate-400 w-full">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Inga serviceärenden hittades</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}