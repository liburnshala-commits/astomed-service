import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_PREFS = {
  in_app_enabled: true,
  email_enabled: true,
  notify_upcoming_service: true,
  notify_quote_pending: true,
  notify_status_change: true,
};

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const existing = await base44.entities.NotificationPreferences.filter({ user_email: u.email });
      if (existing.length > 0) {
        setPrefs(existing[0]);
      } else {
        // Create default preferences
        const created = await base44.entities.NotificationPreferences.create({
          user_email: u.email,
          ...DEFAULT_PREFS,
        });
        setPrefs(created);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.NotificationPreferences.update(prefs.id, prefs);
    toast.success("Inställningar sparade");
    setSaving(false);
  };

  const toggle = (field) => setPrefs(p => ({ ...p, [field]: !p[field] }));

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        {[1, 2].map(i => <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: "#e8f2f2" }} />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold astomed-title">Notifieringsinställningar</h1>
        <p className="astomed-subtitle text-sm">Välj hur och när du vill få notifieringar</p>
      </div>

      {/* Kanaler */}
      <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base astomed-title">
            <Bell className="w-5 h-5" style={{ color: "#3a9e9e" }} />
            Notifieringskanaler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#e8f2f2" }}>
                <Smartphone className="w-4 h-4" style={{ color: "#1b3a3a" }} />
              </div>
              <div>
                <Label className="font-semibold astomed-title block">In-app notiser</Label>
                <p className="text-xs astomed-muted">Visas i klockikonen uppe till höger</p>
              </div>
            </div>
            <Switch
              checked={prefs.in_app_enabled}
              onCheckedChange={() => toggle("in_app_enabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#e8f2f2" }}>
                <Mail className="w-4 h-4" style={{ color: "#1b3a3a" }} />
              </div>
              <div>
                <Label className="font-semibold astomed-title block">E-post</Label>
                <p className="text-xs astomed-muted">Skickas till {user?.email}</p>
              </div>
            </div>
            <Switch
              checked={prefs.email_enabled}
              onCheckedChange={() => toggle("email_enabled")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Händelsetyper */}
      <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base astomed-title">
            <CheckCircle className="w-5 h-5" style={{ color: "#3a9e9e" }} />
            Notifiera mig om
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold astomed-title block">Kommande serviceärenden</Label>
              <p className="text-xs astomed-muted">Påminnelse när ett serviceärende närmar sig</p>
            </div>
            <Switch
              checked={prefs.notify_upcoming_service}
              onCheckedChange={() => toggle("notify_upcoming_service")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold astomed-title block">Väntande offerter</Label>
              <p className="text-xs astomed-muted">Påminnelse när en offert väntar på godkännande</p>
            </div>
            <Switch
              checked={prefs.notify_quote_pending}
              onCheckedChange={() => toggle("notify_quote_pending")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold astomed-title block">Statusändringar</Label>
              <p className="text-xs astomed-muted">Notis när ett ärende byter status</p>
            </div>
            <Switch
              checked={prefs.notify_status_change}
              onCheckedChange={() => toggle("notify_status_change")}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
        style={{ background: "#1b3a3a" }}
      >
        {saving ? "Sparar..." : "Spara inställningar"}
      </Button>
    </div>
  );
}