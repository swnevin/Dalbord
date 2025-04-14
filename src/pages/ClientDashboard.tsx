
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationsTab } from "@/components/conversations/ConversationsTab";
import { Statistics } from "@/components/statistics/Statistics";
import { Home } from "@/components/home/Home";
import { AdministratorTab } from "@/components/administrator/AdministratorTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { user } = useAuth();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setIsCheckingAccess(false);
        return;
      }
      
      try {
        setIsCheckingAccess(true);
        console.log("Checking admin access for user", user.id);
        
        const { data, error } = await supabase
          .from('user_tab_permissions')
          .select('tab_name')
          .eq('user_id', user.id)
          .eq('tab_name', 'administrator')
          .maybeSingle();
          
        if (!error && data) {
          console.log("User has admin access");
          setHasAdminAccess(true);
        } else {
          console.log("User does not have admin access");
          setHasAdminAccess(false);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        toast.error('Feil ved sjekking av administratortilgang');
      } finally {
        setIsCheckingAccess(false);
      }
    };
    
    checkAdminAccess();
  }, [user]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "conversations":
        return <ConversationsTab />;
      case "knowledge":
        return <KnowledgeBase />;
      case "statistics":
        return <Statistics />;
      case "administrator":
        return hasAdminAccess ? <AdministratorTab /> : <AccessDenied />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar 
        role="client" 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <div className="flex-1 overflow-auto">
        {isCheckingAccess ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-gray-600">Laster...</p>
            </div>
          </div>
        ) : (
          renderActiveTab()
        )}
      </div>
    </div>
  );
};

const AccessDenied = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md text-center p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Tilgang nektet</h2>
        <p className="text-gray-600">
          Du har ikke tilgang til administratorfunksjoner. Vennligst kontakt en administrator hvis du mener dette er en feil.
        </p>
      </div>
    </div>
  );
};

export default ClientDashboard;
