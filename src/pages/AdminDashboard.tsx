
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import OrganizationsTab from "@/components/admin/OrganizationsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("organizations");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-cream">
      <Sidebar 
        role="admin" 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCollapsedChange={setSidebarCollapsed}
      />
      <Topbar sidebarCollapsed={sidebarCollapsed} />
      <main className={`flex-1 overflow-auto p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
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
