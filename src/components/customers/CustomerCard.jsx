import React from "react";
import { Link } from "react-router-dom";
import { Building2, Phone, Mail, ExternalLink, Trash2, UserPlus, Check, Copy, Loader2, Star, MonitorUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CustomerLatestInteraction from "@/components/customers/CustomerLatestInteraction.jsx";
import { createPageUrl } from "@/utils";

export default function CustomerCard({
  customer,
  isMobile = false,
  userRole,
  contractInfo,
  machineCount,
  isInvited,
  generatingLink,
  copiedId,
  inviting,
  handleToggleDelete,
  setSmsCustomer,
  generateAndCopyPortalLink,
  inviteCustomer,
  setEditing,
  setShowForm,
  setDeletingCustomer
}) {
  return (
    <Card className={`astomed-card h-full flex flex-col relative ${isMobile ? 'mx-1' : ''}`}>
      {contractInfo.count > 0 && (
        <div className="absolute top-3 right-3 z-10">
          {contractInfo.hasRejected ? (
            <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm" title="Nekat signering">
              <span className="font-bold text-sm">!</span>
            </div>
          ) : contractInfo.hasActive ? (
            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm" title="Aktivt serviceavtal">
              <Check className="w-4 h-4" />
            </div>
          ) : null}
        </div>
      )}
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 astomed-muted flex-shrink-0" />
              <Link to={createPageUrl(`CustomerDetails?id=${customer.id}`)} className="font-semibold astomed-title truncate hover:text-[#3a9e9e] hover:underline">
                {customer.company_name}
              </Link>
              {customer.is_imported && (
                <span title="Ny kund via import" className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 fill-current" /> Ny
                </span>
              )}
              {customer.has_added_machine_via_import && (
                <span title="Fått ny maskin tillagd via import" className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 flex-shrink-0">
                  <MonitorUp className="w-3 h-3" /> Uppdaterad
                </span>
              )}
            </div>
            {userRole === "admin" && (
              <div className="ml-6 mb-2">
                <Button
                  size="sm"
                  variant={customer.is_deleted ? "destructive" : "outline"}
                  onClick={() => handleToggleDelete(customer, !customer.is_deleted)}
                >
                  {customer.is_deleted ? "🗑️ Markerad för radering" : "Aktiv kund"}
                </Button>
              </div>
            )}
            {customer.org_number && <p className="text-xs astomed-muted ml-6 mb-2">Org.nr: {customer.org_number}</p>}
            <div className="grid sm:grid-cols-3 gap-2 ml-6">
              {customer.contact_person && <div className="text-sm astomed-subtitle">👤 {customer.contact_person}</div>}
              {customer.phone && (
                <div className="text-sm astomed-subtitle flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {customer.phone}
                  <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5 ml-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSmsCustomer(customer); }}>SMS</Button>
                </div>
              )}
              {customer.email && <div className="text-sm astomed-subtitle flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</div>}
            </div>
            {(customer.address || customer.city) && (
              <div className="text-xs astomed-muted ml-6 mt-1">{customer.address}{customer.city ? `, ${customer.city}` : ""}</div>
            )}
            <div className="mt-3">
              <CustomerLatestInteraction customerId={customer.id} />
            </div>
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <div className="flex gap-2 flex-wrap justify-start sm:justify-end w-full mb-1">
            <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
              <Badge variant="secondary" className="bg-[#e8f2f2] text-[#1b3a3a] cursor-pointer hover:bg-[#d0e8e8] transition-colors">
                {machineCount} maskin{machineCount !== 1 ? "er" : ""}
              </Badge>
            </Link>
            {contractInfo.count > 0 && (
              <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
                <Badge variant="secondary" className={`cursor-pointer transition-colors ${
                  contractInfo.hasRejected 
                    ? "bg-red-100 text-red-800 hover:bg-red-200" 
                    : contractInfo.hasActive 
                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                      : "bg-[#f0f7f0] text-[#1a5c2a] hover:bg-[#d8eddb]"
                }`}>
                  {contractInfo.count} serviceavtal
                </Badge>
              </Link>
            )}
          </div>
          <div className="flex flex-wrap justify-start sm:justify-end w-full gap-2 mt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateAndCopyPortalLink(customer)}
              disabled={!customer.email || generatingLink === customer.id}
              title={customer.email ? "Generera och kopiera portal-länk" : "Kunden saknar e-post"}
            >
              {generatingLink === customer.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : copiedId === customer.id ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span className="ml-1 text-xs hidden sm:inline">
                {copiedId === customer.id ? "Kopierad" : "Kopiera länk"}
              </span>
            </Button>
            <Button
              size="sm"
              variant={isInvited ? "secondary" : "outline"}
              onClick={() => inviteCustomer(customer)}
              disabled={inviting === customer.id || !customer.email}
              title={!customer.email ? "Kunden saknar e-post" : isInvited ? "Kunden är redan inbjuden (Klicka för att skicka igen)" : "Bjud in kunden att skapa konto"}
              className={`relative ${isInvited ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : ""}`}
            >
              {isInvited || inviting === customer.id ? <Check className="w-3 h-3 text-blue-600" /> : <UserPlus className="w-3 h-3" />}
              <span className="ml-1 text-xs hidden sm:inline">
                {isInvited ? "Inbjuden" : inviting === customer.id ? "Skickat!" : "Bjud in"}
              </span>
              {isInvited && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
            </Button>
            <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
              <Button size="sm" variant="outline">
                <ExternalLink className="w-3 h-3" /><span className="ml-1 hidden sm:inline">Maskiner</span>
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(customer); setShowForm(true); }}>
              <span className="hidden sm:inline">Redigera</span><span className="sm:hidden">✏️</span>
            </Button>
            {userRole !== "technician" && (
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletingCustomer(customer)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}