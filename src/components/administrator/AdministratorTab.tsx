
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationCard } from "@/components/admin/OrganizationCard";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type TabName = Database["public"]["Enums"]["tab_type"];

interface Organization {
  id: string;
  name: string;
  created_at?: string;
  voiceflow_api_key?: string;
  voiceflow_project_id?: string;
  type: "admin" | "client";
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string | null;
  tabs?: { tab_name: TabName }[];
}

export const AdministratorTab = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userAccessibleTabs, setUserAccessibleTabs] = useState<TabName[]>([]);

  useEffect(() => {
    if (user?.organization_id) {
      fetchOrganization();
      fetchUserAccessibleTabs();
    }
  }, [user]);

  const fetchOrganization = async () => {
    if (!user?.organization_id) return;
    
    try {
      // Fetch organization data
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", user.organization_id)
        .single();

      if (orgError) throw orgError;

      setOrganization({
        ...org,
        type: org.type as "admin" | "client"
      });

      // Fetch organization members
      const { data: orgProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          tabs:user_tab_permissions(tab_name)
        `)
        .eq("organization_id", user.organization_id);

      if (profilesError) throw profilesError;
      setProfiles(orgProfiles || []);
    } catch (error) {
      console.error("Error fetching organization data:", error);
      toast.error("Kunne ikke hente organisasjonsdata");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAccessibleTabs = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_tab_permissions')
        .select('tab_name')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      const tabs = data.map(item => item.tab_name as TabName);
      setUserAccessibleTabs(tabs);
    } catch (error) {
      console.error('Error fetching user accessible tabs:', error);
    }
  };

  const handleAddMember = async (orgId: string, member: { 
    name: string; 
    email: string; 
    password: string;
    tabs: TabName[];
  }) => {
    try {
      // Create new user with auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email,
        password: member.password,
        options: {
          data: {
            name: member.name,
            role: 'client'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Kunne ikke opprette bruker');
      }

      // Update profile with organization id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          organization_id: orgId,
          role: 'client',
          name: member.name,
          email: member.email
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // Only assign tabs that the administrator has access to
      const filteredTabs = member.tabs.filter(tab => 
        userAccessibleTabs.includes(tab)
      );

      // Add tab permissions if there are any
      if (filteredTabs.length > 0) {
        const { error: tabError } = await supabase
          .from('user_tab_permissions')
          .insert(
            filteredTabs.map(tab_name => ({
              user_id: authData.user.id,
              tab_name: tab_name
            }))
          );

        if (tabError) throw tabError;
      }

      fetchOrganization(); // Refresh data
      toast.success("Medlem lagt til");
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Kunne ikke legge til medlem");
    }
  };

  const handleDeleteMember = async (profileId: string) => {
    try {
      // Don't allow users to delete themselves
      if (profileId === user?.id) {
        toast.error("Du kan ikke slette din egen konto");
        return;
      }
      
      const { error } = await supabase.rpc('delete_user', {
        user_id: profileId
      });

      if (error) throw error;
      
      fetchOrganization(); // Refresh data
      toast.success("Medlem fjernet");
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Kunne ikke fjerne medlem");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 mb-4" />
        <p className="text-muted-foreground">Laster administratorpanel...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-primary mb-2">Ingen organisasjon funnet</h2>
          <p className="text-gray-600">Du er ikke tilknyttet noen organisasjon eller mangler rettigheter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-montserrat text-primary">Administrér organisasjon</h1>
        <p className="text-muted-foreground">
          Administrer medlemmer og rettigheter i organisasjonen din.
        </p>
      </header>

      <div className="space-y-4">
        <OrganizationCard
          organization={organization}
          members={profiles}
          onUpdateBot={() => {}} // Disabled for client administrators
          onDeleteOrg={() => {}} // Disabled for client administrators
          onAddMember={handleAddMember}
          onDeleteMember={handleDeleteMember}
          hideControls={true} // Hide bot configuration and delete organization buttons
        />
      </div>
    </div>
  );
};
