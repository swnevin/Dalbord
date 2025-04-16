
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircleOff, ArrowRight, MessageSquare } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FallbackRequest {
  id: string;
  query: string;
  created_at: string;
  is_resolved: boolean;
}

export const FallbackRequests = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackRequests, setFallbackRequests] = useState<FallbackRequest[]>([]);
  const { user } = useAuth();
  const { preview } = usePreview();
  const navigate = useNavigate();

  const organizationId = preview.isPreviewMode ? preview.previewOrgId : user?.organization_id;

  useEffect(() => {
    const fetchFallbackRequests = async () => {
      if (!organizationId) {
        console.log("[FallbackRequests] No organization ID, skipping fetch");
        setIsLoading(false);
        return;
      }

      try {
        console.log("[FallbackRequests] Fetching fallback requests for org:", organizationId);
        
        const { data, error } = await supabase
          .from('fallback_requests')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error("[FallbackRequests] Error fetching fallback requests:", error);
          throw error;
        }

        console.log("[FallbackRequests] Fetched fallback requests:", data?.length || 0);
        
        if (data && data.length > 0) {
          console.log("[FallbackRequests] First fallback request:", data[0]);
        }
        
        setFallbackRequests(data || []);
      } catch (error) {
        console.error("[FallbackRequests] Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFallbackRequests();
  }, [organizationId]);

  const handleViewAll = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircleOff className="h-5 w-5 text-muted-foreground" />
            Henvendelser sendt til fallback
          </CardTitle>
          <CardDescription>
            Spørsmål som assistenten ikke kunne svare på
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader size="md" text="Laster henvendelser..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircleOff className="h-5 w-5 text-muted-foreground" />
          Henvendelser sendt til fallback
        </CardTitle>
        <CardDescription>
          Spørsmål som assistenten ikke kunne svare på
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fallbackRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Ingen henvendelser sendt til fallback ennå</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fallbackRequests.map((request) => (
              <div 
                key={request.id} 
                className="flex justify-between items-start p-3 border rounded-md"
              >
                <div>
                  <p className="font-medium mb-1 line-clamp-2">{request.query}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{new Date(request.created_at).toLocaleDateString('no')}</span>
                    <Badge variant={request.is_resolved ? "outline" : "destructive"}>
                      {request.is_resolved ? "Løst" : "Ikke løst"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary flex items-center gap-1"
                onClick={handleViewAll}
              >
                Se alle <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
