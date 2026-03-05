import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users as UsersIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingRoles, setPendingRoles] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await base44.entities.User.list();
        setUsers(allUsers);
      } catch (error) {
        console.error("Fel vid hämtning av användare:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
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
    try {
      await Promise.all(
        Object.entries(pendingRoles).map(([email, newRole]) =>
          base44.functions.invoke("updateUserRole", { email, role: newRole })
        )
      );
      
      // Hämta uppdaterad användarlista från server
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers);
      
      // Rensa pending roles
      setPendingRoles({});
    } catch (error) {
      console.error("Fel vid uppdatering av roller:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6" style={{ background: "#f4f6f4" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 astomed-icon-box">
              <UsersIcon className="w-5 h-5" style={{ color: "#1b3a3a" }} />
            </div>
            <h1 className="astomed-title text-3xl">Användare</h1>
          </div>
          <p className="astomed-subtitle">Hantera alla användare i systemet</p>
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
                          <SelectItem value="user">Användare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
    </div>
  );
}