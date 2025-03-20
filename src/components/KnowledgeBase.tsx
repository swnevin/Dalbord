import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QAPair {
  question: string;
  answer: string;
}

export const KnowledgeBase = () => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [newAnswer, setNewAnswer] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadFile(file);
      setUploadFileName(file.name);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  const { user } = useAuth();

  // This function handles file conversions for the knowledge base
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    setUploadFile(file);
    setUploadFileName(file.name);
  };

  const handleUpload = async () => {
    if (!uploadFile || !user?.organization_id) {
      toast.error("Vennligst velg en fil å laste opp.");
      return;
    }

    setIsUploading(true);

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

      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch(
        `https://api.voiceflow.com/v1/knowledge-base/docs/upload/file`,
        {
          method: 'POST',
          headers: {
            Authorization: org.voiceflow_api_key,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke laste opp filen');
      }

      toast.success("Filen ble lastet opp til kunnskapsbasen");
      setUploadFile(null);
      setUploadFileName("");
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Kunne ikke laste opp filen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddQAPair = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      setQaPairs([...qaPairs, { question: newQuestion, answer: newAnswer }]);
      setNewQuestion("");
      setNewAnswer("");
    }
  };

  const handleRemoveQAPair = (index: number) => {
    const newPairs = [...qaPairs];
    newPairs.splice(index, 1);
    setQaPairs(newPairs);
  };

  const handleCreateQAPairs = async () => {
    if (qaPairs.length === 0 || !user?.organization_id) {
      toast.error("Vennligst legg til minst ett spørsmål og svar-par.");
      return;
    }

    setIsCreating(true);

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

      // Fix: Replace the incorrect File constructor usage
      // Instead of creating a new File here, we'll use a Blob which is the correct approach
      const jsonBlob = new Blob([JSON.stringify({ items: qaPairs })], { type: 'application/json' });

      const formData = new FormData();
      formData.append("file", jsonBlob, "qa_pairs.json");

      const response = await fetch(
        `https://api.voiceflow.com/v1/knowledge-base/docs/upload/table`,
        {
          method: 'POST',
          headers: {
            Authorization: org.voiceflow_api_key,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke opprette Q&A-par');
      }

      toast.success("Q&A-par ble opprettet i kunnskapsbasen");
      setQaPairs([]);
    } catch (error: any) {
      console.error('Error creating Q&A pairs:', error);
      toast.error(error.message || 'Kunne ikke opprette Q&A-par');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4 text-primary">Kunnskapsbase</h1>

      {/* File Upload Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Last opp fil</h2>
        <div
          {...getRootProps()}
          className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
        >
          <input {...getInputProps()} onChange={handleFileChange} />
          <p className="text-gray-500">
            Dra og slipp filer her, eller klikk for å velge filer
          </p>
          {uploadFileName && (
            <p className="text-gray-700 mt-2">Valgt fil: {uploadFileName}</p>
          )}
        </div>
        <Button
          onClick={handleUpload}
          disabled={!uploadFile || isUploading}
          className="mt-2 bg-primary text-white hover:bg-primary/90"
        >
          {isUploading ? "Laster opp..." : "Last opp"}
        </Button>
      </div>

      {/* Create Q&A Pairs Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Opprett Q&A-par</h2>
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              placeholder="Spørsmål"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="flex-1 border-primary/20 focus:border-primary"
            />
            <Textarea
              placeholder="Svar"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="flex-1 border-primary/20 focus:border-primary"
            />
          </div>
          <Button onClick={handleAddQAPair} className="bg-primary text-white hover:bg-primary/90">
            Legg til Q&A-par
          </Button>
        </div>

        {/* Display Q&A Pairs */}
        {qaPairs.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Q&A-par:</h3>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {qaPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <p className="font-medium">{pair.question}</p>
                      <p className="text-gray-700">{pair.answer}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveQAPair(index)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      Fjern
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Button
          onClick={handleCreateQAPairs}
          disabled={qaPairs.length === 0 || isCreating}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {isCreating ? "Oppretter..." : "Opprett Q&A-par i kunnskapsbasen"}
        </Button>
      </div>
    </div>
  );
};
