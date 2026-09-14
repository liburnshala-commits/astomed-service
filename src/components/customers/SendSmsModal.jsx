import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

export default function SendSmsModal({ customer, onClose }) {
  const [message, setMessage] = useState("");
  // Normalize phone number to standard international format roughly (46elks expects +46...)
  const initialPhone = customer.phone ? customer.phone.replace(/^0/, '+46').replace(/[^0-9+]/g, '') : "";
  const [phone, setPhone] = useState(initialPhone);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!phone || !message) {
      toast.error("Vänligen fyll i nummer och meddelande");
      return;
    }

    setSending(true);
    try {
      await base44.functions.invoke("sendSms", {
        to: phone,
        message: message,
        from: "Astomed"
      });
      toast.success("SMS skickades framgångsrikt.");
      
      // Optionally log this interaction
      try {
        await base44.entities.CustomerInteraction.create({
          customer_id: customer.id,
          interaction_type: "SMS",
          notes: `Skickade SMS: "${message}" till ${phone}`,
          interaction_date: new Date().toISOString()
        });
      } catch (err) {
        console.error("Kunde inte logga interaktionen", err);
      }
      
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte skicka SMS. Kontrollera numret och dina inställningar.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Skicka SMS
          </DialogTitle>
          <DialogDescription>
            Skicka ett SMS direkt till {customer.contact_person || customer.company_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Telefonnummer</Label>
            <Input 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+46701234567" 
            />
            <p className="text-xs text-slate-500">Måste inkludera landskod, t.ex. +46.</p>
          </div>
          <div className="space-y-2">
            <Label>Meddelande</Label>
            <Textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              rows={5} 
              placeholder="Skriv ditt meddelande här..." 
            />
            <div className="text-right text-xs text-slate-400">
              {message.length} tecken
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Avbryt</Button>
          <Button onClick={handleSend} disabled={sending || !message || !phone}>
            {sending ? "Skickar..." : "Skicka SMS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}