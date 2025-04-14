
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { toast } from "sonner";
import { CreateFAQDialog } from "./CreateFAQDialog";
import { useFallbackRequests, FallbackRequest } from "@/hooks/use-fallback-requests";
import { RequestsHeader } from "./fallback/RequestsHeader";
import { RequestTabs } from "./fallback/RequestTabs";

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
          <RequestsHeader
            unresolvedCount={filteredUnresolvedRequests.length}
            totalUnresolvedCount={fallbackRequests.length}
            showFilteredResults={showFilteredResults}
            onToggleFilter={() => setShowFilteredResults(!showFilteredResults)}
          />
          
          <RequestTabs
            isLoading={isLoading}
            unresolvedRequests={filteredUnresolvedRequests}
            resolvedRequests={filteredResolvedRequests}
            onRequestClick={handleRequestClick}
            onMarkAsResolved={handleMarkAsResolved}
          />
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
