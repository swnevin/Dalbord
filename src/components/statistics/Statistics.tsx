
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, UserRound, MousePointer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";

interface StatisticsData {
  totalMessages: number;
  totalClicks: number;
  totalConversations: number;
}

export const Statistics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user?.organization_id) return;

      try {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('voiceflow_api_key, voiceflow_project_id')
          .eq('id', user.organization_id)
          .single();

        if (orgError) {
          toast.error('Kunne ikke hente organisasjonsdetaljer');
          throw orgError;
        }
        
        if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
          toast.error('Mangler Voiceflow-legitimasjon');
          return;
        }

        // Fetch only last 100 conversations for faster loading
        const conversationsResponse = await fetch(
          `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}?limit=100`,
          {
            headers: {
              Authorization: org.voiceflow_api_key,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!conversationsResponse.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const conversations = await conversationsResponse.json();
        
        // Fetch only the last 20 dialogs for quick statistics
        const recentConversations = conversations.slice(0, 20);
        const dialogPromises = recentConversations.map(conversation => 
          fetch(
            `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${conversation._id}`,
            {
              headers: {
                Authorization: org.voiceflow_api_key,
                'Content-Type': 'application/json',
              },
            }
          ).then(res => res.json())
        );

        const dialogs = await Promise.allSettled(dialogPromises);
        
        // Calculate separate totals for messages and clicks
        let totalMessages = 0;
        let totalClicks = 0;
        
        dialogs.forEach(result => {
          if (result.status === 'fulfilled') {
            const dialog = result.value;
            dialog.forEach((msg: any) => {
              if (msg.type === 'text') totalMessages++;
              if (msg.type === 'request') totalClicks++;
            });
          }
        });

        // Calculate averages to estimate total numbers
        const avgMessagesPerConversation = totalMessages / recentConversations.length;
        const avgClicksPerConversation = totalClicks / recentConversations.length;

        // Extrapolate to all conversations
        const estimatedTotalMessages = Math.round(avgMessagesPerConversation * conversations.length);
        const estimatedTotalClicks = Math.round(avgClicksPerConversation * conversations.length);

        setData({
          totalMessages: estimatedTotalMessages,
          totalClicks: estimatedTotalClicks,
          totalConversations: conversations.length,
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast.error('Kunne ikke hente statistikk');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [user?.organization_id]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Statistikk</h1>
        <p className="text-muted-foreground">Ingen data tilgjengelig</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-primary">Statistikk</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meldinger
            </CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalMessages.toLocaleString('no')}
            </div>
            <p className="text-xs text-muted-foreground">
              Totalt antall meldinger utvekslet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Knappetrykk
            </CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalClicks.toLocaleString('no')}
            </div>
            <p className="text-xs text-muted-foreground">
              Totalt antall knappetrykk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Samtaler
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalConversations.toLocaleString('no')}
            </div>
            <p className="text-xs text-muted-foreground">
              Totalt antall påbegynte samtaler
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
