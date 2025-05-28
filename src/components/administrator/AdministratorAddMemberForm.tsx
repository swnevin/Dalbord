
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Database } from "@/integrations/supabase/types";

type TabName = Database["public"]["Enums"]["tab_type"];

interface AdministratorAddMemberFormProps {
  organizationName: string;
  userAccessibleTabs: TabName[];
  onSubmit: (member: { 
    name: string; 
    email: string; 
    password: string;
    tabs: TabName[];
  }) => Promise<void>;
}

const tabLabels: Record<TabName, string> = {
  organizations: "Organisasjoner",
  conversations: "Samtaler",
  knowledge: "Kunnskapsbase",
  statistics: "Statistikk",
  home: "Hjem",
  administrator: "Administrator"
};

export const AdministratorAddMemberForm = ({ 
  organizationName,
  userAccessibleTabs,
  onSubmit 
}: AdministratorAddMemberFormProps) => {
  const [member, setMember] = useState<{ 
    name: string; 
    email: string; 
    password: string;
    tabs: TabName[];
  }>({ 
    name: "", 
    email: "", 
    password: "",
    tabs: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side tabs filtering
  const availableTabs: TabName[] = ["home", "conversations", "knowledge", "statistics", "administrator"]
    .filter(tab => userAccessibleTabs.includes(tab as TabName)) as TabName[];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(member);
      // Reset form after successful submission
      setMember({ name: "", email: "", password: "", tabs: [] });
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabToggle = (tab: TabName, checked: boolean) => {
    if (checked) {
      setMember({ ...member, tabs: [...member.tabs, tab] });
    } else {
      setMember({ ...member, tabs: member.tabs.filter(t => t !== tab) });
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Legg til nytt medlem</SheetTitle>
        <SheetDescription>
          Fyll ut informasjonen under for å legge til et nytt medlem i {organizationName}.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Navn</label>
          <Input
            placeholder="Skriv navn..."
            value={member.name}
            onChange={(e) => setMember({ ...member, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">E-post</label>
          <Input
            type="email"
            placeholder="navn@eksempel.no"
            value={member.email}
            onChange={(e) => setMember({ ...member, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Passord</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={member.password}
            onChange={(e) => setMember({ ...member, password: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>Tilgang til faner</Label>
          <div className="space-y-3 p-4 rounded-md border bg-gray-50">
            {availableTabs.map((tab) => (
              <div key={tab} className="flex items-center space-x-2">
                <Checkbox 
                  id={`tab-${tab}`}
                  checked={member.tabs.includes(tab)}
                  onCheckedChange={(checked) => 
                    handleTabToggle(tab, checked as boolean)
                  }
                />
                <Label htmlFor={`tab-${tab}`} className="font-medium">
                  {tabLabels[tab]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          className="w-full bg-dalai-yellow text-primary hover:bg-dalai-yellow/90"
          onClick={handleSubmit}
          disabled={isSubmitting || !member.name || !member.email || !member.password}
        >
          {isSubmitting ? 'Legger til...' : 'Legg til'}
        </Button>
      </div>
    </>
  );
};
