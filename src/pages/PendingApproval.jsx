import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full text-center shadow-lg border-slate-200">
        <CardContent className="p-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-200">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Väntar på godkännande</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Ditt konto har skapats men väntar på att bli godkänt av en administratör. Du kommer att få tillgång till systemet så snart vi har verifierat dina uppgifter.
          </p>
          <Button
            onClick={() => base44.auth.logout()}
            variant="outline"
            className="w-full h-11"
          >
            Logga ut
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}