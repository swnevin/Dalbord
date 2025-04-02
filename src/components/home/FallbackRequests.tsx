
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
import { PlusCircle, ChevronDown, ChevronUp, Info, Check } from "lucide-react";
import { toast } from "sonner";
import { FallbackRequestItem } from "./FallbackRequestItem";
import { CreateFAQDialog } from "./CreateFAQDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [hideNotAQuestion, setHideNotAQuestion] = useState(true);
  
  const fetchFallbackRequests = async () => {
    if (!user?.organization_id) return;
    
    try {
      setIsLoading(true);
      
      const { data: unresolvedData, error: unresolvedError } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
        
      if (unresolvedError) throw unresolvedError;
      
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

  const handleMarkAsResolved = async (request: FallbackRequest) => {
    try {
      const { error } = await supabase
        .from('fallback_requests')
        .update({ is_resolved: true })
        .eq('id', request.id);
        
      if (error) throw error;
      
      fetchFallbackRequests();
      toast.success('Henvendelse markert som løst');
    } catch (error) {
      console.error('Error updating fallback request:', error);
      toast.error('Kunne ikke markere henvendelsen som løst');
    }
  };

  // Filter out "not_a_question" entries if the filter is enabled
  const filteredUnresolvedRequests = hideNotAQuestion
    ? fallbackRequests.filter(req => !req.query.toLowerCase().includes('not_a_question'))
    : fallbackRequests;

  const displayedResolvedRequests = showAllResolved 
    ? resolvedRequests 
    : resolvedRequests.slice(0, 3);

  const renderLoadingState = () => (
    <div className="flex justify-center py-4">
      <Loader size="sm" text="Laster henvendelser til fallback..." />
    </div>
  );
  
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
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/80 p-1 rounded-xl overflow-hidden">
              <TabsTrigger 
                value="unresolved" 
                className="data-[state=active]:bg-secondary data-[state=active]:text-primary font-medium rounded-lg"
              >
                Uløste henvendelser
              </TabsTrigger>
              <TabsTrigger 
                value="resolved"
                className="data-[state=active]:bg-secondary data-[state=active]:text-primary font-medium rounded-lg"
              >
                Løste henvendelser
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="unresolved">
              {isLoading ? (
                renderLoadingState()
              ) : fallbackRequests.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Viser {filteredUnresolvedRequests.length} av {fallbackRequests.length} henvendelser
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Filtrerer bort innlegg med "not_a_question"
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Skjul "not_a_question"</span>
                      <Switch 
                        checked={hideNotAQuestion} 
                        onCheckedChange={setHideNotAQuestion}
                      />
                    </div>
                  </div>

                  <ScrollArea className="h-[320px]">
                    <div className="divide-y">
                      {filteredUnresolvedRequests.map((request) => (
                        <FallbackRequestItem 
                          key={request.id} 
                          request={request} 
                          onClick={() => handleRequestClick(request)} 
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleMarkAsResolved(request);
                          }}
                        >
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestClick(request);
                              }}
                            >
                              <PlusCircle className="h-4 w-4" />
                              Opprett Q&A
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsResolved(request);
                              }}
                            >
                              <Check className="h-4 w-4" />
                              Marker som løst
                            </Button>
                          </div>
                        </FallbackRequestItem>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Hurra! Ingen uløste henvendelser til fallback</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resolved">
              {isLoading ? (
                renderLoadingState()
              ) : resolvedRequests.length > 0 ? (
                <>
                  <ScrollArea className="h-[320px]">
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
                  </ScrollArea>
                  
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
