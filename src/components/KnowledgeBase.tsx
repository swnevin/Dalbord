import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Link as LinkIcon, Search, Trash2, Upload, FileText, MessageCircleQuestion, Plus, File, ExternalLink } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";
import { Label } from "@/components/ui/label";

type SourceType = "url" | "file" | "qa" | "all";

interface VoiceflowDocument {
  data: {
    type: "url" | "docx" | "text" | "pdf" | "qa";
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
  detectedType?: SourceType;
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

interface QAPair {
  question: string;
  answer: string;
  id: string;
}

export const KnowledgeBase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<VoiceflowDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [textFileName, setTextFileName] = useState("custom-text.txt");
  const [textFileNameError, setTextFileNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [selectedSourceType, setSelectedSourceType] = useState<"url" | "file" | "text" | "qa">("url");
  
  const [qaTitle, setQaTitle] = useState("");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([
    { question: "", answer: "", id: crypto.randomUUID() }
  ]);
  
  const [showQABulkUpload, setShowQABulkUpload] = useState(false);
  const [bulkQAText, setBulkQAText] = useState("");
  
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType>("all");
  const [duplicateQATitleWarning, setDuplicateQATitleWarning] = useState(false);

  const showLoader = useMinimumLoading(isLoading);
  const showChunksLoader = useMinimumLoading(isLoadingChunks);

  const detectSourceType = (source: VoiceflowDocument): SourceType => {
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

  useEffect(() => {
    if (url && !url.startsWith('https://')) {
      setUrlError('URL må starte med https://');
    } else {
      setUrlError('');
    }
  }, [url]);

  useEffect(() => {
    if (textFileName && !textFileName.endsWith('.txt')) {
      setTextFileNameError('Filnavnet må slutte med .txt');
    } else {
      setTextFileNameError('');
    }
  }, [textFileName]);

  useEffect(() => {
    if (selectedSourceType === 'qa' && qaTitle.trim()) {
      const formattedTitle = ensureQATitleSuffix(qaTitle.trim());
      const titleExists = sources.some(source => 
        source.detectedType === 'qa' && source.data.name === formattedTitle
      );
      setDuplicateQATitleWarning(titleExists);
    } else {
      setDuplicateQATitleWarning(false);
    }
  }, [qaTitle, sources, selectedSourceType]);

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
        
        const processedSources = result.data.map(source => ({
          ...source,
          detectedType: detectSourceType(source)
        }));
        
        allSources = [...allSources, ...processedSources];

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

  const addQAPair = () => {
    setQaPairs([...qaPairs, { question: "", answer: "", id: crypto.randomUUID() }]);
  };

  const updateQAPair = (id: string, field: "question" | "answer", value: string) => {
    setQaPairs(qaPairs.map(pair => 
      pair.id === id ? { ...pair, [field]: value } : pair
    ));
  };

  const removeQAPair = (id: string) => {
    if (qaPairs.length > 1) {
      setQaPairs(qaPairs.filter(pair => pair.id !== id));
    }
  };
  
  const processBulkQAText = () => {
    if (!bulkQAText.trim()) {
      toast({
        title: "Feil",
        description: "Teksten kan ikke være tom.",
        variant: "destructive",
      });
      return;
    }
    
    const lines = bulkQAText.split('\n').filter(line => line.trim());
    const newQAPairs: QAPair[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // New format: "question: Q; answer: A"
      const match = line.match(/question:(.*?);[\s]*answer:(.*)/i);
      
      if (match) {
        const question = match[1].trim();
        const answer = match[2].trim();
        
        if (question && answer) {
          newQAPairs.push({
            question,
            answer,
            id: crypto.randomUUID()
          });
        }
      }
    }
    
    if (newQAPairs.length === 0) {
      toast({
        title: "Feil",
        description: "Kunne ikke finne noen gyldige spørsmål og svar i teksten. Bruk formatet 'question: [spørsmål]; answer: [svar]'.",
        variant: "destructive",
      });
      return;
    }
    
    setQaPairs([...qaPairs, ...newQAPairs]);
    setBulkQAText("");
    setShowQABulkUpload(false);
    
    toast({
      title: "Suksess",
      description: `${newQAPairs.length} spørsmål og svar lagt til.`,
    });
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

    if (selectedSourceType === "url") {
      if (!url) {
        toast({
          title: "Feil",
          description: "URL kan ikke være tom.",
          variant: "destructive",
        });
        return;
      }
      
      if (!url.startsWith('https://')) {
        toast({
          title: "Feil",
          description: "URL må starte med https://",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedSourceType === "text") {
      if (!rawText) {
        toast({
          title: "Feil",
          description: "Tekst kan ikke være tom.",
          variant: "destructive",
        });
        return;
      }
      
      if (!textFileName.endsWith('.txt')) {
        toast({
          title: "Feil",
          description: "Filnavnet må slutte med .txt",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedSourceType === "qa") {
      if (!qaTitle.trim()) {
        toast({
          title: "Feil",
          description: "Tittel kan ikke være tom.",
          variant: "destructive",
        });
        return;
      }
      
      const hasEmptyFields = qaPairs.some(pair => !pair.question.trim() || !pair.answer.trim());
      if (hasEmptyFields) {
        toast({
          title: "Feil",
          description: "Alle spørsmål og svar må fylles ut.",
          variant: "destructive",
        });
        return;
      }
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
        const formattedUrl = url.startsWith('https://') ? url : `https://${url}`;
        
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
              name: formattedUrl,
              url: formattedUrl
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
      } else if (selectedSourceType === "text" && rawText) {
        const textBlob = new Blob([rawText], { type: 'text/plain' });
        const fileName = textFileName.endsWith('.txt') ? textFileName : `${textFileName}.txt`;
        const textFile = new File([textBlob], fileName);
        
        const formData = new FormData();
        formData.append('file', textFile);

        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            Authorization: org.voiceflow_api_key
          },
          body: formData
        };

        response = await fetch('https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000', options);
      } else if (selectedSourceType === "qa" && qaTitle) {
        const formattedTitle = ensureQATitleSuffix(qaTitle.trim());
        
        const qaItems = qaPairs.map(pair => ({
          question: pair.question.trim(),
          answer: pair.answer.trim()
        }));

        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: org.voiceflow_api_key
          },
          body: JSON.stringify({
            data: {
              schema: { searchableFields: ['question', 'answer'] },
              name: formattedTitle,
              items: qaItems
            }
          })
        };

        const shouldOverwrite = duplicateQATitleWarning;
        const endpoint = `https://api.voiceflow.com/v1/knowledge-base/docs/upload/table?overwrite=${shouldOverwrite}`;
        
        response = await fetch(endpoint, options);
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
      setRawText("");
      setTextFileName("custom-text.txt");
      setQaTitle("");
      setQaPairs([{ question: "", answer: "", id: crypto.randomUUID() }]);
      setUrlError("");
      setTextFileNameError("");
      setIsSheetOpen(false);
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

  const filteredSources = sources.filter(source => {
    const matchesSearch = source.data.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      sourceTypeFilter === "all" || 
      (source.detectedType === sourceTypeFilter);
    
    return matchesSearch && matchesType;
  });

  const isQAPairValid = (pair: QAPair) => !!pair.question.trim() && !!pair.answer.trim();
  const areAllQAPairsValid = qaPairs.every(isQAPairValid);
  const isQATitleValid = !!qaTitle.trim();
  const isQAFormValid = isQATitleValid && areAllQAPairsValid;

  const handleQATitleChange = (value: string) => {
    setQaTitle(value);
  };

  const ensureQATitleSuffix = (title: string): string => {
    if (!title.endsWith("- Q&A")) {
      return `${title} - Q&A`;
    }
    return title;
  };

  const getSourceIcon = (source: VoiceflowDocument) => {
    const type = source.detectedType;
    
    switch (type) {
      case "url":
        return <ExternalLink className="text-primary h-5 w-5" />;
      case "file":
        return <FileText className="text-primary h-5 w-5" />;
      case "qa":
        return <MessageCircleQuestion className="text-primary h-5 w-5" />;
      default:
        return <LinkIcon className="text-primary h-5 w-5" />;
    }
  };

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
          <SheetContent className="overflow-y-auto max-h-screen pb-20">
            <SheetHeader>
              <SheetTitle>Legg til ny kilde</SheetTitle>
              <SheetDescription>
                Last opp en fil, legg til en URL eller skriv inn tekst til kunnskapsbasen.
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6">
              <div className="mb-4">
                <Select 
                  value={selectedSourceType} 
                  onValueChange={(value) => setSelectedSourceType(value as "url" | "file" | "text" | "qa")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Velg kildetype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="file">Filopplasting</SelectItem>
                    <SelectItem value="text">Rå tekst</SelectItem>
                    <SelectItem value="qa">Spørsmål & Svar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSourceType === "url" ? (
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Lim inn URL (https://...)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className={urlError ? "border-red-500" : ""}
                    />
                    {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!url || !!urlError || isLoading}
                    onClick={handleSourceAdd}
                  >
                    {isLoading ? "Laster opp..." : "Last opp URL"}
                  </Button>
                </div>
              ) : selectedSourceType === "file" ? (
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
              ) : selectedSourceType === "text" ? (
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Filnavn (f.eks. min-tekst.txt)"
                      value={textFileName}
                      onChange={(e) => setTextFileName(e.target.value)}
                      className={cn("mb-2", textFileNameError ? "border-red-500" : "")}
                    />
                    {textFileNameError && <p className="text-red-500 text-sm mb-2">{textFileNameError}</p>}
                  </div>
                  <Textarea
                    placeholder="Skriv eller lim inn tekst her"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="min-h-32 resize-y"
                  />
                  <Button 
                    className="w-full" 
                    disabled={!rawText || !!textFileNameError || isLoading}
                    onClick={handleSourceAdd}
                  >
                    {isLoading ? "Laster opp..." : "Last opp tekst"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qa-title">Tittel</Label>
                    <Input
                      id="qa-title"
                      placeholder="Tittel på Q&A kilden (vil få '- Q&A' lagt til)"
                      value={qaTitle}
                      onChange={(e) => handleQATitleChange(e.target.value)}
                      className={duplicateQATitleWarning ? "border-yellow-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      "- Q&A" vil automatisk legges til på slutten av tittelen for å identifisere kilden som en Q&A.
                    </p>
                    {duplicateQATitleWarning && (
                      <p className="text-yellow-600 text-xs mt-1">
                        NB! Det finnes allerede en FAQ-kilde med dette navnet. Hvis du fortsetter vil denne kilden bli overskrevet.
                      </p>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto max-h-[400px] pr-2">
                    {qaPairs.map((pair, index) => (
                      <div key={pair.id} className="space-y-3 p-4 border rounded-lg bg-gray-50 mb-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Spørsmål og svar #{index + 1}</h4>
                          {qaPairs.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeQAPair(pair.id)}
                              className="h-8 w-8 text-gray-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`question-${pair.id}`}>Spørsmål:</Label>
                          <Input
                            id={`question-${pair.id}`}
                            placeholder="Skriv inn spørsmål"
                            value={pair.question}
                            onChange={(e) => updateQAPair(pair.id, "question", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`answer-${pair.id}`}>Svar:</Label>
                          <Textarea
                            id={`answer-${pair.id}`}
                            placeholder="Skriv inn svar"
                            value={pair.answer}
                            onChange={(e) => updateQAPair(pair.id, "answer", e.target.value)}
                            className="min-h-20 resize-y"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center gap-2" 
                      onClick={addQAPair}
                    >
                      <Plus className="h-4 w-4" /> Legg til spørsmål og svar
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={() => setShowQABulkUpload(!showQABulkUpload)}
                    >
                      <Upload className="h-4 w-4" /> Last opp Q&A set
                    </Button>
                  </div>
                  
                  {showQABulkUpload && (
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div className="space-y-2">
                        <Label htmlFor="bulk-qa-text">
                          Legg inn Q&A i format:
                          <code className="ml-2 p-1 bg-gray-200 rounded text-xs">
                            question: Ditt spørsmål her; answer: Ditt svar her
                          </code>
                        </Label>
                        <Textarea
                          id="bulk-qa-text"
                          placeholder="question: Hvordan endrer jeg språk på meldinger?; answer: Språket på e-poster kan ikke endres, de sendes kun på engelsk."
                          value={bulkQAText}
                          onChange={(e) => setBulkQAText(e.target.value)}
                          className="min-h-32 resize-y font-mono text-sm"
                        />
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={processBulkQAText}
                        disabled={!bulkQAText.trim()}
                      >
                        Legg til
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-primary text-white" 
                    disabled={!isQAFormValid || isLoading}
                    onClick={handleSourceAdd}
                  >
                    {isLoading ? "Lagrer..." : "Lagre Q&A"}
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
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
        
        <div className="w-40">
          <Select 
            value={sourceTypeFilter} 
            onValueChange={(value) => setSourceTypeFilter(value as SourceType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Alle typer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="file">Fil</SelectItem>
              <SelectItem value="qa">Spørsmål & Svar</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                    {getSourceIcon(source)}
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
