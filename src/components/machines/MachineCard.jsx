import React from "react";
import { Link } from "react-router-dom";
import { Monitor, Wrench, Building2, FileCheck, Download, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";

const statusColor = { active: "bg-green-100 text-green-700", inactive: "bg-slate-100 text-slate-600", service: "bg-orange-100 text-orange-700" };
const statusLabel = { active: "Aktiv", inactive: "Inaktiv", service: "På service" };
const contractLabel = { basic: "Basic" };
const contractBadgeColor = { basic: "bg-teal-100 text-teal-800" };

export default function MachineCard({ 
  machine, 
  customer, 
  serviceCount, 
  lastService, 
  products,
  userRole, 
  isMobile = false,
  editingSnFor,
  setEditingSnFor,
  handleUpdateSn,
  setReportData,
  setContractMachine,
  handleDownloadContract,
  setEditing,
  setShowForm,
  handleDelete
}) {
  const displayServiceDate = lastService ? lastService.service_date : machine.service_date;

  const getContractExpiry = (machine) => {
    if (!machine.service_contract || machine.service_contract === 'none') return null;
    if (!machine.contract_start_date || !machine.contract_binding_months) return null;
    const d = new Date(machine.contract_start_date);
    d.setMonth(d.getMonth() + Number(machine.contract_binding_months));
    return d;
  };

  const isMissingSn = !machine.serial_number || machine.serial_number.toLowerCase() === "okänd" || machine.serial_number.toLowerCase() === "saknas" || machine.serial_number.trim() === "";

  return (
    <Card className={`astomed-card h-full flex flex-col ${isMobile ? 'mx-1' : ''}`}>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)} className="astomed-icon-box flex-shrink-0 hover:opacity-80 transition-opacity" style={{ width: 40, height: 40 }} title="Visa serviceärenden för denna maskin">
            <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
          </Link>
          {machine.status === "service" ? (
            <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)}>
              <Badge className={`${statusColor["service"]} cursor-pointer hover:opacity-80 underline-offset-2`}>
                {statusLabel["service"]}
              </Badge>
            </Link>
          ) : (
            <Badge className={statusColor[machine.status || "active"]}>{statusLabel[machine.status || "active"]}</Badge>
          )}
        </div>
        <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)} className="block w-fit group" title="Visa serviceärenden för denna maskin">
          <h3 className="font-bold astomed-title mb-0.5 group-hover:underline group-hover:text-[#3a9e9e] transition-colors">{machine.model}</h3>
        </Link>
        {editingSnFor?.id === machine.id ? (
          <div className="mt-1 mb-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <Input 
              value={editingSnFor.serial_number} 
              onChange={e => setEditingSnFor({...editingSnFor, serial_number: e.target.value})}
              placeholder="Ange serienummer"
              className="h-8 text-xs w-36 bg-white"
            />
            <Button 
              size="sm" 
              className="h-8 px-2 astomed-btn-primary"
              onClick={() => handleUpdateSn(machine.id, editingSnFor.serial_number)}
            >
              Spara
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-500" onClick={() => setEditingSnFor(null)}>
              Avbryt
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3 mt-0.5">
            <p className={`text-xs font-mono transition-colors ${isMissingSn ? 'text-amber-600 font-semibold' : 'astomed-muted group-hover:text-slate-600'}`}>
              SN: {isMissingSn ? "Saknas" : machine.serial_number}
            </p>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-5 px-1.5 text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={(e) => { e.preventDefault(); setEditingSnFor({ id: machine.id, serial_number: isMissingSn ? '' : machine.serial_number }); }}
            >
              ✏️ Ändra
            </Button>
          </div>
        )}
        {customer && (
          <Link to={createPageUrl(`CustomerDetails?id=${customer.id}`)} className="flex items-center gap-1.5 text-sm astomed-subtitle mb-3 hover:opacity-80 transition-opacity w-fit">
            <Building2 className="w-3.5 h-3.5 astomed-muted" />
            <span className="hover:underline">{customer.company_name}</span>
          </Link>
        )}
        <div className="text-xs astomed-muted mb-4 pt-3 border-t space-y-1 flex-1" style={{ borderColor: "#dce8e8" }}>
          <div className="flex items-center justify-between">
            <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)} className="hover:underline hover:text-[#3a9e9e] transition-colors" title="Visa serviceärenden">
              {serviceCount} servicetillfällen
            </Link>
            {displayServiceDate && (
              <div className="flex items-center gap-1.5">
                <span>Senast:</span>
                <span className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 font-medium">
                  {displayServiceDate}
                </span>
              </div>
            )}
          </div>
          {(() => {
            const expiry = getContractExpiry(machine);
            if (!expiry) return (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Inget serviceavtal</span>
              </div>
            );
            const expired = expiry < new Date();
            return (
              <div className="flex items-center justify-between mt-2">
                <span>
                  Avtal: <span className={`font-semibold px-1.5 py-0.5 rounded ${expired ? "bg-red-100 text-red-700" : contractBadgeColor[machine.service_contract]}`}>{contractLabel[machine.service_contract] || machine.service_contract}</span>
                </span>
                <span className={expired ? "text-red-600 font-medium" : ""}>
                  {expired ? "Utgånget " : "Giltigt t.o.m. "}{expiry.toLocaleDateString("sv-SE")}
                </span>
              </div>
            );
          })()}
          {(() => {
            const matchingProduct = products.find(p => 
              p.name === machine.model || 
              (p.related_machine_models && p.related_machine_models.includes(machine.model))
            );
            const combinedDocs = [
              ...(machine.documents || []),
              ...(matchingProduct?.documents || [])
            ];
            if (combinedDocs.length === 0) return null;
            return (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">Manualer & Dokument</p>
                {combinedDocs.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-slate-50 border border-slate-100 hover:border-slate-300 text-blue-600 group">
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span className="truncate flex-1 group-hover:underline">{doc.name}</span>
                  </a>
                ))}
              </div>
            );
          })()}
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <div className="flex gap-2 flex-wrap justify-start w-full">
            <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}&new=true`)}>
              <Button size="sm" variant="outline" className="w-full">
                <Wrench className="w-3 h-3 mr-1" /> Starta service
              </Button>
            </Link>
            {lastService && (lastService.status === "completed" || lastService.status === "invoiced") && (
              <Button size="sm" variant="outline" onClick={() => setReportData({ record: lastService, machine, customer })} title="Ladda ner senaste rapport">
                <FileText className="w-3 h-3 mr-1" /> Rapport
              </Button>
            )}
            {userRole !== "customer" && userRole !== "technician" && (
              <Button size="sm" variant="outline" onClick={() => setContractMachine(machine)} title="Hantera serviceavtal">
                <FileCheck className="w-3 h-3 mr-1" /> Avtal
              </Button>
            )}
            {userRole !== "customer" && machine.service_contract && machine.service_contract !== "none" && (
              <Button size="sm" variant="outline" onClick={() => handleDownloadContract(machine)} title="Ladda ner serviceavtal">
                <Download className="w-3 h-3" />
              </Button>
            )}
            {userRole !== "customer" && (
              <>
                <Button size="sm" variant="ghost" className="flex-shrink-0" onClick={() => { setEditing(machine); setShowForm(true); }}>
                  Redigera
                </Button>
                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0" onClick={() => handleDelete(machine)} title="Ta bort maskin">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}