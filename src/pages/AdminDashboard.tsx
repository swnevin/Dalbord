
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, LogIn, Bot } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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

interface Member {
  id: number;
  name: string;
  email: string;
}

interface Organization {
  id: number;
  name: string;
  members: Member[];
  botConfig?: {
    apiKey: string;
    projectId: string;
  };
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
  const [newMember, setNewMember] = useState({ name: "", email: "" });
  const [botConfig, setBotConfig] = useState({ apiKey: "", projectId: "" });

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
                        <Bot className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Konfigurer chatbot</SheetTitle>
                        <SheetDescription>
                          Koble en Voiceflow chatbot til {org.name}.
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
                        <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
                          Lagre
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
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
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600">
                          Slett
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Members List */}
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
                      <SheetHeader>
                        <SheetTitle>Legg til nytt medlem</SheetTitle>
                        <SheetDescription>
                          Fyll ut informasjonen under for å legge til et nytt medlem i {org.name}.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Navn</label>
                          <Input
                            placeholder="Skriv navn..."
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">E-post</label>
                          <Input
                            type="email"
                            placeholder="navn@eksempel.no"
                            value={newMember.email}
                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          />
                        </div>
                        <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
                          Legg til
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <div className="space-y-2">
                  {org.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-primary">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
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
                              Dette vil fjerne {member.name} fra organisasjonen. Denne handlingen kan ikke angres.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-500 hover:bg-red-600">
                              Slett
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
