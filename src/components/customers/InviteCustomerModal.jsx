import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InviteCustomerModal({ customer, onClose }) {
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState(null);
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("generateCustomerPortalToken", {
        customer_id: customer.id,
      });
      const token = response.data.token;
      setToken(token);
      const url = `${window.location.origin}/customer-portal?token=${token}`;
      setPortalUrl(url);
      toast.success("Portal-länk genererad!");
    } catch (error) {
      toast.error("Fel vid generering av länk: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmailInvite = async () => {
    setLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: customer.email,
        subject: `Tillgång till din Astomed-kundportal`,
        body: `Hej ${customer.company_name},\n\ndu har nu tillgång till Astomed kundportal där du kan se din servicehistorik och beställa ny service.\n\nÖppna denna länk för att logga in:\n${portalUrl}\n\nMvh\nAstomed`,
      });
      toast.success("Inbjudan skickad till " + customer.email);
      onClose();
    } catch (error) {
      toast.error("Fel vid skickning av e-post: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bjud in kund</DialogTitle>
          <DialogDescription>
            Generera en portal-länk för {customer?.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!portalUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Klicka på knappen nedan för att generera en personlig portal-länk som du kan skicka till kunden.
              </p>
              <Button
                onClick={generateToken}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  "Generera portal-länk"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <p className="text-xs text-blue-600 mb-2">Portal-länk:</p>
                  <div className="flex gap-2">
                    <Input
                      value={portalUrl}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-gray-600">
                Du kan nu antingen:
              </p>

              <Button
                onClick={sendEmailInvite}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Skicka inbjudan via e-post
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Eller kopiera länken ovan och skicka manuellt.
              </p>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Stäng
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}