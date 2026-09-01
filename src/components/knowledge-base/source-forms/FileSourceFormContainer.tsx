
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
  const [isAsk, setIsAsk] = useState(false);

  useEffect(() => {
    if (user?.organization_id) {
      fetchOrganizationSettings();
    }
  }, [user?.organization_id]);

  const fetchOrganizationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("isAsk")
        .eq("id", user?.organization_id)
        .single();

      if (error) throw error;
      setIsAsk(!!data?.isAsk);
    } catch (error) {
      console.error("Error fetching organization settings:", error);
    }
  };

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
      // Read file as base64 for JSON transport to edge function
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(
          null,
          Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]
        );
      }
      const base64 = btoa(binary);

      const metadataObj = { inner: { tags: fileTags } };

      const { error } = await supabase.functions.invoke("voiceflow-kb", {
        body: {
          action: "upload_file",
          file: { name: file.name, type: file.type, base64 },
          metadata: metadataObj,
        },
      });

      if (error) {
        throw new Error(error.message || "Feil ved opplasting til Voiceflow");
      }

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
      isAsk={isAsk}
      required={isAsk}
    />
  );
};
