
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, InfoIcon } from "lucide-react";
import { toast } from "sonner";
import { FallbackRequestItem } from "./FallbackRequestItem";
import { CreateFAQDialog } from "./CreateFAQDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useFallbackRequests, FallbackRequest } from "@/hooks/use-fallback-requests";

export const FallbackRequests = () => {
  const {
    fallbackRequests,
    resolvedRequests,
    isLoading,
    showFilteredResults,
    setShowFilteredResults,
    fetchFallbackRequests,
    markAsResolved
  } = useFallbackRequests();
  
  const [selectedRequest, setSelectedRequest] = useState<FallbackRequest | null>(null);
  const [createFAQOpen, setCreateFAQOpen] = useState(false);
  const [showAllResolved, setShowAllResolved] = useState(false);
  
  // Filter out "not_a_question" entries
  const filteredUnresolvedRequests = showFilteredResults 
    ? fallbackRequests.filter(req => req.query !== "not_a_question")
    : fallbackRequests;
  
  const filteredResolvedRequests = showFilteredResults 
    ? resolvedRequests.filter(req => req.query !== "not_a_question")
    : resolvedRequests;
  
  const handleRequestClick = (request: FallbackRequest) => {
    setSelectedRequest(request);
    setCreateFAQOpen(true);
  };
  
  const handleFAQCreated = async () => {
    if (!selectedRequest) return;
    await markAsResolved(selectedRequest.id);
    setCreateFAQOpen(false);
    setSelectedRequest(null);
    toast.success('Q&A opprettet og henvendelse markert som løst');
  };

  const handleMarkAsResolved = async (requestId: string) => {
    await markAsResolved(requestId);
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
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="unresolved">Uløste henvendelser</TabsTrigger>
              <TabsTrigger value="resolved">Løste henvendelser</TabsTrigger>
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
