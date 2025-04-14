
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationsTab } from "@/components/conversations/ConversationsTab";
import { Statistics } from "@/components/statistics/Statistics";
import { Home } from "@/components/home/Home";
import { AdministratorTab } from "@/components/administrator/AdministratorTab";

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar 
        role="client" 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <div className="flex-1 overflow-auto">
        {activeTab === "home" && <Home />}
        {activeTab === "conversations" && <ConversationsTab />}
        {activeTab === "knowledge" && <KnowledgeBase />}
        {activeTab === "statistics" && <Statistics />}
        {activeTab === "administrator" && <AdministratorTab />}
      </div>
    </div>
  );
};

export default ClientDashboard;
