
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ServerStatus } from "./ServerStatus";
import { FallbackRequests } from "./FallbackRequests";
import { DashboardManual } from "./DashboardManual";
import { usePreview } from "@/contexts/PreviewContext";

export const Home = () => {
  const { user } = useAuth();
  const { preview } = usePreview();
  const [userName, setUserName] = useState<string>("");
  
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (preview.isPreviewMode && preview.previewEmail) {
          setUserName(preview.previewEmail.split('@')[0] || "Preview User");
          return;
        }
        
        if (!user) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data && data.name) {
          setUserName(data.name);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserName();
  }, [user, preview.isPreviewMode, preview.previewEmail]);
  
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary">
          Hei, {userName || "bruker"}! 👋
        </h1>
        <p className="text-muted-foreground">
          Velkommen til dashbordet ditt. Her kan du se viktig informasjon om systemet ditt.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ServerStatus />
          <FallbackRequests />
        </div>
        <div>
          <DashboardManual />
        </div>
      </div>
    </div>
  );
};
