
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
  BarChart3,
  Bookmark,
  Database,
  AlertTriangle,
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "client";
}

const Sidebar = ({ role }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  const adminLinks = [
    { icon: Users, label: "Klienter", path: "/admin" },
  ];

  const clientLinks = [
    { icon: BarChart3, label: "Statistikk", path: "/client/statistics" },
    { icon: MessageSquare, label: "Samtaler", path: "/client/conversations" },
    { icon: Bookmark, label: "Bokmerker", path: "/client/bookmarks" },
    { icon: Database, label: "Kunnskapsbase", path: "/client/knowledge" },
    { icon: AlertTriangle, label: "Feilmeldinger", path: "/client/errors" },
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

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.path}
            className="sidebar-link text-white hover:bg-white/10"
          >
            <link.icon size={20} />
            {!collapsed && <span>{link.label}</span>}
          </a>
        ))}
      </nav>

      <Button
        variant="ghost"
        className="m-4 flex items-center gap-2 text-white hover:bg-white/10"
        onClick={logout}
      >
        <LogOut size={20} />
        {!collapsed && <span>Logg ut</span>}
      </Button>
    </div>
  );
};

export default Sidebar;
