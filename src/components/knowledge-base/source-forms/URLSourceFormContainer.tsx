import React, { useEffect, useState } from "react";
import { URLSourceForm } from "./URLSourceForm";
import { VoiceflowDocument } from "../types";
import { normalizeUrl } from "../utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface URLSourceFormContainerProps {
  sources: VoiceflowDocument[];
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const URLSourceFormContainer: React.FC<URLSourceFormContainerProps> = ({
  sources,
  onSourceAdded,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [duplicateUrlWarning, setDuplicateUrlWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlTags, setUrlTags] = useState<string[]>([]);
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
    if (url && !url.startsWith("https://")) {
      setUrlError("URL må starte med https://");
    } else {
      setUrlError("");
    }
  }, [url]);

  useEffect(() => {
    if (url.trim()) {
      const normalizedInputUrl = normalizeUrl(url.trim());
      const urlExists = sources.some(
        (source) =>
          source.detectedType === "url" &&
          normalizeUrl(source.data.name) === normalizedInputUrl
      );
      setDuplicateUrlWarning(urlExists);
    } else {
      setDuplicateUrlWarning(false);
    }
  }, [url, sources]);

  const handleSourceAdd = async () => {
    if (!user?.organization_id) {
      toast({
        title: "Feil",
        description: "Ingen organisasjon funnet.",
        variant: "destructive",
      });
      return;
    }

    if (!url) {
      toast({
        title: "Feil",
        description: "URL kan ikke være tom.",
        variant: "destructive",
      });
      return;
    }
    if (!url.startsWith("https://")) {
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

      const formattedUrl = url.startsWith("https://") ? url : `https://${url}`;

      const metadataObj = urlTags.length > 0 ? { tags: urlTags } : undefined;

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json; charset=utf-8",
          Authorization: org.voiceflow_api_key,
        },
        body: JSON.stringify({
          data: {
            type: "url",
            name: formattedUrl,
            url: formattedUrl,
            ...(metadataObj && { metadata: metadataObj }),
          },
        }),
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

      setUrl("");
      setUrlTags([]);
      setUrlError("");
      setDuplicateUrlWarning(false);
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
    <URLSourceForm
      url={url}
      setUrl={setUrl}
      urlError={urlError}
      duplicateUrlWarning={duplicateUrlWarning}
      isLoading={isLoading}
      onSubmit={handleSourceAdd}
      tags={urlTags}
      setTags={setUrlTags}
      isAsk={isAsk}
      required={isAsk}
    />
  );
};
