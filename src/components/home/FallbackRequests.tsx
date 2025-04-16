
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
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
import { PlusCircle, ChevronDown, ChevronUp, InfoIcon } from "lucide-react";
import { toast } from "sonner";
import { FallbackRequestItem } from "./FallbackRequestItem";
import { CreateFAQDialog } from "./CreateFAQDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface FallbackRequest {
  id: string;
  query: string;
  response: string;
  created_at: string;
  is_resolved: boolean;
}

export const FallbackRequests = () => {
  const { user } = useAuth();
  const { preview } = usePreview();
  const [fallbackRequests, setFallbackRequests] = useState<FallbackRequest[]>([]);
  const [resolvedRequests, setResolvedRequests] = useState<FallbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FallbackRequest | null>(null);
  const [createFAQOpen, setCreateFAQOpen] = useState(false);
  const [showAllResolved, setShowAllResolved] = useState(false);
  const [showFilteredResults, setShowFilteredResults] = useState(true);
  
  const organizationId = preview.isPreviewMode ? preview.previewOrgId : user?.organization_id;
  
  const filteredUnresolvedRequests = showFilteredResults 
    ? fallbackRequests.filter(req => req.query !== "not_a_question")
    : fallbackRequests;
  
  const filteredResolvedRequests = showFilteredResults 
    ? resolvedRequests.filter(req => req.query !== "not_a_question")
    : resolvedRequests;
  
  const fetchFallbackRequests = async () => {
    if (!organizationId) {
      console.log("[FallbackRequests] No organization ID available, skipping fetch");
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log("[FallbackRequests] Fetching fallback requests for organization:", organizationId);
      console.log("[FallbackRequests] Preview mode:", preview.isPreviewMode);
      console.log("[FallbackRequests] Preview org ID:", preview.previewOrgId);
      
      const { data: unresolvedData, error: unresolvedError } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
        
      if (unresolvedError) {
        console.error("[FallbackRequests] Error fetching unresolved requests:", unresolvedError);
        throw unresolvedError;
      }
      
      const { data: resolvedData, error: resolvedError } = await supabase
        .from('fallback_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_resolved', true)
        .order('created_at', { ascending: false });
        
      if (resolvedError) {
        console.error("[FallbackRequests] Error fetching resolved requests:", resolvedError);
        throw resolvedError;
      }
      
      console.log("[FallbackRequests] Fetched unresolved fallback requests:", unresolvedData?.length || 0);
      console.log("[FallbackRequests] Fetched resolved fallback requests:", resolvedData?.length || 0);
      
      setFallbackRequests(unresolvedData || []);
      setResolvedRequests(resolvedData || []);
    } catch (error) {
      console.error('[FallbackRequests] Error fetching fallback requests:', error);
      toast.error('Kunne ikke hente henvendelser til fallback');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFallbackRequests();
  }, [organizationId]);
  
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

  const handleMarkAsResolved = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('fallback_requests')
        .update({ is_resolved: true })
        .eq('id', requestId);
        
      if (error) throw error;
      
      fetchFallbackRequests();
      toast.success('Henvendelse markert som løst');
    } catch (error) {
      console.error('Error updating fallback request:', error);
      toast.error('Kunne ikke oppdatere henvendelsen');
    }
  };

  const displayedResolvedRequests = showAllResolved 
    ? filteredResolvedRequests 
    : filteredResolvedRequests.slice(0, 3);

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Viser {filteredUnresolvedRequests.length} av {fallbackRequests.length} uløste henvendelser
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter skjuler henvendelser med "not_a_question" som spørsmål</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilteredResults(!showFilteredResults)}
            >
              {showFilteredResults ? "Vis alle" : "Vis filtrerte"}
            </Button>
          </div>
          
          <Tabs defaultValue="unresolved" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted">
              <TabsTrigger 
                value="unresolved" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Uløste henvendelser
              </TabsTrigger>
              <TabsTrigger 
                value="resolved" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Løste henvendelser
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="unresolved">
              {isLoading ? (
                renderLoadingState()
              ) : filteredUnresolvedRequests.length > 0 ? (
                <ScrollArea className="h-[320px]">
                  <div className="divide-y">
                    {filteredUnresolvedRequests.map((request) => (
                      <FallbackRequestItem 
                        key={request.id} 
                        request={request} 
                        onClick={() => handleRequestClick(request)} 
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsResolved(request.id);
                          }}
                        >
                          Marker som løst uten å opprette Q&A
                        </Button>
                      </FallbackRequestItem>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Hurra! Ingen uløste henvendelser til fallback</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resolved">
              {isLoading ? (
                renderLoadingState()
              ) : filteredResolvedRequests.length > 0 ? (
                <>
                  <ScrollArea className="h-[320px]">
                    <div className="divide-y">
                      {displayedResolvedRequests.map((request) => (
                        <FallbackRequestItem 
                          key={request.id} 
                          request={request} 
                          onClick={() => {}} 
                          isResolved={true}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {filteredResolvedRequests.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full mt-2 flex items-center justify-center gap-1" 
                      onClick={() => setShowAllResolved(!showAllResolved)}
                    >
                      {showAllResolved ? (
                        <>Vis færre <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Vis alle ({filteredResolvedRequests.length}) <ChevronDown className="h-4 w-4" /></>
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
