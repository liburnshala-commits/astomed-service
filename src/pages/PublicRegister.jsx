import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Phone, MapPin, User, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicRegister() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    company_name: "",
    org_number: "",
    contact_person: "",
    phone: "",
    address: "",
    postal_code: "",
    city: ""
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Skapa användarkonto
      await base44.auth.signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: "customer"
      });

      setUserEmail(formData.email);
      setStep(2);
    } catch (err) {
      setError(err.message || "Kunde inte skapa konto. Kontrollera att e-posten inte redan används.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Skapa kundpost
      await base44.entities.Customer.create({
        company_name: formData.company_name,
        org_number: formData.org_number,
        contact_person: formData.contact_person || formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        postal_code: formData.postal_code,
        city: formData.city
      });

      setStep(3);
    } catch (err) {
      setError(err.message || "Kunde inte spara företagsuppgifter.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f4f6f4" }}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold astomed-title mb-2">Välkommen till Astomed!</h2>
            <p className="text-sm astomed-muted mb-6">
              Ditt konto har skapats. Du kan nu logga in och börja använda portalen.
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="astomed-btn-primary w-full"
            >
              Gå till inloggning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f4f6f4" }}>
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#e8f2f2" }}>
                <Building2 className="w-5 h-5" style={{ color: "#1b3a3a" }} />
              </div>
              <div>
                <div className="text-xl font-bold astomed-title">Företagsuppgifter</div>
                <div className="text-sm font-normal astomed-muted">Fyll i information om ditt företag</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="astomed-label">Företagsnamn *</Label>
                  <Input
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    placeholder="Företagets namn"
                  />
                </div>
                <div>
                  <Label className="astomed-label">Organisationsnummer (frivilligt)</Label>
                  <Input
                    value={formData.org_number}
                    onChange={(e) => setFormData({...formData, org_number: e.target.value})}
                    placeholder="XXXXXX-XXXX"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="astomed-label">Kontaktperson</Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    placeholder={formData.full_name}
                  />
                </div>
                <div>
                  <Label className="astomed-label">Telefon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="070-123 45 67"
                  />
                </div>
              </div>

              <div>
                <Label className="astomed-label">Adress</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Gatuadress"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="astomed-label">Postnummer</Label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    placeholder="123 45"
                  />
                </div>
                <div>
                  <Label className="astomed-label">Stad</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Stad"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="astomed-btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  "Slutför registrering"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f4f6f4" }}>
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#e8f2f2" }}>
              <User className="w-5 h-5" style={{ color: "#1b3a3a" }} />
            </div>
            <div>
              <div className="text-xl font-bold astomed-title">Skapa konto</div>
              <div className="text-sm font-normal astomed-muted">Registrera dig som ny kund</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <Label className="astomed-label">Namn *</Label>
              <Input
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="För- och efternamn"
              />
            </div>

            <div>
              <Label className="astomed-label">E-post *</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="din@epost.se"
              />
            </div>

            <div>
              <Label className="astomed-label">Lösenord *</Label>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Minst 6 tecken"
                minLength={6}
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
                "Nästa steg"
              )}
            </Button>

            <div className="text-center text-sm text-slate-500">
              Har du redan ett konto?{" "}
              <button
                type="button"
                onClick={() => base44.auth.redirectToLogin()}
                className="text-[#3a9e9e] font-medium hover:underline"
              >
                Logga in här
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}