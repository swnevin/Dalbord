
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Eye } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

type TabName = Database["public"]["Enums"]["tab_type"];

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string | null;
  tabs?: { tab_name: TabName }[];
}

interface MemberListProps {
  members: Profile[];
  onDeleteMember: (profileId: string) => Promise<void>;
  onMemberUpdated?: () => Promise<void>;
  organizationType: "admin" | "client";
  hidePreviewButton?: boolean;
}

const tabLabels: Record<TabName, string> = {
  organizations: "Organisasjoner",
  conversations: "Samtaler",
  knowledge: "Kunnskapsbase",
  statistics: "Statistikk",
  home: "Hjem",
  administrator: "Administrator"
};

export const MemberList = ({ 
  members, 
  onDeleteMember, 
  onMemberUpdated,
  organizationType,
  hidePreviewButton = false
}: MemberListProps) => {
  const [editingMember, setEditingMember] = useState<{
    id: string;
    tabs: TabName[];
  } | null>(null);
  
  const { enterPreviewMode } = useAuth();

  const handleEditClick = (profile: Profile) => {
    setEditingMember({
      id: profile.id,
      tabs: profile.tabs?.map(t => t.tab_name) || []
    });
  };

  const handlePreviewClick = (profile: Profile) => {
    if (!profile.organization_id) {
      toast.error("Denne brukeren er ikke tilknyttet en organisasjon");
      return;
    }
    
    const memberTabs = profile.tabs?.map(t => t.tab_name as TabName) || [];
    
    enterPreviewMode({
      id: profile.id,
      email: profile.email,
      organization_id: profile.organization_id,
      tabs: memberTabs
    });
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    try {
      console.log('Updating member:', editingMember.id, 'with tabs:', editingMember.tabs);
      
      // Check if the member is being given admin privileges
      const hasAdminTab = editingMember.tabs.includes("administrator");
      const hasOrganizationsTab = editingMember.tabs.includes("organizations");
      const isAdmin = hasAdminTab || hasOrganizationsTab;
      
      console.log('Member will have admin role:', isAdmin);
      
      // Update user role if they have admin tabs or if admin privileges are removed
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: isAdmin ? 'admin' : 'client' })
        .eq('id', editingMember.id);
        
      if (roleError) {
        console.error('Role update error:', roleError);
        throw roleError;
      }

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_tab_permissions')
        .delete()
        .eq('user_id', editingMember.id);

      if (deleteError) {
        console.error('Delete permissions error:', deleteError);
        throw deleteError;
      }

      // Insert new permissions
      if (editingMember.tabs.length > 0) {
        const permissionsToInsert = editingMember.tabs.map(tab_name => ({
          user_id: editingMember.id,
          tab_name: tab_name
        }));
        
        console.log('Inserting permissions:', permissionsToInsert);
        
        const { error: insertError } = await supabase
          .from('user_tab_permissions')
          .insert(permissionsToInsert);

        if (insertError) {
          console.error('Insert permissions error:', insertError);
          throw insertError;
        }
      }

      console.log('Member update successful, refreshing data...');
      
      // Call the callback to refresh data in parent component
      if (onMemberUpdated) {
        await onMemberUpdated();
      }

      toast.success('Medlem oppdatert');
      setEditingMember(null);
    } catch (error: any) {
      console.error('Error updating member:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Kunne ikke oppdatere medlem';
      
      if (error?.message?.includes('row-level security')) {
        errorMessage = 'Ingen tilgang til å oppdatere tilganger. Sjekk brukerrettigheter.';
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = 'Ugyldig bruker-ID. Prøv å oppdatere siden.';
      } else if (error?.message?.includes('violates not-null')) {
        errorMessage = 'Manglende obligatorisk informasjon. Kontakt support.';
      } else if (error?.code) {
        errorMessage = `Database-feil (${error.code}): ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  // Check if the organization is the Dalai admin org
  const isDalaiAdminOrg = organizationType === "admin";

  return (
    <div className="space-y-2">
      {members.map((profile) => (
        <div key={profile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
          <div className="space-y-1">
            <p className="font-medium text-primary">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            {profile.tabs && profile.tabs.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.tabs.map((tab) => (
                  <span 
                    key={tab.tab_name}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#28483F]/10 text-[#28483F]"
                  >
                    {tabLabels[tab.tab_name]}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mt-2">Ingen tilganger</p>
            )}
          </div>
          <div className="flex gap-2">
            {!hidePreviewButton && !isDalaiAdminOrg && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#E2B808] hover:text-[#E2B808]/80 hover:bg-[#E2B808]/10"
                      onClick={() => handlePreviewClick(profile)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Forhåndsvisning som medlem</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#28483F] hover:text-[#28483F]/80 hover:bg-[#28483F]/10"
                  onClick={() => handleEditClick(profile)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Rediger tilganger</SheetTitle>
                  <SheetDescription>
                    Oppdater tilgangene for {profile.name}
                  </SheetDescription>
                </SheetHeader>
                {editingMember && (
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label>Tilgang til faner</Label>
                      <div className="space-y-3 p-4 rounded-md border bg-gray-50">
                        {organizationType === "admin" ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="organizations"
                              checked={editingMember.tabs.includes("organizations")}
                              onCheckedChange={(checked) => {
                                setEditingMember({
                                  ...editingMember,
                                  tabs: checked 
                                    ? [...editingMember.tabs, "organizations"]
                                    : editingMember.tabs.filter(t => t !== "organizations")
                                });
                              }}
                            />
                            <Label htmlFor="organizations" className="font-medium">
                              Organisasjoner
                            </Label>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="home"
                                checked={editingMember.tabs.includes("home")}
                                onCheckedChange={(checked) => {
                                  setEditingMember({
                                    ...editingMember,
                                    tabs: checked 
                                      ? [...editingMember.tabs, "home"]
                                      : editingMember.tabs.filter(t => t !== "home")
                                  });
                                }}
                              />
                              <Label htmlFor="home" className="font-medium">
                                Hjem
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="conversations"
                                checked={editingMember.tabs.includes("conversations")}
                                onCheckedChange={(checked) => {
                                  setEditingMember({
                                    ...editingMember,
                                    tabs: checked 
                                      ? [...editingMember.tabs, "conversations"]
                                      : editingMember.tabs.filter(t => t !== "conversations")
                                  });
                                }}
                              />
                              <Label htmlFor="conversations" className="font-medium">
                                Samtaler
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="knowledge"
                                checked={editingMember.tabs.includes("knowledge")}
                                onCheckedChange={(checked) => {
                                  setEditingMember({
                                    ...editingMember,
                                    tabs: checked 
                                      ? [...editingMember.tabs, "knowledge"]
                                      : editingMember.tabs.filter(t => t !== "knowledge")
                                  });
                                }}
                              />
                              <Label htmlFor="knowledge" className="font-medium">
                                Kunnskapsbase
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="statistics"
                                checked={editingMember.tabs.includes("statistics")}
                                onCheckedChange={(checked) => {
                                  setEditingMember({
                                    ...editingMember,
                                    tabs: checked 
                                      ? [...editingMember.tabs, "statistics"]
                                      : editingMember.tabs.filter(t => t !== "statistics")
                                  });
                                }}
                              />
                              <Label htmlFor="statistics" className="font-medium">
                                Statistikk
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="administrator"
                                checked={editingMember.tabs.includes("administrator")}
                                onCheckedChange={(checked) => {
                                  setEditingMember({
                                    ...editingMember,
                                    tabs: checked 
                                      ? [...editingMember.tabs, "administrator"]
                                      : editingMember.tabs.filter(t => t !== "administrator")
                                  });
                                }}
                              />
                              <Label htmlFor="administrator" className="font-medium">
                                Administrator
                              </Label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-[#E2B808] text-[#28483F] hover:bg-[#E2B808]/90"
                      onClick={handleUpdateMember}
                    >
                      Lagre endringer
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
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
                    onClick={() => onDeleteMember(profile.id)}
                  >
                    Slett
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};
