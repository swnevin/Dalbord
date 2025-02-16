
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  const [newOrg, setNewOrg] = useState({ name: "" });
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "" });
  const [botConfig, setBotConfig] = useState({ apiKey: "", projectId: "" });
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
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

  const handleCreateOrg = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert([{ name: newOrg.name }])
        .select()
        .single();

      if (error) throw error;

      setOrganizations([...organizations, data]);
      setNewOrg({ name: "" });
      toast.success("Organisasjon opprettet");
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Kunne ikke opprette organisasjon");
    }
  };

  const handleAddMember = async (orgId: string) => {
    try {
      // Create auth user with role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMember.email,
        password: newMember.password,
        options: {
          data: {
            name: newMember.name,
            role: 'client'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with organization_id
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            organization_id: orgId,
            role: 'client'  // Explicitly set role in profiles table
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Refresh profiles for this organization
        const { data: updatedProfiles, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("organization_id", orgId);

        if (fetchError) throw fetchError;

        setProfiles(prev => ({
          ...prev,
          [orgId]: updatedProfiles || []
        }));

        setNewMember({ name: "", email: "", password: "" });
        toast.success("Medlem lagt til");
      }
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Kunne ikke legge til medlem");
    }
  };

  const handleUpdateBot = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          voiceflow_api_key: botConfig.apiKey,
          voiceflow_project_id: botConfig.projectId
        })
        .eq("id", orgId);

      if (error) throw error;

      setBotConfig({ apiKey: "", projectId: "" });
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

  const handleDeleteMember = async (profileId: string, orgId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ organization_id: null })
        .eq("id", profileId);

      if (error) throw error;

      setProfiles(prev => ({
        ...prev,
        [orgId]: prev[orgId].filter(profile => profile.id !== profileId)
      }));
      
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
              <SheetHeader>
                <SheetTitle>Legg til ny organisasjon</SheetTitle>
                <SheetDescription>
                  Fyll ut informasjonen under for å opprette en ny organisasjon.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organisasjonsnavn</label>
                  <Input
                    placeholder="Skriv navn..."
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full bg-secondary text-primary hover:bg-secondary/90"
                  onClick={handleCreateOrg}
                >
                  Lagre
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    {org.name}
                  </h3>
                  <p className="text-gray-600">
                    {profiles[org.id]?.length || 0} {(profiles[org.id]?.length || 0) === 1 ? "medlem" : "medlemmer"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Bot className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Konfigurer chatbot</SheetTitle>
                        <SheetDescription>
                          Koble en Voiceflow chatbot til {org.name}.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Voiceflow API Nøkkel</label>
                          <Input
                            placeholder="VF.xxxxxx.xxxxx"
                            value={botConfig.apiKey}
                            onChange={(e) => setBotConfig({ ...botConfig, apiKey: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Voiceflow Prosjekt ID</label>
                          <Input
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            value={botConfig.projectId}
                            onChange={(e) => setBotConfig({ ...botConfig, projectId: e.target.value })}
                          />
                        </div>
                        <Button 
                          className="w-full bg-secondary text-primary hover:bg-secondary/90"
                          onClick={() => handleUpdateBot(org.id)}
                        >
                          Lagre
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dette vil slette organisasjonen og all tilhørende data. Denne handlingen kan ikke angres.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDeleteOrg(org.id)}
                        >
                          Slett
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Members List */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-500">Medlemmer</h4>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Legg til medlem
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Legg til nytt medlem</SheetTitle>
                        <SheetDescription>
                          Fyll ut informasjonen under for å legge til et nytt medlem i {org.name}.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Navn</label>
                          <Input
                            placeholder="Skriv navn..."
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">E-post</label>
                          <Input
                            type="email"
                            placeholder="navn@eksempel.no"
                            value={newMember.email}
                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Passord</label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={newMember.password}
                            onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                          />
                        </div>
                        <Button 
                          className="w-full bg-secondary text-primary hover:bg-secondary/90"
                          onClick={() => handleAddMember(org.id)}
                        >
                          Legg til
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <div className="space-y-2">
                  {profiles[org.id]?.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-primary">{profile.name}</p>
                        <p className="text-sm text-gray-500">{profile.email}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Dette vil fjerne {profile.name} fra organisasjonen. Denne handlingen kan ikke angres.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDeleteMember(profile.id, org.id)}
                            >
                              Slett
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
