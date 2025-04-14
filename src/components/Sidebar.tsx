
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users,
  MessageSquare,
  BookOpen,
  LineChart,
  Home,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  role: "admin" | "client";
  onTabChange: (tab: string) => void;
  activeTab: string;
  onCollapsedChange: (collapsed: boolean) => void;
}

type TabName = "organizations" | "conversations" | "knowledge" | "statistics" | "home" | "administrator";

const Sidebar = ({ role, onTabChange, activeTab, onCollapsedChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const { user } = useAuth();
  const [permittedTabs, setPermittedTabs] = useState<TabName[]>([]);

  const adminLinks = [
    { icon: Users, label: "Organisasjoner", value: "organizations" as TabName },
  ];

  const clientLinks = [
    { icon: Home, label: "Hjem", value: "home" as TabName },
    { icon: MessageSquare, label: "Samtaler", value: "conversations" as TabName },
    { icon: BookOpen, label: "Kunnskapsbase", value: "knowledge" as TabName },
    { icon: LineChart, label: "Statistikk", value: "statistics" as TabName },
    { icon: Shield, label: "Administrator", value: "administrator" as TabName },
  ];

  const allLinks = role === "admin" ? adminLinks : clientLinks;

  useEffect(() => {
    const fetchPermittedTabs = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_tab_permissions')
          .select('tab_name')
          .eq('user_id', user.id);

        if (error) throw error;

        const tabs = data.map(item => item.tab_name as TabName);
        setPermittedTabs(tabs);

        if (tabs.length > 0 && !tabs.includes(activeTab as TabName)) {
          onTabChange(tabs[0]);
        }
      } catch (error) {
        console.error('Error fetching tab permissions:', error);
      }
    };

    fetchPermittedTabs();
  }, [user, activeTab, onTabChange]);

  const links = allLinks.filter(link => permittedTabs.includes(link.value));

  const handleMouseEnter = () => {
    setCollapsed(false);
    onCollapsedChange(false);
  };

  const handleMouseLeave = () => {
    setCollapsed(true);
    onCollapsedChange(true);
  };

  return (
    <div
      className={cn(
        "fixed top-12 left-0 bottom-0 bg-primary text-white transition-all duration-300 flex flex-col z-10",
        collapsed ? "w-14" : "w-56"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex-1 pt-4">
        <nav className="flex flex-col space-y-1 px-2">
          <TooltipProvider delayDuration={300}>
            {links.map((link) => (
              <Tooltip key={link.value}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 text-white hover:bg-white/10 active:bg-white/20 h-9",
                      activeTab === link.value && "bg-secondary text-primary hover:bg-secondary",
                      collapsed && "px-0 justify-center"
                    )}
                    onClick={() => onTabChange(link.value)}
                  >
                    <link.icon size={18} />
                    {!collapsed && <span className="text-sm">{link.label}</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {link.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
