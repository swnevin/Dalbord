
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Topbar = () => {
  const { logout, user } = useAuth();
  const [orgName, setOrgName] = useState<string>("");
  
  useEffect(() => {
    const fetchOrgName = async () => {
      if (user?.organization_id) {
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', user.organization_id)
          .single();
        
        if (!error && data) {
          setOrgName(data.name);
        }
      }
    };
    
    fetchOrgName();
  }, [user]);
  
  return (
    <header className="fixed top-0 left-0 right-0 h-12 border-b border-white/10 bg-primary text-white flex items-center justify-between px-4 z-20">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/aa3840d0-81a7-407e-95be-f1f48868b7c6.png" 
          alt="DALAI Logo" 
          className="h-6"
        />
        {orgName && (
          <>
            <span className="mx-2 text-white/50">/</span>
            <span className="text-sm font-medium">{orgName}</span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-xs opacity-80">
            {user.email}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2 text-white hover:bg-white/10 active:bg-white/20 h-8 px-2"
        >
          <LogOut size={16} />
          <span className="text-xs">Logg ut</span>
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
