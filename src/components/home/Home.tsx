
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";
import { ServerStatus } from "./ServerStatus";
import { FallbackRequests } from "./FallbackRequests";
import { useMinimumLoading } from "@/hooks/use-minimum-loading";

export const Home = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;
      
      try {
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserName();
  }, [user]);
  
  const showLoader = useMinimumLoading(isLoading);
  
  if (showLoader) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold font-montserrat text-primary">
          Hei, {userName || "bruker"}!
        </h1>
        <p className="text-muted-foreground">
          Velkommen til dashbordet ditt. Her kan du se viktig informasjon om systemet ditt.
        </p>
      </header>
      
      <ServerStatus />
      
      {/* Render FallbackRequests regardless of loading state */}
      <FallbackRequests />
    </div>
  );
};
