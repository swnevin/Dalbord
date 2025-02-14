
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, LogIn } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface Member {
  id: number;
  name: string;
  email: string;
}

interface Organization {
  id: number;
  name: string;
  members: Member[];
}

const AdminDashboard = () => {
  const [organizations] = useState<Organization[]>([
    {
      id: 1,
      name: "Test Organisasjon",
      members: [
        { id: 1, name: "Jon Doe", email: "jon@test.no" },
        { id: 2, name: "Jane Smith", email: "jane@test.no" },
      ],
    },
    {
      id: 2,
      name: "Annen Organisasjon",
      members: [
        { id: 3, name: "Per Hansen", email: "per@test.no" },
      ],
    },
  ]);

  const [newOrg, setNewOrg] = useState({ name: "" });

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar role="admin" />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Klientorganisasjoner</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-secondary text-primary hover:bg-secondary/90">
                <Plus className="mr-2 h-4 w-4" /> Legg til organisasjon
              </Button>
            </SheetTrigger>
            <SheetContent>
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
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  />
                </div>
                <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
                  Lagre
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    {org.name}
                  </h3>
                  <p className="text-gray-600">
                    {org.members.length} {org.members.length === 1 ? "medlem" : "medlemmer"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <LogIn className="h-4 w-4" />
                  </Button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Rediger organisasjon</SheetTitle>
                        <SheetDescription>
                          Oppdater informasjonen for {org.name}.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Organisasjonsnavn</label>
                          <Input
                            placeholder="Skriv navn..."
                            defaultValue={org.name}
                          />
                        </div>
                        <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
                          Lagre endringer
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Members List */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Medlemmer</h4>
                <div className="space-y-2">
                  {org.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-primary">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
