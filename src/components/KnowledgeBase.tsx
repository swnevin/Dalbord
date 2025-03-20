import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Link as LinkIcon, Search, Trash2, Upload, FileText, MessageCircleQuestion, Plus, File, ExternalLink, AlertCircle } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qaPair, setQaPair] = useState({ question: "", answer: "", id: crypto.randomUUID() });
  
  const [selectedSourceType, setSelectedSourceType] = useState<"url" | "file" | "text" | "qa">("url");
  
  const [qaTitle, setQaTitle] = useState("");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([
    { question: "", answer: "", id: crypto.randomUUID() }
  ]);
  
  const [showQABulkUpload, setShowQABulkUpload] = useState(false);
  const [bulkQAText, setBulkQAText] = useState("");
  
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType>("all");
  const [duplicateQATitleWarning, setDuplicateQATitleWarning] = useState(false);
  
  const [urlTitle, setUrlTitle] = useState("");
  const [duplicateUrlWarning, setDuplicateUrlWarning] = useState(false);
  const [fileTitle, setFileTitle] = useState("");
  const [duplicateFileWarning, setDuplicateFileWarning] = useState(false);

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

  const normalizeUrl = (url: string): string => {
    let normalizedUrl = url;
    
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    
    return normalizedUrl.toLowerCase();
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

  useEffect(() => {
    if (selectedSourceType === 'url' && url.trim()) {
      const normalizedInputUrl = normalizeUrl(url.trim());
      
      const urlExists = sources.some(source => 
        source.detectedType === 'url' && normalizeUrl(source.data.name) === normalizedInputUrl
      );
      
      setDuplicateUrlWarning(urlExists);
    } else {
      setDuplicateUrlWarning(false);
    }
  }, [url, sources, selectedSourceType]);

  useEffect(() => {
    if (selectedSourceType === 'file' && file && fileTitle.trim()) {
      const titleExists = sources.some(source => 
        source.detectedType === 'file' && source.data.name === fileTitle.trim()
      );
      setDuplicateFileWarning(titleExists);
    } else {
      setDuplicateFileWarning(false);
    }
  }, [fileTitle, file, sources, selectedSourceType]);

  useEffect(() => {
    fetchSources();
  }, [user?.organization_id]);

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
      setFileTitle(selectedFile.name);
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
      
      if (duplicateUrlWarning) {
        toast({
          title: "Feil",
          description: "Denne URL-en finnes allerede i kunnskapsbasen.",
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
    } else if (selectedSourceType === "file") {
      if (!file) {
        toast({
          title: "Feil",
          description: "Ingen fil valgt.",
          variant: "destructive",
        });
        return;
      }
      
      if (duplicateFileWarning) {
        toast({
          title: "Feil",
          description: "En fil med samme navn finnes allerede i kunnskapsbasen.",
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
      setUrlTitle("");
      setFile(null);
      setFileTitle("");
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

  const saveQAPair = async () => {
    if (!user?.organization_id) {
      toast({
        title: "Feil",
        description: "Ingen organisasjon funnet. Kunne ikke lagre Q&A.",
        variant: "destructive",
      });
      return;
    }

    if (!qaTitle.trim() || !qaPair.question.trim() || !qaPair.answer.trim()) {
      toast({
        title: "Feil",
        description: "Alle felt må fylles ut",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', user.organization_id)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        throw new Error('Mangler Voiceflow-legitimasjon');
      }

      let formattedTitle = qaTitle.trim();
      if (!formattedTitle.endsWith("- Q&A")) {
        formattedTitle = `${formattedTitle} - Q&A`;
      }

      const response = await fetch(
        `https://api.voiceflow.com/v1/knowledge-base/docs`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': org.voiceflow_api_key
          }
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke sjekke for eksisterende Q&A');
      }

      const result = await response.json();
      const existingQA = result.data.find(
        (doc: any) => doc.data.name === formattedTitle
      );

      const qaItems = [
        {
          question: qaPair.question.trim(),
          answer: qaPair.answer.trim()
        }
      ];

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

      const endpoint = `https://api.voiceflow.com/v1/knowledge-base/docs/upload/table?overwrite=${existingQA ? 'true' : 'false'}`;
      
      const saveResponse = await fetch(endpoint, options);

      if (!saveResponse.ok) {
        throw new Error('Kunne ikke lagre Q&A');
      }

      toast({
        title: "Suksess",
        description: "Q&A ble lagret til kunnskapsbasen"
      });
      setIsQASheetOpen(false);
    } catch (error) {
      console.error('Error saving Q&A:', error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke lagre Q&A",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
                      className={urlError || duplicateUrlWarning ? "border-red-500" : ""}
                    />
                    {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
                    {duplicateUrlWarning && (
                      <div className="flex gap-2 items-center mt-1 text-yellow-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Denne URL-en finnes allerede i kunnskapsbasen</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!url || !!urlError || duplicateUrlWarning || isLoading}
                    onClick={handleSourceAdd}
                  >
                    {isLoading ? "Laster opp..." : "Last opp URL"}
                  </Button>
                </div>
              ) : selectedSourceType === "file" ? (
                <div className="space-y-4">
                  <div>
                    {file && (
                      <>
                        <Label htmlFor="file-title" className="block mb-2">Filnavn (valgfritt)</Label>
                        <Input
                          id="file-title"
                          placeholder="Angi et navn for filen (valgfritt)"
                          value={fileTitle}
                          onChange={(e) => setFileTitle(e.target.value)}
                          className={duplicateFileWarning ? "border-red-500 mb-1" : "mb-2"}
                        />
                        {duplicateFileWarning && (
                          <div className="flex gap-2 items-center mt-1 mb-2 text-yellow-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>En fil med dette navnet finnes allerede i kunnskapsbasen</span>
                          </div>
                        )}
                      </>
                    )}
                  
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
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!file || duplicateFileWarning || isLoading}
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
                    disabled={!rawText || !!textFileNameError || isLoading
