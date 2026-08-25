import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Monitor, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DuplicatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [duplicateCustomers, setDuplicateCustomers] = useState([]);
  const [duplicateMachines, setDuplicateMachines] = useState([]);

  useEffect(() => {
    if (user?.role !== "admin") {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [customers, machines] = await Promise.all([
          base44.entities.Customer.list(),
          base44.entities.Machine.list()
        ]);

        // Process customers
        const customerNameCounts = {};
        const customerNameGroups = {};
        customers.forEach(c => {
          if (c.company_name) {
            const name = c.company_name.trim().toLowerCase();
            customerNameCounts[name] = (customerNameCounts[name] || 0) + 1;
            if (!customerNameGroups[name]) customerNameGroups[name] = [];
            customerNameGroups[name].push(c);
          }
        });

        const dCustomers = Object.keys(customerNameCounts)
          .filter(name => customerNameCounts[name] > 1)
          .map(name => ({
            name: customerNameGroups[name][0].company_name,
            count: customerNameGroups[name].length,
            records: customerNameGroups[name]
          }));

        // Process machines
        const machineSerialCounts = {};
        const machineSerialGroups = {};
        machines.forEach(m => {
          if (m.serial_number && !['saknas', 'okänd', 'okänt', '000000', '1234567890'].includes(m.serial_number.trim().toLowerCase())) {
            const sn = m.serial_number.trim().toLowerCase();
            machineSerialCounts[sn] = (machineSerialCounts[sn] || 0) + 1;
            if (!machineSerialGroups[sn]) machineSerialGroups[sn] = [];
            machineSerialGroups[sn].push(m);
          }
        });

        const dMachines = Object.keys(machineSerialCounts)
          .filter(sn => machineSerialCounts[sn] > 1)
          .map(sn => ({
            serial: machineSerialGroups[sn][0].serial_number,
            model: machineSerialGroups[sn][0].model,
            count: machineSerialGroups[sn].length,
            records: machineSerialGroups[sn]
          }));

        setDuplicateCustomers(dCustomers);
        setDuplicateMachines(dMachines);
      } catch (err) {
        console.error("Error fetching duplicates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-slate-500">Söker efter dubletter...</div>;

  if (user?.role !== "admin") {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Åtkomst nekad</h2>
        <p className="text-slate-500">Du måste vara administratör för att se denna sida.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Systemdubletter</h1>
          <p className="text-slate-500">Automatisk identifiering av potentiella dubletter i databasen</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customers */}
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle>Kunddubletter</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {duplicateCustomers.length} hittade
              </Badge>
            </div>
            <CardDescription>Kunder med exakt samma företagsnamn</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {duplicateCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Inga kunddubletter hittades.</div>
            ) : (
              <div className="divide-y">
                {duplicateCustomers.map((group, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{group.name}</h3>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        {group.count} poster
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {group.records.map(record => (
                        <div key={record.id} className="text-sm bg-white border rounded-md p-3 flex justify-between items-center shadow-sm">
                          <div>
                            <div className="font-medium text-slate-700">{record.contact_person || 'Ingen kontaktperson'}</div>
                            <div className="text-slate-500 text-xs mt-1">
                              {record.email || 'Ingen e-post'} • {record.org_number || 'Inget org.nr'}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/Customers`} target="_blank" rel="noopener noreferrer">Gå till kunder</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Machines */}
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-600" />
                <CardTitle>Maskindubletter</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {duplicateMachines.length} hittade
              </Badge>
            </div>
            <CardDescription>Maskiner med samma serienummer (exkl. okända)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {duplicateMachines.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Inga maskindubletter hittades.</div>
            ) : (
              <div className="divide-y">
                {duplicateMachines.map((group, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 font-mono">{group.serial}</h3>
                        <p className="text-xs text-slate-500">{group.model}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        {group.count} poster
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {group.records.map(record => (
                        <div key={record.id} className="text-sm bg-white border rounded-md p-3 flex justify-between items-center shadow-sm">
                          <div>
                            <div className="font-medium text-slate-700">{record.model}</div>
                            <div className="text-slate-500 text-xs mt-1">
                              ID: {record.id.slice(-6)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/Machines`} target="_blank" rel="noopener noreferrer">Gå till maskiner</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}