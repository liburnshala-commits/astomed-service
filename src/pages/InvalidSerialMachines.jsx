import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function InvalidSerialMachines() {
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [allMachines, allCustomers] = await Promise.all([
        base44.entities.Machine.list(),
        base44.entities.Customer.list(),
      ]);

      const customerMap = allCustomers.reduce((acc, c) => {
        acc[c.id] = c.company_name;
        return acc;
      }, {});
      setCustomers(customerMap);

      const invalidMachines = allMachines.filter(m => {
        const sn = (m.serial_number || "").trim().toLowerCase();
        return !sn || sn === "0000" || sn === "0" || sn === "saknas" || sn === "okänt" || sn === "null" || sn === "n/a";
      });

      setMachines(invalidMachines);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Fel", description: "Kunde inte ladda maskiner.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (machineId) => {
    if (!editValue.trim()) {
      toast({ title: "Fel", description: "Serienummer kan inte vara tomt.", variant: "destructive" });
      return;
    }

    try {
      await base44.entities.Machine.update(machineId, { serial_number: editValue.trim() });
      toast({ title: "Sparat", description: "Serienummer uppdaterades." });
      setEditingId(null);
      setEditValue("");
      // Remove from list or update in list
      setMachines(machines.filter(m => m.id !== machineId));
    } catch (error) {
      console.error("Failed to save:", error);
      toast({ title: "Fel", description: "Kunde inte uppdatera serienummer.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Saknade Serienummer</h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {machines.length} maskiner
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maskiner som behöver uppdateras</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : machines.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Inga maskiner med ogiltiga serienummer hittades! Bra jobbat.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kund</TableHead>
                    <TableHead>Modell</TableHead>
                    <TableHead>Nuvarande Serienummer</TableHead>
                    <TableHead className="text-right">Åtgärd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell>
                        <Link to={`/CustomerDetails?id=${machine.customer_id}`} className="text-primary hover:underline">
                          {customers[machine.customer_id] || "Okänd kund"}
                        </Link>
                      </TableCell>
                      <TableCell>{machine.model}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{machine.serial_number || "Tomt"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === machine.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Nytt serienummer..."
                              className="w-48"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave(machine.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <Button size="sm" onClick={() => handleSave(machine.id)}>Spara</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Avbryt</Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setEditingId(machine.id);
                              setEditValue(machine.serial_number || "");
                            }}
                          >
                            Redigera
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}