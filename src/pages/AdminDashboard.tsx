
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationsTab from "@/components/admin/OrganizationsTab";
import { AdministratorTab } from "@/components/administrator/AdministratorTab";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserDebugInfo from "@/components/admin/UserDebugInfo";
import Topbar from "@/components/Topbar";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [userTabs, setUserTabs] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setUserRole(profileData.role || '');

        const { data: tabsData, error: tabsError } = await supabase
          .from('user_tab_permissions')
          .select('tab_name')
          .eq('user_id', user.id);

        if (tabsError) throw tabsError;
        
        const allowedTabs = tabsData?.map(tab => tab.tab_name) || [];
        setUserTabs(allowedTabs);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const hasAccess = (tabName: string) => {
    return userRole === 'admin' || userTabs.includes(tabName);
  };

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="pt-10">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          
          <Tabs defaultValue="organizations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {hasAccess('organizations') && (
                <TabsTrigger value="organizations">Organisasjoner</TabsTrigger>
              )}
              {hasAccess('administrator') && (
                <TabsTrigger value="administrator">Administrator</TabsTrigger>
              )}
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>
            
            {hasAccess('organizations') && (
              <TabsContent value="organizations">
                <OrganizationsTab />
              </TabsContent>
            )}
            
            {hasAccess('administrator') && (
              <TabsContent value="administrator">
                <AdministratorTab />
              </TabsContent>
            )}
            
            <TabsContent value="debug">
              <UserDebugInfo />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
