import React, { useState } from 'react';
import { Upload, FileText, Trash2, Loader2, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function FileUpload({ documents = [], onChange, label = "Dokument & Filer", description = "" }) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) {
        onChange([...documents, { name: file.name, url: res.file_url }]);
      }
    } catch (err) {
      console.error("Fel vid uppladdning", err);
      alert("Kunde inte ladda upp filen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDocument = (index) => {
    onChange(documents.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  const getFileBadgeText = (fileName) => {
    const ext = fileName.split('.').pop().toUpperCase();
    return ext;
  };

  return (
    <div className="space-y-2 mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Label className="font-semibold text-slate-800">{label}</Label>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className="relative shrink-0">
          <Input 
            type="file" 
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            onChange={handleFileUpload} 
            disabled={uploading}
          />
          <Button type="button" size="sm" variant="outline" disabled={uploading} className="w-full sm:w-auto">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Ladda upp bilaga
          </Button>
        </div>
      </div>
      
      {documents && documents.length > 0 && (
        <div className="space-y-2 mt-4">
          {documents.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-sm hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 truncate">
                <div className="flex-shrink-0 bg-slate-100 p-1.5 rounded">
                  {getFileIcon(doc.name)}
                </div>
                <div className="truncate flex items-center gap-2">
                  <span className="truncate text-slate-700 font-medium">{doc.name}</span>
                  <span className="shrink-0 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    {getFileBadgeText(doc.name)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => window.open(doc.url, '_blank')}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Ladda ner"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeDocument(idx)} 
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Ta bort"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}