
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationsTab } from "@/components/conversations/ConversationsTab";
import { Statistics } from "@/components/statistics/Statistics";
import { Home } from "@/components/home/Home";
import { AdministratorTab } from "@/components/administrator/AdministratorTab";
import { supabase } from "@/integrations/supabase/client";

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { user } = useAuth();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_tab_permissions')
          .select('tab_name')
          .eq('user_id', user.id)
          .eq('tab_name', 'administrator')
          .maybeSingle();
          
        if (!error && data) {
          setHasAdminAccess(true);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
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
        {renderActiveTab()}
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
