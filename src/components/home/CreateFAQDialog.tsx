import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureQATitleSuffix } from "@/components/knowledge-base/utils";

interface CreateFAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  answer: string;
  onCreated: () => void;
}

export const CreateFAQDialog = ({
  open,
  onOpenChange,
  question,
  answer,
  onCreated,
}: CreateFAQDialogProps) => {
  const { user } = useAuth();
  const [faqQuestion, setFaqQuestion] = useState(question);
  const [faqAnswer, setFaqAnswer] = useState(answer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qaTitle, setQaTitle] = useState("");

  useEffect(() => {
    if (question) setQaTitle(question);
  }, [question]);

  const handleSubmit = async () => {
    if (!user?.organization_id) {
      toast.error("Kunne ikke hente nødvendig informasjon for å opprette Q&A");
      return;
    }

    try {
      setIsSubmitting(true);

      const title = qaTitle.trim() || faqQuestion;
      const formattedTitle = ensureQATitleSuffix(title);

      // Check whether a Q&A with this title already exists (via proxy)
      const { data: findData, error: findError } = await supabase.functions.invoke(
        "voiceflow-kb",
        { body: { action: "find_qa_by_name", name: formattedTitle } }
      );
      if (findError) throw new Error(findError.message || "Kunne ikke sjekke for eksisterende Q&A");

      const payload = {
        schema: { searchableFields: ["question", "answer"] },
        name: formattedTitle,
        items: [
          {
            question: faqQuestion.trim(),
            answer: faqAnswer.trim(),
          },
        ],
      };

      const { error } = await supabase.functions.invoke("voiceflow-kb", {
        body: {
          action: "upload_qa",
          overwrite: !!findData?.exists,
          payload,
        },
      });
      if (error) throw new Error(error.message || "Feil ved opplasting til Voiceflow");

      toast.success("Q&A opprettet i kunnskapsbasen");
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating Q&A:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke opprette Q&A");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opprett ny Q&A</DialogTitle>
          <DialogDescription>
            Opprett en ny Q&A-oppføring basert på denne henvendelsen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="qa-title">Tittel</Label>
            <Input
              id="qa-title"
              placeholder="Tittel på Q&A-oppføringen"
              value={qaTitle}
              onChange={(e) => setQaTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              "- Q&A" vil automatisk legges til på slutten av tittelen.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Spørsmål</Label>
            <Input
              id="question"
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Svar</Label>
            <Textarea
              id="answer"
              rows={5}
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !faqQuestion.trim() || !faqAnswer.trim()}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {isSubmitting ? "Oppretter..." : "Opprett Q&A"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
