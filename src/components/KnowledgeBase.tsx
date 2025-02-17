
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Link as LinkIcon, Search, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  title: string;
  type: "file" | "url";
  url?: string;
  updatedAt: string;
}

export const KnowledgeBase = () => {
  const [sources, setSources] = useState<Source[]>([
    {
      id: "1",
      title: "FAQs",
      type: "file",
      updatedAt: "23.1.2025"
    },
    {
      id: "2",
      title: "surfmobil.no/",
      type: "url",
      url: "https://surfmobil.no",
      updatedAt: "27.1.2025"
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleDelete = (id: string) => {
    setSources(sources.filter(source => source.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSourceAdd = () => {
    // TODO: Implement source addition logic
    // This will be connected to Voiceflow API later
    setShowAddModal(false);
  };

  const filteredSources = sources.filter(source => 
    source.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Kunnskapsbase</h1>
        <Button className="bg-primary text-white" onClick={() => setShowAddModal(true)}>
          + Legg til kilde
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Søk i kilder..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredSources.map((source) => (
          <div 
            key={source.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LinkIcon className="text-primary h-5 w-5" />
              <div>
                <h3 className="font-medium text-gray-900">{source.title}</h3>
                <p className="text-sm text-gray-500">Oppdatert: {source.updatedAt}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChevronDown className="h-5 w-5 text-gray-400" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(source.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Legg til ny kilde</h2>
            
            <Tabs value={selectedSourceType} onValueChange={(v) => setSelectedSourceType(v as "url" | "file")}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="url" className="flex-1">URL</TabsTrigger>
                <TabsTrigger value="file" className="flex-1">Filopplasting</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {selectedSourceType === "url" ? (
              <div className="space-y-4">
                <Input
                  placeholder="Lim inn URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button 
                  className="w-full" 
                  disabled={!url}
                  onClick={handleSourceAdd}
                >
                  Last opp URL
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                  )}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {file ? file.name : "Dra og slipp fil her eller klikk for å velge"}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <Button 
                  className="w-full" 
                  disabled={!file}
                  onClick={handleSourceAdd}
                >
                  Last opp fil
                </Button>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
