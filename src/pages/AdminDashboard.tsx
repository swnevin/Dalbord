
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import OrganizationsTab from "@/components/admin/OrganizationsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("organizations");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Topbar />
      <Sidebar 
        role="admin" 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className={`flex-1 overflow-auto p-6 pt-14 transition-all duration-300 ${sidebarCollapsed ? 'ml-12' : 'ml-48'}`}>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsContent value="organizations" className="mt-0 h-full">
            <OrganizationsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
