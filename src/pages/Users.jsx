import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users as UsersIcon, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingRoles, setPendingRoles] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("technician");
  const [inviting, setInviting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allUsers, user] = await Promise.all([
          base44.entities.User.list(),
          base44.auth.me()
        ]);
        setUsers(allUsers);
        setCurrentUser(user);
      } catch (error) {
        console.error("Fel vid hämtning av användare:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "technician":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRoleChange = (email, newRole) => {
    setPendingRoles({
      ...pendingRoles,
      [email]: newRole
    });
  };

  const handleSaveRoles = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const results = await Promise.allSettled(
        Object.entries(pendingRoles).map(([email, newRole]) =>
          base44.functions.invoke("updateUserRole", { email, role: newRole })
        )
      );
      
      const failed = results.filter(r => r.status === "rejected");
      if (failed.length > 0) {
        setSaveError("Rollbyte misslyckades. Ändra roller direkt i Base44-dashboarden under Settings → Users.");
        setSaving(false);
        return;
      }
      
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers);
      setPendingRoles({});
    } catch (error) {
      setSaveError("Rollbyte misslyckades. Ändra roller direkt i Base44-dashboarden under Settings → Users.");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) {
      toast.error("Vänligen fyll i både e-post och roll");
      return;
    }

    setInviting(true);
    try {
      await base44.functions.invoke("inviteUser", {
        email: inviteEmail,
        role: inviteRole,
        inviterName: currentUser?.full_name || currentUser?.email
      });
      
      toast.success(`Inbjudan skickad till ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("technician");
      
      // Refresh users list
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers);
    } catch (error) {
      toast.error("Fel vid inbjudan: " + error.message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-6" style={{ background: "#f4f6f4" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 astomed-icon-box">
                <UsersIcon className="w-5 h-5" style={{ color: "#1b3a3a" }} />
              </div>
              <div>
                <h1 className="astomed-title text-3xl">Användare</h1>
                <p className="astomed-subtitle">Hantera alla användare i systemet</p>
              </div>
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="astomed-btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Bjud in användare
            </Button>
          </div>
        </div>

        <Card className="astomed-card mb-6">
          <CardHeader>
            <CardTitle className="astomed-title">Sök användare</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Sök efter namn eller e-post..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">Laddar användare...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 astomed-subtitle">
            Ingen användare hittad
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="astomed-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="astomed-title font-semibold">
                          {user.full_name || "Ingen namn"}
                        </h3>
                        <p className="astomed-subtitle text-sm">{user.email}</p>
                        <p className="astomed-muted text-xs mt-2">
                          Skapad:{" "}
                          {new Date(user.created_date).toLocaleDateString("sv-SE")}
                        </p>
                      </div>
                      <Select
                        value={pendingRoles[user.email] || user.role}
                        onValueChange={(newRole) =>
                          handleRoleChange(user.email, newRole)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="technician">Tekniker</SelectItem>
                          <SelectItem value="customer">Kund (Godkänd)</SelectItem>
                          <SelectItem value="user">Väntande / Ogodkänd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {saveError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <strong>Fel:</strong> {saveError}
              </div>
            )}

            {Object.keys(pendingRoles).length > 0 && (
              <div className="mt-6 flex gap-3 sticky bottom-6">
                <Button
                  onClick={handleSaveRoles}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? "Sparar..." : "Spara ändringar"}
                </Button>
                <Button
                  onClick={() => setPendingRoles({})}
                  variant="outline"
                  disabled={saving}
                >
                  Avbryt
                </Button>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-sm astomed-subtitle">
          Totalt antal användare: <strong>{filteredUsers.length}</strong>
        </div>
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bjud in ny användare</DialogTitle>
            <DialogDescription>
              Användaren får ett välkomstmail med instruktioner för att komma igång
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="astomed-label text-sm mb-2 block">E-postadress</label>
              <Input
                type="email"
                placeholder="anvandare@exempel.se"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="astomed-label text-sm mb-2 block">Roll</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administratör</SelectItem>
                  <SelectItem value="technician">Service Tekniker</SelectItem>
                  <SelectItem value="customer">Kund (Godkänd)</SelectItem>
                  <SelectItem value="user">Väntande / Ogodkänd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">📧 Vad händer nu?</p>
              <p>Användaren kommer få ett välkomstmail med instruktioner för att:</p>
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Gå till inloggningssidan</li>
                <li>Klicka på "Glömt lösenord?"</li>
                <li>Skapa sitt lösenord</li>
                <li>Logga in och komma igång</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleInviteUser}
                disabled={inviting}
                className="flex-1 astomed-btn-primary"
              >
                {inviting ? "Skickar..." : "Skicka inbjudan"}
              </Button>
              <Button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                  setInviteRole("technician");
                }}
                variant="outline"
                disabled={inviting}
              >
                Avbryt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}