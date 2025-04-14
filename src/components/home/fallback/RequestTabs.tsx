
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FallbackRequest } from "@/hooks/use-fallback-requests";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FallbackRequestItem } from "../FallbackRequestItem";
import { useState } from "react";

interface RequestTabsProps {
  isLoading: boolean;
  unresolvedRequests: FallbackRequest[];
  resolvedRequests: FallbackRequest[];
  onRequestClick: (request: FallbackRequest) => void;
  onMarkAsResolved: (requestId: string) => void;
}

export const RequestTabs = ({
  isLoading,
  unresolvedRequests,
  resolvedRequests,
  onRequestClick,
  onMarkAsResolved
}: RequestTabsProps) => {
  const [showAllResolved, setShowAllResolved] = useState(false);
  
  const displayedResolvedRequests = showAllResolved 
    ? resolvedRequests
    : resolvedRequests.slice(0, 3);

  const renderLoadingState = () => (
    <div className="flex justify-center py-4">
      <Loader size="sm" text="Laster henvendelser til fallback..." />
    </div>
  );
  
  return (
    <Tabs defaultValue="unresolved" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="unresolved">Uløste henvendelser</TabsTrigger>
        <TabsTrigger value="resolved">Løste henvendelser</TabsTrigger>
      </TabsList>
      
      <TabsContent value="unresolved">
        {isLoading ? (
          renderLoadingState()
        ) : unresolvedRequests.length > 0 ? (
          <ScrollArea className="h-[320px]">
            <div className="divide-y">
              {unresolvedRequests.map((request) => (
                <FallbackRequestItem 
                  key={request.id} 
                  request={request} 
                  onClick={() => onRequestClick(request)} 
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsResolved(request.id);
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
        ) : resolvedRequests.length > 0 ? (
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
  );
};
