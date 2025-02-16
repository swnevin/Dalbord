
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface AddMemberFormProps {
  organizationName: string;
  onSubmit: (member: { name: string; email: string; password: string }) => Promise<void>;
}

export const AddMemberForm = ({ organizationName, onSubmit }: AddMemberFormProps) => {
  const [member, setMember] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async () => {
    await onSubmit(member);
    setMember({ name: "", email: "", password: "" });
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
        >
          Legg til
        </Button>
      </div>
    </>
  );
};
