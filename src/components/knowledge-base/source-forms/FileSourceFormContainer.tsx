
import React, { useEffect, useState } from "react";
import { FileSourceForm } from "./FileSourceForm";
import { VoiceflowDocument } from "../types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FileSourceFormContainerProps {
  sources: VoiceflowDocument[];
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const FileSourceFormContainer: React.FC<FileSourceFormContainerProps> = ({
  sources,
  onSourceAdded,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [duplicateFileWarning, setDuplicateFileWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileTags, setFileTags] = useState<string[]>([]);

  useEffect(() => {
    if (file && fileTitle.trim()) {
      const titleExists = sources.some(
        (source) =>
          source.detectedType === "file" &&
          source.data.name === fileTitle.trim()
      );
      setDuplicateFileWarning(titleExists);
    } else {
      setDuplicateFileWarning(false);
    }
  }, [fileTitle, file, sources]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setFile(file);
      setFileTitle(file.name);
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
        description:
          "En fil med samme navn finnes allerede i kunnskapsbasen.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("voiceflow_api_key")
        .eq("id", user.organization_id)
        .single();

      if (orgError || !org.voiceflow_api_key) {
        throw new Error("Kunne ikke hente Voiceflow API nøkkel");
      }

      const formData = new FormData();
      formData.append("file", file);

      const metadataObj = {
        inner: {
          tags: fileTags,
        },
      };

      formData.append("metadata", JSON.stringify(metadataObj));

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: org.voiceflow_api_key,
        },
        body: formData,
      };

      const response = await fetch(
        "https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000",
        options
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Feil ved opplasting til Voiceflow: ${response.status} ${response.statusText}`
        );
      }

      await response.json();
      onSourceAdded();
      toast({
        title: "Suksess",
        description: "Kilde lagt til i kunnskapsbasen",
      });

      setFile(null);
      setFileTitle("");
      setFileTags([]);
      setDuplicateFileWarning(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Feil",
        description:
          error instanceof Error
            ? error.message
            : "Kunne ikke legge til kilde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FileSourceForm
      file={file}
      fileTitle={fileTitle}
      setFileTitle={setFileTitle}
      duplicateFileWarning={duplicateFileWarning}
      isLoading={isLoading}
      onFileChange={handleFileChange}
      onSubmit={handleSourceAdd}
      tags={fileTags}
      setTags={setFileTags}
    />
  );
};
