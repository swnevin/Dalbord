import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
const Topbar = () => {
  const {
    logout,
    user
  } = useAuth();
  const [orgName, setOrgName] = useState<string>("");
  useEffect(() => {
    const fetchOrgName = async () => {
      if (user?.organization_id) {
        const {
          data,
          error
        } = await supabase.from('organizations').select('name').eq('id', user.organization_id).single();
        if (!error && data) {
          setOrgName(data.name);
        }
      }
    };
    fetchOrgName();
  }, [user?.organization_id]);
  return <header className="h-10 border-b bg-white fixed top-0 left-0 w-full z-20 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center">
        <img alt="DALAI Logo" className="h-5" src="/lovable-uploads/166e945b-e972-4aa1-8425-8d0c13edc80f.png" />
        {orgName && <div className="flex items-center ml-2">
            <span className="text-muted-foreground mx-1">/ </span>
            <span className="text-sm font-medium text-primary">{orgName}</span>
          </div>}
      </div>
      
      <div className="flex items-center gap-3">
        {user && <span className="text-xs text-muted-foreground">
            {user.email}
          </span>}
        <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-1 text-primary hover:bg-muted h-7 px-2">
          <LogOut size={14} />
          <span className="text-xs">Logg ut</span>
        </Button>
      </div>
    </header>;
};
export default Topbar;