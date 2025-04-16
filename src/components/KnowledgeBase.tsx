
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Search, Trash2, Upload, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
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
  const { preview } = usePreview();
  const { toast } = useToast();
  const [sources, setSources] = useState<VoiceflowDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType>("all");

  const organizationId = preview.isPreviewMode ? preview.previewOrgId : user?.organization_id;

  const showLoader = useMinimumLoading(isLoading);
  const showChunksLoader = useMinimumLoading(isLoadingChunks);

  useEffect(() => {
    console.log("[KnowledgeBase] Using organization ID:", organizationId);
    console.log("[KnowledgeBase] Preview mode:", preview.isPreviewMode);
    console.log("[KnowledgeBase] Preview org ID:", preview.previewOrgId);
  }, [organizationId, preview.isPreviewMode, preview.previewOrgId]);

  const fetchSources = async () => {
    if (!organizationId) {
      console.log("[KnowledgeBase] No organization ID available, skipping fetch");
      return;
    }

    setIsLoading(true);
    try {
      console.log("[KnowledgeBase] Fetching sources for organization:", organizationId);
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        console.error("[KnowledgeBase] Error fetching Voiceflow API key:", orgError);
        throw new Error('Kunne ikke hente Voiceflow API nøkkel');
      }

      if (!org?.voiceflow_api_key) {
        console.error("[KnowledgeBase] No Voiceflow API key found for organization:", organizationId);
        throw new Error('Ingen Voiceflow API nøkkel funnet for denne organisasjonen');
      }

      console.log("[KnowledgeBase] Got Voiceflow API key, fetching sources");

      const limit = 100;
      let page = 1;
      let allSources: VoiceflowDocument[] = [];
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `https://api.voiceflow.com/v1/knowledge-base/docs?limit=${limit}&page=${page}`,
          {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': org.voiceflow_api_key
            }
          }
        );

        if (!response.ok) {
          console.error("[KnowledgeBase] Voiceflow API error:", response.status);
          throw new Error('Kunne ikke hente kilder');
        }

        const result: VoiceflowResponse = await response.json();
        
        const processedSources = result.data.map(source => ({
          ...source,
          detectedType: detectSourceType(source)
        }));
        
        allSources = [...allSources, ...processedSources];

        hasMore = result.data.length === limit && result.total > allSources.length;
        page++;
      }

      console.log(`[KnowledgeBase] Fetched ${allSources.length} sources`);
      setSources(allSources);
    } catch (error) {
      console.error('[KnowledgeBase] Error fetching sources:', error);
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
  }, [organizationId]);

  const handleExpandSource = async (documentId: string) => {
    if (expandedSourceId === documentId) {
      setExpandedSourceId(null);
      setChunks([]);
      return;
    }

    setIsLoadingChunks(true);
    setExpandedSourceId(documentId);

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key')
        .eq('id', organizationId)
        .single();

      if (orgError || !org.voiceflow_api_key) {
        throw new Error('Kunne ikke hente Voiceflow API nøkkel');
      }

      const response = await fetch(
        `https://api.voiceflow.com/v1/knowledge-base/docs/${documentId}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': org.voiceflow_api_key
          }
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke hente chunks');
      }

      const result: VoiceflowChunksResponse = await response.json();
      setChunks(result.chunks);
    } catch (error) {
      console.error('Error fetching chunks:', error);
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
    if (!organizationId) {
      toast({
        title: "Feil",
        description: "Ingen organisasjon funnet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key')
        .eq('id', organizationId)
        .single();

      if (orgError || !org.voiceflow_api_key) {
        throw new Error('Kunne ikke hente Voiceflow API nøkkel');
      }

      const response = await fetch(
        `https://api.voiceflow.com/v1/knowledge-base/docs/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': org.voiceflow_api_key
          }
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke slette kilden');
      }

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
