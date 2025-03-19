
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/ui/loader";
import { PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { FallbackRequestItem } from "./FallbackRequestItem";
import { CreateFAQDialog } from "./CreateFAQDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [resolvedRequests, setResolvedRequests] = useState<FallbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FallbackRequest | null>(null);
  const [createFAQOpen, setCreateFAQOpen] = useState(false);
  const [showAllResolved, setShowAllResolved] = useState(false);
  
  const fetchFallbackRequests = async () => {
    if (!user?.organization_id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch unresolved requests
      const { data: unresolvedData, error: unresolvedError } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
        
      if (unresolvedError) throw unresolvedError;
      
      // Fetch resolved requests
      const { data: resolvedData, error: resolvedError } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_resolved', true)
        .order('created_at', { ascending: false });
        
      if (resolvedError) throw resolvedError;
      
      setFallbackRequests(unresolvedData || []);
      setResolvedRequests(resolvedData || []);
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
      toast.success('Q&A opprettet og henvendelse markert som løst');
    } catch (error) {
      console.error('Error updating fallback request:', error);
      toast.error('Kunne ikke oppdatere henvendelsen');
    } finally {
      setCreateFAQOpen(false);
      setSelectedRequest(null);
    }
  };

  const displayedResolvedRequests = showAllResolved 
    ? resolvedRequests 
    : resolvedRequests.slice(0, 3);
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-montserrat">Henvendelser sendt til fallback</CardTitle>
          <CardDescription>
            Henvendelser som er videresendt til menneskelig hjelp. Klikk på en henvendelse for å opprette en Q&A-oppføring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unresolved" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="unresolved">Uløste henvendelser</TabsTrigger>
              <TabsTrigger value="resolved">Løste henvendelser</TabsTrigger>
            </TabsList>
            
            <TabsContent value="unresolved">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader size="md" />
                  <p className="text-muted-foreground mt-4">Laster henvendelser...</p>
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
            </TabsContent>
            
            <TabsContent value="resolved">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader size="md" />
                  <p className="text-muted-foreground mt-4">Laster henvendelser...</p>
                </div>
              ) : resolvedRequests.length > 0 ? (
                <>
                  <div className="divide-y">
                    {displayedResolvedRequests.map((request) => (
                      <FallbackRequestItem 
                        key={request.id} 
                        request={request} 
                        onClick={() => {}} // Resolved requests don't need to be clicked
                        isResolved={true}
                      />
                    ))}
                  </div>
                  
                  {resolvedRequests.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full mt-2 flex items-center justify-center gap-1" 
                      onClick={() => setShowAllResolved(!showAllResolved)}
                    >
                      {showAllResolved ? (
                        <>Vis færre <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Vis alle ({resolvedRequests.length}) <ChevronDown className="h-4 w-4" /></>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Ingen løste henvendelser til fallback</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
