
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

const Topbar = ({ sidebarCollapsed }: TopbarProps) => {
  const { logout, user } = useAuth();
  
  return (
    <header className={cn(
      "h-16 border-b border-white/10 bg-primary text-white flex items-center justify-between px-4",
      sidebarCollapsed ? "ml-20" : "ml-64"
    )}>
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/aa3840d0-81a7-407e-95be-f1f48868b7c6.png" 
          alt="DALAI Logo" 
          className="h-10"
        />
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm opacity-80">
            {user.email}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2 text-white hover:bg-white/10 active:bg-white/20"
        >
          <LogOut size={18} />
          <span>Logg ut</span>
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
