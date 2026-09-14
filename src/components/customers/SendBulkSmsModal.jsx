import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SendBulkSmsModal({ customers, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filtrera bort kunder som saknar telefonnummer
  const customersWithPhone = customers.filter(c => c.phone && c.phone.trim().length > 4);

  const handleSend = async () => {
    if (!message) {
      toast.error("Vänligen skriv ett meddelande.");
      return;
    }

    if (customersWithPhone.length === 0) {
      toast.error("Inga kunder med giltiga telefonnummer hittades i listan.");
      return;
    }

    if (!window.confirm(`Är du säker på att du vill skicka detta SMS till ${customersWithPhone.length} kunder? Detta kommer kosta pengar via ditt 46elks-konto.`)) {
        return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < customersWithPhone.length; i++) {
      const customer = customersWithPhone[i];
      // Format the phone number roughly (remove leading 0 and add +46)
      const phone = customer.phone.replace(/^0/, '+46').replace(/[^0-9+]/g, '');
      
      try {
        await base44.functions.invoke("sendSms", {
          to: phone,
          message: message,
          from: "Astomed"
        });
        
        successCount++;
        
        // Logga händelsen på kunden i bakgrunden
        base44.entities.CustomerInteraction.create({
          customer_id: customer.id,
          interaction_type: "SMS",
          notes: `Mass-SMS: "${message}" till ${phone}`,
          interaction_date: new Date().toISOString()
        }).catch(e => console.error("Kunde inte logga interaktion", e));
        
      } catch (error) {
        console.error("Failed to send to " + phone, error);
        failCount++;
      }
      
      setProgress(Math.round(((i + 1) / customersWithPhone.length) * 100));
    }

    setSending(false);
    toast.success(`Mass-SMS slutfört! Skickade: ${successCount}, Misslyckade: ${failCount}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={() => !sending && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Skicka Mass-SMS ({customersWithPhone.length} mottagare)
          </DialogTitle>
          <DialogDescription>
            Skicka ett SMS till alla kunder i listan som har ett telefonnummer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Meddelande</Label>
            <Textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              rows={5} 
              placeholder="Skriv ditt meddelande här..." 
              disabled={sending}
            />
            <div className="text-right text-xs text-slate-400">
              {message.length} tecken (ca {Math.ceil(message.length / 160)} SMS per person)
            </div>
          </div>
          
          {sending && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Skickar...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Avbryt</Button>
          <Button onClick={handleSend} disabled={sending || !message || customersWithPhone.length === 0}>
            {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Skickar...</> : "Skicka till Alla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}