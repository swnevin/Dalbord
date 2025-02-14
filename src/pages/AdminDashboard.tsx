
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, LogIn } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  memberCount: number;
}

const AdminDashboard = () => {
  const [organizations] = useState<Organization[]>([
    { id: 1, name: "test org", memberCount: 1 },
    { id: 2, name: "test org 2", memberCount: 1 },
  ]);

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar role="admin" />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Klientorganisasjoner</h1>
          <Button className="bg-secondary text-primary hover:bg-secondary/90">
            <Plus className="mr-2 h-4 w-4" /> Legg til organisasjon
          </Button>
        </div>

        <div className="space-y-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    {org.name}
                  </h3>
                  <p className="text-gray-600">
                    {org.memberCount} {org.memberCount === 1 ? "medlem" : "medlemmer"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <LogIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
