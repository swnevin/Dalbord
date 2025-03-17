
import { useState } from "react";
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
  
  const handleSubmit = async () => {
    if (!user?.organization_id) return;
    
    try {
      setIsSubmitting(true);
      
      // In a real implementation, this would create an entry in the knowledge base
      // This is a placeholder for actual knowledge base creation logic
      // For now, we'll just simulate success
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      toast.success('FAQ opprettet i kunnskapsbasen');
      onCreated();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error('Kunne ikke opprette FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opprett ny FAQ</DialogTitle>
          <DialogDescription>
            Opprett en ny FAQ-oppføring basert på denne henvendelsen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
          >
            {isSubmitting ? 'Oppretter...' : 'Opprett FAQ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
