import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SidebarProps {
  role: "admin" | "client";
}

const Sidebar = ({ role }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  const adminLinks = [
    { icon: Users, label: "Organisasjoner", path: "/admin" },
  ];

  const clientLinks = [
    { icon: MessageSquare, label: "Samtaler", path: "/client/conversations" },
  ];

  const links = role === "admin" ? adminLinks : clientLinks;

  return (
    <div
      className={cn(
        "h-screen bg-primary text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <h1 className={cn("font-bold text-xl", collapsed && "hidden")}>DALAI</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-white/10"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <div className="flex-1 p-4">
        <Tabs defaultValue={links[0].path} orientation="vertical" className="w-full">
          <TabsList className="flex flex-col h-auto bg-transparent space-y-2">
            {links.map((link) => (
              <TabsTrigger
                key={link.path}
                value={link.path}
                className="w-full justify-start gap-3 text-white data-[state=active]:bg-secondary data-[state=active]:text-primary"
              >
                <link.icon size={20} />
                {!collapsed && <span>{link.label}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 text-white hover:bg-white/10"
          onClick={logout}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logg ut</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
