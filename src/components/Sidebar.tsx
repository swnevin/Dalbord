import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  BookOpen,
  LineChart,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  role: "admin" | "client";
  onTabChange: (tab: string) => void;
  activeTab: string;
}

type TabName = "organizations" | "conversations" | "knowledge" | "statistics";

const Sidebar = ({ role, onTabChange, activeTab }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const [permittedTabs, setPermittedTabs] = useState<TabName[]>([]);

  const adminLinks = [
    { icon: Users, label: "Organisasjoner", value: "organizations" as TabName },
  ];

  const clientLinks = [
    { icon: MessageSquare, label: "Samtaler", value: "conversations" as TabName },
    { icon: BookOpen, label: "Kunnskapsbase", value: "knowledge" as TabName },
    { icon: LineChart, label: "Statistikk", value: "statistics" as TabName },
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

  return (
    <div
      className={cn(
        "h-screen bg-primary text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10">
        <div className={cn("flex-1 flex justify-center", collapsed && "hidden")}>
          <img 
            src="/lovable-uploads/aa3840d0-81a7-407e-95be-f1f48868b7c6.png" 
            alt="DALAI Logo" 
            className="h-28"
          />
        </div>
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
        <Tabs 
          defaultValue={links[0]?.value} 
          value={activeTab}
          onValueChange={onTabChange} 
          orientation="vertical" 
          className="w-full"
        >
          <TabsList className="flex flex-col h-auto bg-transparent space-y-2">
            {links.map((link) => (
              <TabsTrigger
                key={link.value}
                value={link.value}
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
