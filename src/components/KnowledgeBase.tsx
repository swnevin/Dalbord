import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Link as LinkIcon, Search, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";

interface VoiceflowDocument {
  data: {
    type: "url" | "docx" | "text" | "pdf";
    name: string;
    url?: string;
    refreshRate?: string;
    canEdit?: boolean;
  };
  tags: string[];
  documentID: string;
  updatedAt: string;
  status: {
    type: "SUCCESS" | "PENDING" | "FAILED";
    data?: any;
  };
}

interface VoiceflowResponse {
  total: number;
  data: VoiceflowDocument[];
}

interface Chunk {
  chunkID: string;
  content: string;
  metadata: Record<string, any>;
}

interface VoiceflowChunksResponse {
  data: VoiceflowDocument;
  chunks: Chunk[];
}

export const KnowledgeBase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<VoiceflowDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<"url" | "file">("url");

  const showLoader = useMinimumLoading(isLoading);
  const showChunksLoader = useMinimumLoading(isLoadingChunks);

  const fetchSources = async () => {
    if (!user?.organization_id) return;

    setIsLoading(true);
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key')
        .eq('id', user.organization_id)
        .single();

      if (orgError || !org.voiceflow_api_key) {
        throw new Error('Kunne ikke hente Voiceflow API nøkkel');
      }

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
          throw new Error('Kunne ikke hente kilder');
        }

        const result: VoiceflowResponse = await response.json();
        allSources = [...allSources, ...result.data];

        hasMore = result.data.length === limit && result.total > allSources.length;
        page++;
      }

      setSources(allSources);
    } catch (error) {
      console.error('Error fetching sources:', error);
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
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key')
        .eq('id', user.organization_id)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Ugyldig filtype",
          description: "Kun PDF, tekst eller DOCX filer er tillatt.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSourceAdd = async () => {
    if (!user?.organization_id) {
      toast({
        title: "Feil",
        description: "Ingen organisasjon funnet.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key')
        .eq('id', user.organization_id)
        .single();

      if (orgError || !org.voiceflow_api_key) {
        throw new Error('Kunne ikke hente Voiceflow API nøkkel');
      }

      let response;

      if (selectedSourceType === "url" && url) {
        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json; charset=utf-8',
            Authorization: org.voiceflow_api_key
          },
          body: JSON.stringify({
            data: {
              type: "url",
              name: url,
              url: url
            }
          })
        };

        response = await fetch('https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000', options);
      } else if (selectedSourceType === "file" && file) {
        const formData = new FormData();
        formData.append('file', file);

        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            Authorization: org.voiceflow_api_key
          },
          body: formData
        };

        response = await fetch('https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000', options);
      } else {
        throw new Error('Ingen gyldig kilde valgt');
      }

      if (!response.ok) {
        throw new Error('Feil ved opplasting til Voiceflow');
      }

      const result = await response.json();
      console.log('Voiceflow response:', result);

      await fetchSources();

      toast({
        title: "Suksess",
        description: "Kilde lagt til i kunnskapsbasen",
      });

      setUrl("");
      setFile(null);
    } catch (error) {
      console.error('Error adding source:', error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke legge til kilde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        .eq('id', user?.organization_id)
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

  const filteredSources = sources.filter(source => 
    source.data.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Kunnskapsbase</h1>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-primary text-white">
              + Legg til kilde
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Legg til ny kilde</SheetTitle>
              <SheetDescription>
                Last opp en fil eller legg til en URL til kunnskapsbasen.
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6">
              <Tabs defaultValue="url" value={selectedSourceType} onValueChange={(v) => setSelectedSourceType(v as "url" | "file")}>
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
                    disabled={!url || isLoading}
                    onClick={handleSourceAdd}
                  >
                    {isLoading ? "Laster opp..." : "Last opp URL"}
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
                      accept=".pdf,.txt,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!file || isLoading}
                    onClick={handleSourceAdd}
                  >
                    {isLoading ? "Laster opp..." : "Last opp fil"}
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
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

      {showLoader ? (
        <div className="mt-8 flex justify-center">
          <Loader size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSources.length > 0 ? (
            filteredSources.map((source) => (
              <div 
                key={source.documentID}
                className="bg-white rounded-lg border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="text-primary h-5 w-5" />
                    <div>
                      <h3 className="font-medium text-gray-900">{source.data.name}</h3>
                      <p className="text-sm text-gray-500">
                        Oppdatert: {new Date(source.updatedAt).toLocaleDateString('no')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExpandSource(source.documentID)}
                      className={cn(
                        "transition-transform",
                        expandedSourceId === source.documentID && "rotate-180"
                      )}
                    >
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Dette vil permanent slette kilden fra kunnskapsbasen. Denne handlingen kan ikke angres.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={async () => {
                              try {
                                await handleDelete(source.documentID);
                              } catch (error) {
                                console.error('Error in delete action:', error);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Slett
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {expandedSourceId === source.documentID && (
                  <div className="border-t px-4 py-3">
                    {showChunksLoader ? (
                      <div className="flex justify-center py-4">
                        <Loader size="md" />
                      </div>
                    ) : chunks.length > 0 ? (
                      <div className="space-y-4">
                        {chunks.map((chunk) => (
                          <div 
                            key={chunk.chunkID}
                            className="p-3 bg-gray-50 rounded-md"
                          >
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{chunk.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-2">Ingen chunks funnet</p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>Ingen kilder funnet</p>
              <p className="text-sm mt-2">Legg til din første kilde ved å klikke på "Legg til kilde" knappen</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
