
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Search, Trash2, Upload, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import { SourceExplorer } from "./knowledge-base/SourceExplorer";
import { AddSourceSheet } from "./knowledge-base/AddSourceSheet";
import { SourceTypeFilter } from "./knowledge-base/SourceTypeFilter";
import { 
  VoiceflowDocument, 
  VoiceflowResponse,
  VoiceflowChunksResponse,
  Chunk,
  SourceType,
  QAPair
} from "./knowledge-base/types";

const KnowledgeBase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<VoiceflowDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType>("all");

  const showLoader = useMinimumLoading(isLoading);
  const showChunksLoader = useMinimumLoading(isLoadingChunks);

  const fetchSources = async () => {
    if (!user?.organization_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("voiceflow-kb", {
        body: { action: "list_docs" },
      });
      if (error) throw error;

      const processedSources = (data?.data || []).map((source: VoiceflowDocument) => ({
        ...source,
        detectedType: detectSourceType(source),
      }));

      setSources(processedSources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke hente kilder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchSources();
  }, [user?.organization_id]);

  const handleExpandSource = async (documentId: string) => {
    if (expandedSourceId === documentId) {
      setExpandedSourceId(null);
      setChunks([]);
      return;
    }

    setIsLoadingChunks(true);
    setExpandedSourceId(documentId);

    try {
      const { data, error } = await supabase.functions.invoke("voiceflow-kb", {
        body: { action: "get_doc", documentID: documentId },
      });
      if (error) throw error;
      setChunks((data as VoiceflowChunksResponse).chunks);
    } catch (error) {
      console.error("Error fetching chunks:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke hente chunks",
        variant: "destructive",
      });
      setExpandedSourceId(null);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!user?.organization_id) {
      toast({
        title: "Feil",
        description: "Ingen organisasjon funnet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("voiceflow-kb", {
        body: { action: "delete_doc", documentID: documentId },
      });
      if (error) throw error;


      setSources(sources.filter(source => source.documentID !== documentId));

      toast({
        title: "Suksess",
        description: "Kilden ble slettet",
      });
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke slette kilden",
        variant: "destructive",
      });
    }
  };

  const filteredSources = sources.filter(source => {
    const matchesSearch = source.data.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      sourceTypeFilter === "all" || 
      (source.detectedType === sourceTypeFilter);
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Kunnskapsbase</h1>
        <AddSourceSheet 
          isOpen={isSheetOpen} 
          onOpenChange={setIsSheetOpen} 
          sources={sources}
          onSourceAdded={fetchSources}
        />
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Søk i kilder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <SourceTypeFilter 
          value={sourceTypeFilter} 
          onChange={setSourceTypeFilter} 
        />
      </div>

      {showLoader ? (
        <div className="mt-8 flex justify-center">
          <Loader size="lg" text="Laster kunnskapsbase..." />
        </div>
      ) : (
        <SourceExplorer 
          sources={filteredSources}
          expandedSourceId={expandedSourceId}
          chunks={chunks}
          isLoadingChunks={showChunksLoader}
          loadingChunksText="Laster kildeinnhold..."
          onExpandSource={handleExpandSource}
          onDeleteSource={handleDelete}
        />
      )}
    </div>
  );
};

export const detectSourceType = (source: VoiceflowDocument): SourceType => {
  const name = source.data.name;
  
  if (name.endsWith("- Q&A")) {
    return "qa";
  }
  
  if (name.match(/\.(pdf|txt|docx)$/i)) {
    return "file";
  }
  
  if (name.match(/^https?:\/\//i) || 
      name.match(/\w+\.\w+(\.\w+)?(\/\S*)?$/i)) {
    return "url";
  }
  
  if (source.data.type === "url") {
    return "url";
  } else if (["docx", "text", "pdf"].includes(source.data.type)) {
    return "file";
  } else if (source.data.type === "qa") {
    return "qa";
  }
  
  return "url";
};

export default KnowledgeBase;
