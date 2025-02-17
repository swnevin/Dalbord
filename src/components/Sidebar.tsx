
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "react-router-dom";
import {
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  BookOpen,
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "client";
}

const Sidebar = ({ role }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { icon: Users, label: "Organisasjoner", path: "/admin" },
  ];

  const clientLinks = [
    { icon: MessageSquare, label: "Samtaler", path: "/client/conversations" },
    { icon: BookOpen, label: "Kunnskapsbase", path: "/client/knowledge" },
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
        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive ? "bg-secondary text-primary" : "text-white hover:bg-white/10"
                )}
              >
                <Icon size={20} />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
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
