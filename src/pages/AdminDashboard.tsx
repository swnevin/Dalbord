import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { AddOrganizationForm } from "@/components/admin/AddOrganizationForm";
import { OrganizationCard } from "@/components/admin/OrganizationCard";
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
  tabs?: { tab_name: Database["public"]["Enums"]["tab_type"] }[];
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [activeTab, setActiveTab] = useState("organizations");

  useEffect(() => {
    fetchOrganizations();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      setIsAdminUser(data.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Kunne ikke verifisere administratortilgang');
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("*");

      if (error) throw error;

      const transformedOrgs: Organization[] = (orgs || []).map(org => ({
        ...org,
        type: (org.type === 'admin' ? 'admin' : 'client') as Organization['type']
      }));

      setOrganizations(transformedOrgs);

      for (const org of transformedOrgs) {
        const { data: orgProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select(`
            *,
            tabs:user_tab_permissions(tab_name)
          `)
          .eq("organization_id", org.id);

        if (profilesError) throw profilesError;

        setProfiles(prev => ({
          ...prev,
          [org.id]: orgProfiles || []
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Kunne ikke hente organisasjoner");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert([{ 
          name,
          type: 'client' as Organization['type']
        }])
        .select()
        .single();

      if (error) throw error;

      const newOrg: Organization = {
        ...data,
        type: data.type === 'admin' ? 'admin' : 'client'
      };

      setOrganizations([...organizations, newOrg]);
      toast.success("Organisasjon opprettet");
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Kunne ikke opprette organisasjon");
    }
  };

  const handleAddMember = async (orgId: string, member: { 
    name: string; 
    email: string; 
    password: string;
    tabs: TabName[];
  }) => {
    try {
      if (!isAdminUser) {
        toast.error('Kun administratorer kan legge til medlemmer');
        return;
      }

      const hasAdminTab = member.tabs.includes("administrator");
      const hasOrganizationsTab = member.tabs.includes("organizations");
      const userIsAdmin = hasAdminTab || hasOrganizationsTab;

      // Store the current session before adding a new user
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email,
        password: member.password,
        options: {
          data: {
            name: member.name,
            role: userIsAdmin ? 'admin' : 'client'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Kunne ikke opprette bruker');
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          organization_id: orgId,
          role: userIsAdmin ? 'admin' : 'client',
          name: member.name,
          email: member.email
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      if (member.tabs.length > 0) {
        const { error: tabError } = await supabase
          .from('user_tab_permissions')
          .insert(
            member.tabs.map(tab_name => ({
              user_id: authData.user.id,
              tab_name: tab_name
            }))
          );

        if (tabError) throw tabError;
      }

      // Restore the original session to prevent being logged in as the new user
      if (currentSession) {
        await supabase.auth.setSession(currentSession);
      }

      const { data: updatedProfiles, error: fetchError } = await supabase
        .from("profiles")
        .select(`
          *,
          tabs:user_tab_permissions(tab_name)
        `)
        .eq("organization_id", orgId);

      if (fetchError) throw fetchError;

      setProfiles(prev => ({
        ...prev,
        [orgId]: updatedProfiles || []
      }));

      toast.success("Medlem lagt til. Du kan nå redigere tilgangene deres.");
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Kunne ikke legge til medlem");
      throw error;
    }
  };

  const handleUpdateBot = async (orgId: string, config: { apiKey: string; projectId: string }) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          voiceflow_api_key: config.apiKey,
          voiceflow_project_id: config.projectId
        })
        .eq("id", orgId);

      if (error) throw error;

      toast.success("Bot konfigurert");
    } catch (error) {
      console.error("Error updating bot config:", error);
      toast.error("Kunne ikke oppdatere bot konfigurasjon");
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      setOrganizations(organizations.filter(org => org.id !== orgId));
      toast.success("Organisasjon slettet");
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Kunne ikke slette organisasjon");
    }
  };

  const handleDeleteMember = async (profileId: string) => {
    try {
      if (!isAdminUser) {
        toast.error('Kun administratorer kan slette brukere');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;

      const { error: deleteError } = await supabase.rpc('delete_user', {
        user_id: profileId
      });

      if (deleteError) throw deleteError;

      if (profile.organization_id) {
        setProfiles(prev => ({
          ...prev,
          [profile.organization_id]: (prev[profile.organization_id] || []).filter(
            p => p.id !== profileId
          )
        }));
      }
      
      toast.success("Medlem fjernet");
    } catch (error: any) {
      console.error("Error removing member:", error);
      if (error.message === "Only administrators can delete users") {
        toast.error("Kun administratorer kan slette brukere");
      } else {
        toast.error("Kunne ikke fjerne medlem");
      }
    }
  };

  if (isLoading) {
    return <div>Laster...</div>;
  }

  const sortedOrganizations = [...organizations].sort((a, b) => {
    if (a.name === "Dalai") return -1;
    if (b.name === "Dalai") return 1;
    return 0;
  });

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar 
        role="admin" 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Organisasjoner</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-secondary text-primary hover:bg-secondary/90">
                <Plus className="mr-2 h-4 w-4" /> Legg til organisasjon
              </Button>
            </SheetTrigger>
            <SheetContent>
              <AddOrganizationForm onSubmit={handleCreateOrg} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-4">
          {sortedOrganizations.map((org) => {
            const isAdminOrg = org.name === "Dalai";
            
            return isAdminOrg ? (
              <div key={org.id} className="border-2 border-primary/20 rounded-lg p-2">
                <OrganizationCard
                  organization={org}
                  members={profiles[org.id] || []}
                  onUpdateBot={handleUpdateBot}
                  onDeleteOrg={handleDeleteOrg}
                  onAddMember={handleAddMember}
                  onDeleteMember={handleDeleteMember}
                  hideControls={true}
                />
              </div>
            ) : (
              <OrganizationCard
                key={org.id}
                organization={org}
                members={profiles[org.id] || []}
                onUpdateBot={handleUpdateBot}
                onDeleteOrg={handleDeleteOrg}
                onAddMember={handleAddMember}
                onDeleteMember={handleDeleteMember}
                hideControls={false}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
