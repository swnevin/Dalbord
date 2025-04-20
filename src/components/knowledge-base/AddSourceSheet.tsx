import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceflowDocument, QAPair } from "./types";
import { normalizeUrl, ensureQATitleSuffix, createTextFile, createQAPayload } from "./utils";
import { URLSourceForm } from "./source-forms/URLSourceForm";
import { FileSourceForm } from "./source-forms/FileSourceForm";
import { TextSourceForm } from "./source-forms/TextSourceForm";
import { QASourceForm } from "./source-forms/QASourceForm";
import { TagInput } from "./source-forms/TagInput";

interface AddSourceSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sources: VoiceflowDocument[];
  onSourceAdded: () => void;
}

export const AddSourceSheet: React.FC<AddSourceSheetProps> = ({
  isOpen, 
  onOpenChange, 
  sources,
  onSourceAdded
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSourceType, setSelectedSourceType] = useState<"url" | "file" | "text" | "qa">("url");
  const [isLoading, setIsLoading] = useState(false);
  
  const [url, setUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlError, setUrlError] = useState("");
  const [duplicateUrlWarning, setDuplicateUrlWarning] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [duplicateFileWarning, setDuplicateFileWarning] = useState(false);
  
  const [rawText, setRawText] = useState("");
  const [textFileName, setTextFileName] = useState("custom-text.txt");
  const [textFileNameError, setTextFileNameError] = useState("");
  
  const [qaTitle, setQaTitle] = useState("");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([
    { question: "", answer: "", id: crypto.randomUUID() }
  ]);
  const [showQABulkUpload, setShowQABulkUpload] = useState(false);
  const [bulkQAText, setBulkQAText] = useState("");
  const [duplicateQATitleWarning, setDuplicateQATitleWarning] = useState(false);

  const [tags, setTags] = useState<string[]>([]);

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
              url: formattedUrl,
              metadata: tags.length ? { tags } : undefined
            }
          })
        };

        response = await fetch('https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000', options);
      } else if (selectedSourceType === "file" && file) {
        const formData = new FormData();
        formData.append('file', file);
        if (tags.length) {
          formData.append('metadata', JSON.stringify({ tags }));
        }
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
        const textFile = createTextFile(
          rawText, 
          textFileName.endsWith('.txt') ? textFileName : `${textFileName}.txt`
        );
        
        const formData = new FormData();
        formData.append('file', textFile);
        if (tags.length) {
          formData.append('metadata', JSON.stringify({ tags }));
        }
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
        const qaPayload = createQAPayload(qaTitle, qaPairs, tags.length > 0 ? tags : undefined);
        const shouldOverwrite = duplicateQATitleWarning;

        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: org.voiceflow_api_key
          },
          body: JSON.stringify(qaPayload)
        };

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

      onSourceAdded();

      toast({
        title: "Suksess",
        description: "Kilde lagt til i kunnskapsbasen",
      });

      resetForm();
      onOpenChange(false);
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

  const resetForm = () => {
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
    setTags([]);
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      setFile(file);
      setFileTitle(file.name);
    }
  };

  const isQAPairValid = (pair: QAPair) => !!pair.question.trim() && !!pair.answer.trim();
  const areAllQAPairsValid = qaPairs.every(isQAPairValid);
  const isQATitleValid = !!qaTitle.trim();
  const isQAFormValid = isQATitleValid && areAllQAPairsValid;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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

          <div className="mb-6">
            <TagInput tags={tags} setTags={setTags} />
          </div>
          
          {selectedSourceType === "url" && (
            <URLSourceForm
              url={url}
              setUrl={setUrl}
              urlError={urlError}
              duplicateUrlWarning={duplicateUrlWarning}
              isLoading={isLoading}
              onSubmit={handleSourceAdd}
            />
          )}
          
          {selectedSourceType === "file" && (
            <FileSourceForm
              file={file}
              fileTitle={fileTitle}
              setFileTitle={setFileTitle}
              duplicateFileWarning={duplicateFileWarning}
              isLoading={isLoading}
              onFileChange={handleFileChange}
              onSubmit={handleSourceAdd}
            />
          )}
          
          {selectedSourceType === "text" && (
            <TextSourceForm
              textFileName={textFileName}
              setTextFileName={setTextFileName}
              textFileNameError={textFileNameError}
              rawText={rawText}
              setRawText={setRawText}
              isLoading={isLoading}
              onSubmit={handleSourceAdd}
            />
          )}
          
          {selectedSourceType === "qa" && (
            <QASourceForm
              qaTitle={qaTitle}
              setQaTitle={setQaTitle}
              qaPairs={qaPairs}
              duplicateQATitleWarning={duplicateQATitleWarning}
              showQABulkUpload={showQABulkUpload}
              bulkQAText={bulkQAText}
              setBulkQAText={setBulkQAText}
              isLoading={isLoading}
              isQAFormValid={isQAFormValid}
              onAddQAPair={addQAPair}
              onUpdateQAPair={updateQAPair}
              onRemoveQAPair={removeQAPair}
              onToggleBulkUpload={() => setShowQABulkUpload(!showQABulkUpload)}
              onProcessBulk={processBulkQAText}
              onSubmit={handleSourceAdd}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
