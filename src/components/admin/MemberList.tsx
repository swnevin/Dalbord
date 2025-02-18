
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TabName = "organizations" | "conversations" | "knowledge";

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
  organizationType: "admin" | "client";
}

const tabLabels: Record<TabName, string> = {
  organizations: "Organisasjoner",
  conversations: "Samtaler",
  knowledge: "Kunnskapsbase"
};

export const MemberList = ({ members, onDeleteMember, organizationType }: MemberListProps) => {
  const [editingMember, setEditingMember] = useState<{
    id: string;
    name: string;
    tabs: TabName[];
  } | null>(null);

  const handleEditClick = (profile: Profile) => {
    setEditingMember({
      id: profile.id,
      name: profile.name || "",
      tabs: profile.tabs?.map(t => t.tab_name) || []
    });
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    try {
      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: editingMember.name })
        .eq('id', editingMember.id);

      if (profileError) throw profileError;

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_tab_permissions')
        .delete()
        .eq('user_id', editingMember.id);

      if (deleteError) throw deleteError;

      // Insert new permissions with correct typing
      const { error: insertError } = await supabase
        .from('user_tab_permissions')
        .insert(
          editingMember.tabs.map(tab_name => ({
            user_id: editingMember.id,
            tab_name: tab_name
          }))
        );

      if (insertError) throw insertError;

      toast.success('Medlem oppdatert');
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Kunne ikke oppdatere medlem');
    }
  };

  return (
    <div className="space-y-2">
      {members.map((profile) => (
        <div key={profile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
          <div className="space-y-1">
            <p className="font-medium text-primary">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.tabs?.map((tab) => (
                <span 
                  key={tab.tab_name}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tabLabels[tab.tab_name]}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => handleEditClick(profile)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Rediger medlem</SheetTitle>
                  <SheetDescription>
                    Oppdater informasjonen for {profile.name}
                  </SheetDescription>
                </SheetHeader>
                {editingMember && (
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label>Navn</Label>
                      <Input
                        value={editingMember.name}
                        onChange={(e) => setEditingMember({
                          ...editingMember,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tilgang til faner</Label>
                      <div className="space-y-3">
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
                            <Label htmlFor="organizations">Organisasjoner</Label>
                          </div>
                        ) : (
                          <>
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
                              <Label htmlFor="conversations">Samtaler</Label>
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
                              <Label htmlFor="knowledge">Kunnskapsbase</Label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-secondary text-primary hover:bg-secondary/90"
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
