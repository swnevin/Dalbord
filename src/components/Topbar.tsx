
import { LogOut, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePreview } from "@/contexts/PreviewContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/ui/loader";

const Topbar = () => {
  const { logout, user } = useAuth();
  const { preview, exitPreviewMode } = usePreview();
  const [orgName, setOrgName] = useState<string>("");
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const fetchOrgName = async () => {
      const orgId = preview.isPreviewMode ? preview.previewOrgId : user?.organization_id;
      
      if (orgId) {
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .single();
          
        if (!error && data) {
          setOrgName(data.name);
        }
      }
    };
    
    fetchOrgName();
  }, [user?.organization_id, preview.isPreviewMode, preview.previewOrgId]);

  const handleExitPreview = () => {
    setIsExiting(true);
    setTimeout(() => {
      exitPreviewMode();
      window.history.back();
      setIsExiting(false);
    }, 1000);
  };

  if (isExiting) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader size="lg" text="Avslutter forhåndsvisning..." />
      </div>
    );
  }

  return (
    <header className="h-10 border-b bg-white fixed top-0 left-0 w-full z-20 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center">
        <img 
          alt="DALAI Logo" 
          className="h-5" 
          src="/lovable-uploads/166e945b-e972-4aa1-8425-8d0c13edc80f.png" 
        />
        {orgName && (
          <div className="flex items-center ml-2">
            <span className="text-muted-foreground mx-1">/‎ ‎ </span>
            <span className="text-sm font-medium text-primary">{orgName}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-xs text-muted-foreground flex items-center">
            {user.email}
            {preview.isPreviewMode && preview.previewEmail && (
              <>
                <span className="mx-1 text-muted-foreground">|</span>
                <span className="flex items-center gap-1 text-yellow-600">
                  <UserCheck size={12} className="text-yellow-600" />
                  Forhåndsvisning som: {preview.previewEmail}
                </span>
              </>
            )}
          </span>
        )}
        
        {preview.isPreviewMode ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleExitPreview} 
            className="flex items-center gap-1 text-primary hover:bg-muted h-7 px-2"
          >
            <LogOut size={14} />
            <span className="text-xs">Avslutt forhåndsvisning</span>
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="flex items-center gap-1 text-primary hover:bg-muted h-7 px-2"
          >
            <LogOut size={14} />
            <span className="text-xs">Logg ut</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
