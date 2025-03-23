
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
  onCreated
}: CreateFAQDialogProps) => {
  const { user } = useAuth();
  const [faqQuestion, setFaqQuestion] = useState(question);
  const [faqAnswer, setFaqAnswer] = useState(answer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qaTitle, setQaTitle] = useState("");
  const [voiceflowApiKey, setVoiceflowApiKey] = useState<string | null>(null);
  const [voiceflowProjectId, setVoiceflowProjectId] = useState<string | null>(null);
  
  // Auto-generate title from question - use the full question as title
  useEffect(() => {
    if (question) {
      setQaTitle(question);
    }
  }, [question]);
  
  // Fetch Voiceflow credentials
  useEffect(() => {
    const fetchCredentials = async () => {
      if (!user?.organization_id) return;
      
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('voiceflow_api_key, voiceflow_project_id')
          .eq('id', user.organization_id)
          .single();
          
        if (error) throw error;
        
        setVoiceflowApiKey(data.voiceflow_api_key);
        setVoiceflowProjectId(data.voiceflow_project_id);
      } catch (error) {
        console.error("Error fetching Voiceflow credentials:", error);
      }
    };
    
    fetchCredentials();
  }, [user?.organization_id]);
  
  const handleSubmit = async () => {
    if (!user?.organization_id || !voiceflowApiKey) {
      toast.error("Kunne ikke hente nødvendig informasjon for å opprette Q&A");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format the Q&A title - use the full title without truncation
      const title = qaTitle.trim() || faqQuestion;
      const formattedTitle = ensureQATitleSuffix(title);
      
      // Check if a Q&A with this title already exists
      const response = await fetch(
        `https://api.voiceflow.com/v1/knowledge-base/docs`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': voiceflowApiKey
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

      const endpoint = `https://api.voiceflow.com/v1/knowledge-base/docs/upload/table?overwrite=${existingQA ? 'true' : 'false'}`;
      
      const saveResponse = await fetch(endpoint, options);

      if (!saveResponse.ok) {
        throw new Error('Feil ved opplasting til Voiceflow');
      }
      
      toast.success('Q&A opprettet i kunnskapsbasen');
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating Q&A:', error);
      toast.error('Kunne ikke opprette Q&A');
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
            disabled={isSubmitting || !faqQuestion.trim() || !faqAnswer.trim() || !voiceflowApiKey}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {isSubmitting ? 'Oppretter...' : 'Opprett Q&A'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
