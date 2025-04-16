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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

import { MemberPreviewButton } from "./MemberPreviewButton";

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
  organizationType: "admin" | "client";
}

const tabDisplay: Record<string, string> = {
  home: "Hjem",
  conversations: "Samtaler",
  knowledge: "Kunnskapsbase",
  statistics: "Statistikk",
  administrator: "Administrator",
  organizations: "Organisasjoner",
};

export const MemberList = ({
  members,
  onDeleteMember,
  organizationType,
}: MemberListProps) => {
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {members.map((member) => (
        <div key={member.id} className="flex justify-between items-center py-2 px-3 rounded-md hover:bg-muted">
          <div className="flex-1">
            <p className="text-sm font-medium">{member.name || "Ukjent navn"}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
            {member.tabs && member.tabs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {member.tabs.map((tab) => (
                  <span
                    key={tab.tab_name}
                    className="px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary text-[10px]"
                  >
                    {tabDisplay[tab.tab_name as keyof typeof tabDisplay] || tab.tab_name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <MemberPreviewButton 
              memberEmail={member.email}
              memberId={member.id}
              organizationId={member.organization_id || ""}
              memberTabs={member.tabs || []}
              organizationType={organizationType}
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dette vil slette medlemmet fra organisasjonen. Denne handlingen kan ikke angres.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => onDeleteMember(member.id)}
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
