
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

interface SidebarProps {
  role: "admin" | "client";
  onTabChange: (tab: string) => void;
  activeTab: string;
  onCollapsedChange: (collapsed: boolean) => void;
}

type TabName = "organizations" | "conversations" | "knowledge" | "statistics" | "home" | "administrator";

const Sidebar = ({ role, onTabChange, activeTab, onCollapsedChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const { user, previewUser, isInPreviewMode } = useAuth();
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
      if (isInPreviewMode && previewUser) {
        // Use the preview user's permitted tabs directly
        setPermittedTabs(previewUser.tabs as TabName[]);
        
        // If the current active tab is not permitted, change to first permitted tab
        if (previewUser.tabs.length > 0 && !previewUser.tabs.includes(activeTab as TabName)) {
          onTabChange(previewUser.tabs[0]);
        }
        return;
      }
      
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
  }, [user, activeTab, onTabChange, isInPreviewMode, previewUser]);

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
        "h-[calc(100vh-2.5rem)] bg-white border-r text-primary transition-all duration-300 flex flex-col fixed left-0 top-10 z-10",
        collapsed ? "w-12" : "w-48"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex-1 p-2">
        <nav className="flex flex-col space-y-1">
          {links.map((link) => (
            <Button
              key={link.value}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 text-primary hover:bg-muted/50 active:bg-muted h-9",
                activeTab === link.value && "bg-muted font-medium",
                collapsed && "px-0 justify-center"
              )}
              onClick={() => onTabChange(link.value)}
              title={collapsed ? link.label : undefined}
            >
              <link.icon size={16} />
              {!collapsed && <span className="text-sm">{link.label}</span>}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
