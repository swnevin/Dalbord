
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type TabName = "organizations" | "conversations" | "knowledge";

interface AddMemberFormProps {
  organizationName: string;
  organizationType: "admin" | "client";
  onSubmit: (member: { 
    name: string; 
    email: string; 
    password: string;
    tabs: TabName[];
  }) => Promise<void>;
}

export const AddMemberForm = ({ 
  organizationName, 
  organizationType,
  onSubmit 
}: AddMemberFormProps) => {
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
  const [error, setError] = useState("");

  const handleTabChange = (tabName: TabName, checked: boolean) => {
    setMember(prev => ({
      ...prev,
      tabs: checked 
        ? [...prev.tabs, tabName]
        : prev.tabs.filter(t => t !== tabName)
    }));
    setError("");
  };

  const handleSubmit = async () => {
    if (member.tabs.length === 0) {
      setError("Velg minst én fane");
      return;
    }
    await onSubmit(member);
    setMember({ name: "", email: "", password: "", tabs: [] });
    setError("");
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
        <div className="space-y-2">
          <label className="text-sm font-medium">Tilgang til faner</label>
          <div className="space-y-3 mt-2">
            {organizationType === "admin" ? (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="organizations"
                  checked={member.tabs.includes("organizations")}
                  onCheckedChange={(checked) => 
                    handleTabChange("organizations", checked as boolean)
                  }
                />
                <Label htmlFor="organizations">Organisasjoner</Label>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="conversations"
                    checked={member.tabs.includes("conversations")}
                    onCheckedChange={(checked) => 
                      handleTabChange("conversations", checked as boolean)
                    }
                  />
                  <Label htmlFor="conversations">Samtaler</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="knowledge"
                    checked={member.tabs.includes("knowledge")}
                    onCheckedChange={(checked) => 
                      handleTabChange("knowledge", checked as boolean)
                    }
                  />
                  <Label htmlFor="knowledge">Kunnskapsbase</Label>
                </div>
              </>
            )}
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
        <Button 
          className="w-full bg-secondary text-primary hover:bg-secondary/90"
          onClick={handleSubmit}
        >
          Legg til
        </Button>
      </div>
    </>
  );
};
