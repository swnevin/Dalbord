
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { FallbackRequestItem } from "./FallbackRequestItem";
import { CreateFAQDialog } from "./CreateFAQDialog";

interface FallbackRequest {
  id: string;
  query: string;
  response: string;
  created_at: string;
  is_resolved: boolean;
}

export const FallbackRequests = () => {
  const { user } = useAuth();
  const [fallbackRequests, setFallbackRequests] = useState<FallbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FallbackRequest | null>(null);
  const [createFAQOpen, setCreateFAQOpen] = useState(false);
  
  const fetchFallbackRequests = async () => {
    if (!user?.organization_id) return;
    
    try {
      const { data, error } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setFallbackRequests(data || []);
    } catch (error) {
      console.error('Error fetching fallback requests:', error);
      toast.error('Kunne ikke hente henvendelser til fallback');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFallbackRequests();
  }, [user?.organization_id]);
  
  const handleRequestClick = (request: FallbackRequest) => {
    setSelectedRequest(request);
    setCreateFAQOpen(true);
  };
  
  const handleFAQCreated = async () => {
    if (!selectedRequest) return;
    
    try {
      const { error } = await supabase
        .from('fallback_requests')
        .update({ is_resolved: true })
        .eq('id', selectedRequest.id);
        
      if (error) throw error;
      
      // Refresh the list after marking as resolved
      fetchFallbackRequests();
      toast.success('FAQ opprettet og henvendelse markert som løst');
    } catch (error) {
      console.error('Error updating fallback request:', error);
      toast.error('Kunne ikke oppdatere henvendelsen');
    } finally {
      setCreateFAQOpen(false);
      setSelectedRequest(null);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-montserrat">Henvendelser sendt til fallback</CardTitle>
          <CardDescription>
            Henvendelser som er videresendt til menneskelig hjelp. Klikk på en henvendelse for å opprette en FAQ-oppføring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : fallbackRequests.length > 0 ? (
            <div className="divide-y">
              {fallbackRequests.map((request) => (
                <FallbackRequestItem 
                  key={request.id} 
                  request={request} 
                  onClick={() => handleRequestClick(request)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ingen uløste henvendelser til fallback</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedRequest && (
        <CreateFAQDialog
          open={createFAQOpen}
          onOpenChange={setCreateFAQOpen}
          question={selectedRequest.query}
          answer={selectedRequest.response}
          onCreated={handleFAQCreated}
        />
      )}
    </>
  );
};
