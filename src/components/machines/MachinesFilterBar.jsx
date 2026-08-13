import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MACHINE_MODELS } from "@/lib/constants";

export default function MachinesFilterBar({
  search, setSearch,
  filterModel, setFilterModel,
  filterCustomer, setFilterCustomer,
  filterContract, setFilterContract,
  customers
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Sök serienummer eller modell..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Select value={filterModel} onValueChange={setFilterModel}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Alla modeller" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla modeller</SelectItem>
          {MACHINE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filterCustomer} onValueChange={setFilterCustomer}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Alla kunder" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla kunder</SelectItem>
          {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filterContract} onValueChange={setFilterContract}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Avtalsstatus" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla maskiner</SelectItem>
          <SelectItem value="active">Aktivt avtal</SelectItem>
          <SelectItem value="none">Inget avtal</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}