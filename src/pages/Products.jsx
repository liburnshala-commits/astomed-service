import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Package, Pencil, Trash2, FileText, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return await base44.entities.Product.list();
    }
  });

  const filtered = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Product.update(editing.id, data);
    } else {
      await base44.entities.Product.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Är du säker på att du vill ta bort ${product.name}?`)) {
      await base44.entities.Product.delete(product.id);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold astomed-title">Produkter & Manualer</h1>
          <p className="astomed-subtitle text-sm">Hantera produkter och ladda upp manualer som kopplas till kunders maskiner.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Ny produkt
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Sök produkt eller kategori..." 
          className="pl-9" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Inga produkter hittades</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => (
            <Card key={product.id} className="astomed-card flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 astomed-icon-box flex-shrink-0" style={{ background: "#e8f2f2" }}>
                    <Package className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                  </div>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                <h3 className="font-bold astomed-title mb-1">{product.name}</h3>
                <p className="text-sm astomed-muted flex-1">{product.description || "Ingen beskrivning"}</p>
                
                {product.documents?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">Dokument ({product.documents.length})</p>
                    <div className="space-y-1.5">
                      {product.documents.map((doc, i) => (
                        <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs p-2 rounded bg-slate-50 border border-slate-100 hover:border-slate-300 text-blue-600 group">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate flex-1 group-hover:underline">{doc.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(product); setShowForm(true); }}>
                    <Pencil className="w-4 h-4 mr-2" /> Redigera
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(product)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ProductFormModal 
          product={editing} 
          onClose={() => setShowForm(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

function ProductFormModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState(product || {
    name: "",
    category: "Ny utrustning",
    description: "",
    suggested_retail_price: 0,
    cost_price: 0,
    related_machine_models: [],
    documents: []
  });
  const [modelsInput, setModelsInput] = useState((product?.related_machine_models || []).join(", "));
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) {
        setFormData(prev => ({
          ...prev,
          documents: [...(prev.documents || []), { name: file.name, url: res.file_url }]
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Fel vid uppladdning av fil.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const models = modelsInput.split(",").map(s => s.trim()).filter(Boolean);
    onSave({ ...formData, related_machine_models: models });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Redigera Produkt" : "Ny Produkt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Produktnamn</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Kringprodukt", "Skönhetsprodukt", "Ny utrustning", "Uppgradering", "Reservdel", "Paket"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Beskrivning</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inköpspris (kr)</Label>
              <Input type="number" required value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Rek. utpris (kr)</Label>
              <Input type="number" required value={formData.suggested_retail_price} onChange={e => setFormData({...formData, suggested_retail_price: Number(e.target.value)})} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Relaterade maskinmodeller (komma-separerade)</Label>
            <Input 
              placeholder="t.ex. Soprano Titanium, Elysion" 
              value={modelsInput} 
              onChange={e => setModelsInput(e.target.value)} 
            />
            <p className="text-xs text-slate-500">Dessa används för att matcha manualer till kunders maskiner.</p>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Manualer & Dokument</Label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Ladda upp fil
                </Button>
              </div>
            </div>

            {formData.documents?.length > 0 ? (
              <div className="space-y-2">
                {formData.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm truncate">{doc.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => removeDocument(idx)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 border border-dashed rounded-md text-slate-500 text-sm">
                Inga dokument uppladdade
              </div>
            )}
          </div>

        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSubmit} className="astomed-btn-primary">Spara</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}