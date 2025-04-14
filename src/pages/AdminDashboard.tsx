
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import OrganizationsTab from "@/components/admin/OrganizationsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("organizations");

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar 
        role="admin" 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="flex-1 overflow-auto p-8">
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
