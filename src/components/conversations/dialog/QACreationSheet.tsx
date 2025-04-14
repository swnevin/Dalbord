
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface QACreationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  qaPair: { question: string; answer: string };
  onSave: () => void;
  onQaPairChange: (qaPair: { question: string; answer: string }) => void;
  onTitleChange: (title: string) => void;
}

export const QACreationSheet = ({
  open,
  onOpenChange,
  title,
  qaPair,
  onSave,
  onQaPairChange,
  onTitleChange,
}: QACreationSheetProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-cream w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-primary">Opprett Q&A sett</SheetTitle>
          <SheetDescription>
            Opprett et nytt spørsmål og svar-par basert på de valgte meldingene.
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qa-title">Tittel</Label>
            <Input
              id="qa-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Skriv inn en tittel for Q&A settet"
              className="border-primary/20 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              "- Q&A" vil automatisk legges til på slutten av tittelen.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="qa-question">Spørsmål</Label>
            <Textarea
              id="qa-question"
              value={qaPair.question}
              onChange={(e) => onQaPairChange({ ...qaPair, question: e.target.value })}
              placeholder="Spørsmål"
              className="min-h-[80px] border-primary/20 focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="qa-answer">Svar</Label>
            <Textarea
              id="qa-answer"
              value={qaPair.answer}
              onChange={(e) => onQaPairChange({ ...qaPair, answer: e.target.value })}
              placeholder="Svar"
              className="min-h-[150px] border-primary/20 focus:border-primary"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={handleSave}
              disabled={!title || !qaPair.question || !qaPair.answer || isSaving}
            >
              {isSaving ? "Lagrer..." : "Lagre Q&A"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
