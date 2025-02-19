
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";

interface StatisticsData {
  totalInteractions: number;
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

        if (orgError) throw orgError;
        if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
          console.error('Missing Voiceflow credentials');
          return;
        }

        const response = await fetch(
          `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}`,
          {
            headers: {
              accept: 'application/json',
              Authorization: org.voiceflow_api_key,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch statistics');

        const conversations = await response.json();
        
        // Calculate total interactions by summing up all messages in all conversations
        let totalInteractions = 0;
        for (const conversation of conversations) {
          const dialogResponse = await fetch(
            `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${conversation._id}`,
            {
              headers: {
                accept: 'application/json',
                Authorization: org.voiceflow_api_key,
              },
            }
          );
          
          if (dialogResponse.ok) {
            const dialog = await dialogResponse.json();
            totalInteractions += dialog.filter((msg: any) => 
              ['text', 'request'].includes(msg.type)
            ).length;
          }
        }

        setData({
          totalInteractions,
          totalConversations: conversations.length,
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
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

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-primary">Statistikk</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interaksjoner
            </CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalInteractions.toLocaleString('no') ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Totalt antall meldinger utvekslet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Antall Samtaler
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalConversations.toLocaleString('no') ?? '0'}
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
