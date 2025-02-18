
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type TabName = "organizations" | "conversations" | "knowledge";

interface AddMemberFormProps {
  organizationName: string;
  organizationType: "admin" | "client";
  onSubmit: (member: { 
    name: string; 
    email: string; 
    password: string;
    tabs: TabName[];  // Keep for interface compatibility
  }) => Promise<void>;
}

export const AddMemberForm = ({ 
  organizationName, 
  onSubmit 
}: AddMemberFormProps) => {
  const [member, setMember] = useState<{ 
    name: string; 
    email: string; 
    password: string;
  }>({ 
    name: "", 
    email: "", 
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // Pass empty tabs array since we'll set permissions later
      await onSubmit({ ...member, tabs: [] });
      // Reset form after successful submission
      setMember({ name: "", email: "", password: "" });
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsSubmitting(false);
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
        <Button 
          className="w-full bg-secondary text-primary hover:bg-secondary/90"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Legger til...' : 'Legg til'}
        </Button>
      </div>
    </>
  );
};
