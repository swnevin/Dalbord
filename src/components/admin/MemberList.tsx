
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string | null;
  tabs?: { tab_name: string }[];
}

interface MemberListProps {
  members: Profile[];
  onDeleteMember: (profileId: string) => Promise<void>;
}

const tabLabels: Record<string, string> = {
  organizations: "Organisasjoner",
  conversations: "Samtaler",
  knowledge: "Kunnskapsbase"
};

export const MemberList = ({ members, onDeleteMember }: MemberListProps) => {
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
      ))}
    </div>
  );
};
