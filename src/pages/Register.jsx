import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte");
      return;
    }

    setLoading(true);

    try {
      await base44.auth.signUp({
        email,
        password,
        full_name: fullName,
        role: "customer"
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Kunde inte skapa konto. E-postadressen kanske redan används.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f4f6f4" }}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold astomed-title mb-2">Konto skapat!</h2>
            <p className="text-sm astomed-muted mb-6">
              Ditt konto har skapats. Du kan nu logga in och börja använda tjänsten.
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl("Login")}
              className="astomed-btn-primary w-full"
            >
              Gå till inloggning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f4f6f4" }}>
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex flex-col items-center text-center mb-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: "#1b3a3a" }}>
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <div className="text-2xl font-bold astomed-title">Astomed Pro</div>
            <div className="text-sm astomed-muted">Skapa ett nytt konto</div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <Label className="astomed-label">Namn</Label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="För- och efternamn"
              />
            </div>

            <div>
              <Label className="astomed-label">E-postadress</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.se"
              />
            </div>

            <div>
              <Label className="astomed-label">Lösenord</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                minLength={8}
              />
            </div>

            <div>
              <Label className="astomed-label">Bekräfta lösenord</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ange lösenordet igen"
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="astomed-btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skapar konto...
                </>
              ) : (
                "Skapa konto"
              )}
            </Button>

            <div className="text-center text-sm text-slate-500 pt-2">
              Har du redan ett konto?{" "}
              <a
                href={createPageUrl("Login")}
                className="text-[#3a9e9e] font-medium hover:underline"
              >
                Logga in här
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}