
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
  onCreated
}: CreateFAQDialogProps) => {
  const { user } = useAuth();
  const [faqQuestion, setFaqQuestion] = useState(question);
  const [faqAnswer, setFaqAnswer] = useState(answer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qaTitle, setQaTitle] = useState("");
  const [voiceflowApiKey, setVoiceflowApiKey] = useState<string | null>(null);
  
  // Fetch Voiceflow API key
  useEffect(() => {
    const fetchApiKey = async () => {
      if (!user?.organization_id) return;
      
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('voiceflow_api_key')
          .eq('id', user.organization_id)
          .single();
          
        if (error) throw error;
        
        setVoiceflowApiKey(data.voiceflow_api_key);
      } catch (error) {
        console.error("Error fetching Voiceflow API key:", error);
      }
    };
    
    fetchApiKey();
  }, [user?.organization_id]);
  
  const handleSubmit = async () => {
    if (!user?.organization_id || !voiceflowApiKey) {
      toast.error("Kunne ikke hente nødvendig informasjon for å opprette Q&A");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format the Q&A title
      const title = qaTitle.trim() || "Automatisk opprettet Q&A";
      const formattedTitle = ensureQATitleSuffix(title);
      
      // Create a Q&A pair in the knowledge base
      const qaItems = [
        {
          question: faqQuestion.trim(),
          answer: faqAnswer.trim()
        }
      ];

      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          Authorization: voiceflowApiKey
        },
        body: JSON.stringify({
          data: {
            schema: { searchableFields: ['question', 'answer'] },
            name: formattedTitle,
            items: qaItems
          }
        })
      };

      const response = await fetch('https://api.voiceflow.com/v1/knowledge-base/docs/upload/table', options);
      
      if (!response.ok) {
        throw new Error('Feil ved opplasting til Voiceflow');
      }
      
      toast.success('Q&A opprettet i kunnskapsbasen');
      onCreated();
    } catch (error) {
      console.error('Error creating Q&A:', error);
      toast.error('Kunne ikke opprette Q&A');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const ensureQATitleSuffix = (title: string): string => {
    if (!title.endsWith("- Q&A")) {
      return `${title} - Q&A`;
    }
    return title;
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
            <Label htmlFor="qa-title">Tittel (valgfritt)</Label>
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
            disabled={isSubmitting || !faqQuestion.trim() || !faqAnswer.trim() || !voiceflowApiKey}
          >
            {isSubmitting ? 'Oppretter...' : 'Opprett Q&A'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
