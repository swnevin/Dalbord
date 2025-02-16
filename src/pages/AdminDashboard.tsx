
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

interface Organization {
  id: string;
  name: string;
  voiceflow_api_key?: string;
  voiceflow_project_id?: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string | null;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("*");

      if (error) throw error;

      setOrganizations(orgs || []);

      // Fetch profiles for each organization
      for (const org of orgs || []) {
        const { data: orgProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
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
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;

      setOrganizations([...organizations, data]);
      toast.success("Organisasjon opprettet");
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Kunne ikke opprette organisasjon");
    }
  };

  const handleAddMember = async (orgId: string, member: { name: string; email: string; password: string }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email,
        password: member.password,
        options: {
          data: {
            name: member.name,
            role: 'client'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            organization_id: orgId,
            role: 'client'
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        const { data: updatedProfiles, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("organization_id", orgId);

        if (fetchError) throw fetchError;

        setProfiles(prev => ({
          ...prev,
          [orgId]: updatedProfiles || []
        }));

        toast.success("Medlem lagt til");
      }
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Kunne ikke legge til medlem");
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
      const { error } = await supabase
        .from("profiles")
        .update({ organization_id: null })
        .eq("id", profileId);

      if (error) throw error;

      setProfiles(prev => {
        const newProfiles = { ...prev };
        Object.keys(newProfiles).forEach(orgId => {
          newProfiles[orgId] = newProfiles[orgId].filter(
            profile => profile.id !== profileId
          );
        });
        return newProfiles;
      });
      
      toast.success("Medlem fjernet");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Kunne ikke fjerne medlem");
    }
  };

  if (isLoading) {
    return <div>Laster...</div>;
  }

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar role="admin" />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Klientorganisasjoner</h1>
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
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              members={profiles[org.id] || []}
              onUpdateBot={handleUpdateBot}
              onDeleteOrg={handleDeleteOrg}
              onAddMember={handleAddMember}
              onDeleteMember={handleDeleteMember}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
