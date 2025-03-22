
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface BugReportFormData {
  title: string;
  description: string;
}

export const BugReportSection = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BugReportFormData>();
  
  const onSubmit = async (data: BugReportFormData) => {
    if (!user?.organization_id) {
      toast({
        title: "Feil",
        description: "Du må være logget inn med en organisasjon for å rapportere feil",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('bug_reports')
        .insert({
          organization_id: user.organization_id,
          user_id: user.id,
          title: data.title,
          description: data.description,
          status: 'pending'
        });
      
      if (error) throw error;
      
      setOpenSuccessDialog(true);
      reset();
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende feilrapport. Vennligst prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-montserrat text-primary">Rapporter en feil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Hva skjedde?</Label>
              <Input
                id="title"
                placeholder="Kort beskrivelse av feilen"
                {...register("title", { required: "Tittel er påkrevd" })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Detaljert beskrivelse</Label>
              <Textarea
                id="description"
                placeholder="Beskriv når det skjedde, hvor i chatboten det skjedde, hvem som opplevde det og annen relevant informasjon"
                rows={5}
                {...register("description", { required: "Beskrivelse er påkrevd" })}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sender..." : "Send feilrapport"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Dialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feilrapport sendt</DialogTitle>
          </DialogHeader>
          <p>
            Takk for din feilrapport! Vårt team vil se på problemet så snart som mulig.
          </p>
          <DialogFooter>
            <Button onClick={() => setOpenSuccessDialog(false)}>Lukk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
