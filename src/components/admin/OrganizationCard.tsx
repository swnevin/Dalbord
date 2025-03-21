import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Trash2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { AddMemberForm } from "./AddMemberForm";
import { MemberList } from "./MemberList";

type TabName = Database["public"]["Enums"]["tab_type"];

interface Organization {
  id: string;
  name: string;
  voiceflow_api_key?: string;
  voiceflow_project_id?: string;
  type?: "admin" | "client";
}

interface Profile {
  id: string;
  name: string;
  email: string;
  organization_id: string | null;
  tabs?: { tab_name: Database["public"]["Enums"]["tab_type"] }[];
}

interface OrganizationCardProps {
  organization: Organization;
  members: Profile[];
  onUpdateBot: (orgId: string, config: { apiKey: string; projectId: string }) => Promise<void>;
  onDeleteOrg: (orgId: string) => Promise<void>;
  onAddMember: (orgId: string, member: { 
    name: string; 
    email: string; 
    password: string;
    tabs: TabName[];
  }) => Promise<void>;
  onDeleteMember: (profileId: string) => Promise<void>;
  hideControls?: boolean;
}

export const OrganizationCard = ({
  organization,
  members,
  onUpdateBot,
  onDeleteOrg,
  onAddMember,
  onDeleteMember,
  hideControls = false,
}: OrganizationCardProps) => {
  const [botConfig, setBotConfig] = useState({
    apiKey: organization.voiceflow_api_key || "",
    projectId: organization.voiceflow_project_id || ""
  });

  useEffect(() => {
    setBotConfig({
      apiKey: organization.voiceflow_api_key || "",
      projectId: organization.voiceflow_project_id || ""
    });
  }, [organization]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-primary mb-2">
            {organization.name}
          </h3>
          <p className="text-gray-600">
            {members.length} {members.length === 1 ? "medlem" : "medlemmer"}
          </p>
        </div>
        {!hideControls && (
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
                    Koble en Voiceflow chatbot til {organization.name}.
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
                    onClick={() => onUpdateBot(organization.id, botConfig)}
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
                    onClick={() => onDeleteOrg(organization.id)}
                  >
                    Slett
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

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
              <AddMemberForm 
                organizationName={organization.name}
                organizationType={organization.type || "client"}
                onSubmit={(member) => onAddMember(organization.id, member)}
              />
            </SheetContent>
          </Sheet>
        </div>
        <MemberList 
          members={members}
          onDeleteMember={onDeleteMember}
          organizationType={organization.type || "client"}
        />
      </div>
    </div>
  );
};
