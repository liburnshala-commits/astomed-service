import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReminderSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await base44.entities.ReminderSettings.list();
        if (items.length === 0) {
          // Create default settings
          const newSettings = await base44.entities.ReminderSettings.create({
            enabled: true,
            reminder_type: "both",
            days_before: 3,
            reminder_time: "09:00",
            include_pending_quotes: true,
            send_email: true,
            send_inapp: true
          });
          setSettings(newSettings);
        } else {
          setSettings(items[0]);
        }
      } catch (error) {
        toast.error("Kunde inte hämta inställningar");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.ReminderSettings.update(settings.id, settings);
      toast.success("Inställningar sparade");
    } catch (error) {
      toast.error("Kunde inte spara inställningar");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    setTestSending(true);
    try {
      const response = await base44.functions.invoke('sendReminderNotifications');
      toast.success(`${response.data.sent} påminnelser skickade`);
    } catch (error) {
      toast.error("Kunde inte skicka påminnelser");
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {[1, 2].map(i => <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: "#e8f2f2" }} />)}
      </div>
    );
  }

  if (!settings) {
    return <div className="p-6 text-center astomed-muted">Kunde inte hämta inställningar</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold astomed-title">Påminnelseinställningar</h1>
        <p className="astomed-subtitle text-sm">Hantera automatiska påminnelser till kunder</p>
      </div>

      <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: "#3a9e9e" }} />
            Grundinställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold astomed-title">Aktivera påminnelser</Label>
              <p className="text-xs astomed-muted mt-1">Slå på/av automatiska påminnelser</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Reminder Type */}
              <div>
                <Label className="font-semibold astomed-title mb-2 block">Typ av påminnelse</Label>
                <Select value={settings.reminder_type} onValueChange={(value) => setSettings({ ...settings, reminder_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming_service">Kommande serviceärenden</SelectItem>
                    <SelectItem value="pending_quotes">Väntande offerter</SelectItem>
                    <SelectItem value="both">Båda typerna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Days Before */}
              <div>
                <Label className="font-semibold astomed-title mb-2 block">Dagar innan serviceärende</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.days_before}
                    onChange={(e) => setSettings({ ...settings, days_before: parseInt(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm astomed-muted">dagar före servicen</span>
                </div>
              </div>

              {/* Reminder Time */}
              <div>
                <Label className="font-semibold astomed-title mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tid för påminnelser
                </Label>
                <Input
                  type="time"
                  value={settings.reminder_time}
                  onChange={(e) => setSettings({ ...settings, reminder_time: e.target.value })}
                  className="w-32"
                />
              </div>

              {/* Pending Quotes */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold astomed-title">Påminnelser för väntande offerter</Label>
                  <p className="text-xs astomed-muted mt-1">Skicka påminnelser om offerter som väntar på godkännande</p>
                </div>
                <Switch
                  checked={settings.include_pending_quotes}
                  onCheckedChange={(checked) => setSettings({ ...settings, include_pending_quotes: checked })}
                />
              </div>

              {/* Notification channels */}
              <div className="pt-4 border-t space-y-4" style={{ borderColor: "#dce8e8" }}>
                <Label className="font-semibold astomed-title block">Notifieringskanaler</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium astomed-title">E-post</Label>
                    <p className="text-xs astomed-muted mt-0.5">Skicka e-post till kunden</p>
                  </div>
                  <Switch
                    checked={settings.send_email !== false}
                    onCheckedChange={(checked) => setSettings({ ...settings, send_email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium astomed-title">In-app notis</Label>
                    <p className="text-xs astomed-muted mt-0.5">Visas i klockikonen för inloggade kunder</p>
                  </div>
                  <Switch
                    checked={settings.send_inapp !== false}
                    onCheckedChange={(checked) => setSettings({ ...settings, send_inapp: checked })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Last Run Info */}
      {settings.last_reminder_run && (
        <Card className="astomed-card" style={{ background: "#f0faf9", borderLeft: "4px solid #3a9e9e" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" style={{ color: "#3a9e9e" }} />
            <div className="text-sm">
              <p className="font-medium astomed-title">Senaste körning</p>
              <p className="astomed-muted text-xs">{new Date(settings.last_reminder_run).toLocaleString('sv-SE')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
          style={{ background: "#1b3a3a" }}
        >
          {saving ? "Sparar..." : "Spara inställningar"}
        </Button>
        <Button
          onClick={handleTestSend}
          disabled={testSending || !settings.enabled}
          variant="outline"
          className="flex-1"
        >
          {testSending ? "Skickar..." : "Testa nu"}
        </Button>
      </div>

      {/* Info Box */}
      <Card className="astomed-card" style={{ background: "#fffaf0", borderLeft: "4px solid #d4a017" }}>
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#d4a017" }} />
          <div className="text-sm astomed-muted">
            <p className="font-medium" style={{ color: "#d4a017" }}>Tips</p>
            <p>Ställ upp ett schema för automatiska påminnelser i admin-panelen. Påminnelser skickas vid angiven tid varje dag.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}