import React, { useEffect, useState } from "react";
import { QASourceForm } from "./QASourceForm";
import { VoiceflowDocument, QAPair } from "../types";
import { ensureQATitleSuffix } from "../utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QASourceFormContainerProps {
  sources: VoiceflowDocument[];
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const QASourceFormContainer: React.FC<QASourceFormContainerProps> = ({
  sources,
  onSourceAdded,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qaTitle, setQaTitle] = useState("");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([
    { question: "", answer: "", id: crypto.randomUUID(), tags: [] }
  ]);
  const [showQABulkUpload, setShowQABulkUpload] = useState(false);
  const [bulkQAText, setBulkQAText] = useState("");
  const [duplicateQATitleWarning, setDuplicateQATitleWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAsk, setIsAsk] = useState(false);

  useEffect(() => {
    const askMode = localStorage.getItem("askModeQAKB") === "true";
    setIsAsk(askMode);
    
    if (user?.organization_id) {
      supabase
        .from("organizations")
        .select("isAsk")
        .eq("id", user.organization_id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            const orgIsAsk = !!data.isAsk;
            setIsAsk(orgIsAsk);
            localStorage.setItem("askModeQAKB", orgIsAsk.toString());
          }
        });
    }
  }, [user?.organization_id]);

  useEffect(() => {
    if (qaTitle.trim()) {
      const formattedTitle = ensureQATitleSuffix(qaTitle.trim());
      const titleExists = sources.some(
        (source) =>
          source.detectedType === "qa" && source.data.name === formattedTitle
      );
      setDuplicateQATitleWarning(titleExists);
    } else {
      setDuplicateQATitleWarning(false);
    }
  }, [qaTitle, sources]);

  const addQAPair = () => {
    setQaPairs([
      ...qaPairs,
      { question: "", answer: "", id: crypto.randomUUID(), tags: [] }
    ]);
  };

  const updateQAPair = (
    id: string,
    field: "question" | "answer",
    value: string
  ) => {
    setQaPairs(
      qaPairs.map((pair) =>
        pair.id === id ? { ...pair, [field]: value } : pair
      )
    );
  };

  const updateQAPairTags = (id: string, tags: string[]) => {
    setQaPairs(
      qaPairs.map((pair) => (pair.id === id ? { ...pair, tags } : pair))
    );
  };

  const removeQAPair = (id: string) => {
    if (qaPairs.length > 1) {
      setQaPairs(qaPairs.filter((pair) => pair.id !== id));
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

    const lines = bulkQAText.split("\n").filter((line) => line.trim());
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
            id: crypto.randomUUID(),
            tags: [],
          });
        }
      }
    }

    if (newQAPairs.length === 0) {
      toast({
        title: "Feil",
        description:
          "Kunne ikke finne noen gyldige spørsmål og svar i teksten. Bruk formatet 'question: [spørsmål]; answer: [svar]'.",
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

  const isQAPairValid = (pair: QAPair) =>
    !!pair.question.trim() && !!pair.answer.trim();
  const areAllQAPairsValid = qaPairs.every(isQAPairValid);
  const isQATitleValid = !!qaTitle.trim();
  const isQAFormValid = isQATitleValid && areAllQAPairsValid;

  const handleSourceAdd = async () => {
    if (!user?.organization_id) {
      toast({
        title: "Feil",
        description: "Ingen organisasjon funnet.",
        variant: "destructive",
      });
      return;
    }
    if (!qaTitle.trim()) {
      toast({
        title: "Feil",
        description: "Tittel kan ikke være tom.",
        variant: "destructive",
      });
      return;
    }
    const hasEmptyFields = qaPairs.some(
      (pair) => !pair.question.trim() || !pair.answer.trim()
    );
    if (hasEmptyFields) {
      toast({
        title: "Feil",
        description: "Alle spørsmål og svar må fylles ut.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const allTags = [
        ...new Set(qaPairs.flatMap((pair) => pair.tags)),
      ];
      const payload = {
        schema: {
          searchableFields: ["question", "answer"],
          ...(allTags.length > 0 && { metadataFields: ["tag"] }),
        },
        name: ensureQATitleSuffix(qaTitle.trim()),
        items: qaPairs.map((pair) => ({
          question: pair.question.trim(),
          answer: pair.answer.trim(),
          ...(pair.tags.length > 0 ? { tag: pair.tags.join(", ") } : {}),
        })),
      };

      const { error } = await supabase.functions.invoke("voiceflow-kb", {
        body: {
          action: "upload_qa",
          overwrite: duplicateQATitleWarning,
          payload,
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

      setQaTitle("");
      setQaPairs([
        { question: "", answer: "", id: crypto.randomUUID(), tags: [] },
      ]);
      setBulkQAText("");
      setShowQABulkUpload(false);
      setDuplicateQATitleWarning(false);
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
      isAsk={isAsk}
      onAddQAPair={addQAPair}
      onUpdateQAPair={updateQAPair}
      onRemoveQAPair={removeQAPair}
      onUpdateQAPairTags={updateQAPairTags}
      onToggleBulkUpload={() => setShowQABulkUpload(!showQABulkUpload)}
      onProcessBulk={processBulkQAText}
      onSubmit={handleSourceAdd}
    />
  );
};
