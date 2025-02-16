
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface AddOrganizationFormProps {
  onSubmit: (name: string) => Promise<void>;
}

export const AddOrganizationForm = ({ onSubmit }: AddOrganizationFormProps) => {
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    await onSubmit(name);
    setName("");
  };

  return (
    <>
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
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button 
          className="w-full bg-secondary text-primary hover:bg-secondary/90"
          onClick={handleSubmit}
        >
          Lagre
        </Button>
      </div>
    </>
  );
};
