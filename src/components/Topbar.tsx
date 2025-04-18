
import { LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Separator used to distinguish between admin and client org IDs
const ORG_ID_SEPARATOR = "::preview::";

// Extract org IDs from concatenated string
const extractOrgIds = (concatenatedId: string) => {
  if (!concatenatedId.includes(ORG_ID_SEPARATOR)) {
    return { adminOrgId: concatenatedId, clientOrgId: concatenatedId };
  }
  
  const [adminOrgId, clientOrgId] = concatenatedId.split(ORG_ID_SEPARATOR);
  return { adminOrgId, clientOrgId };
};

const Topbar = () => {
  const {
    logout,
    user,
    previewUser,
    isInPreviewMode,
    exitPreviewMode
  } = useAuth();
  const [orgName, setOrgName] = useState<string>("");
  
  useEffect(() => {
    const fetchOrgName = async () => {
      let organizationId = user?.organization_id;
      
      if (organizationId) {
        // If in preview mode and the org ID is concatenated, extract the client org ID
        if (isInPreviewMode && organizationId.includes(ORG_ID_SEPARATOR)) {
          organizationId = extractOrgIds(organizationId).clientOrgId;
        } else if (isInPreviewMode && previewUser) {
          // Fallback to previewUser if needed
          organizationId = previewUser.organization_id;
        } else if (organizationId.includes(ORG_ID_SEPARATOR)) {
          // If not in preview mode but ID is still concatenated, use admin part
          organizationId = extractOrgIds(organizationId).adminOrgId;
        }
        
        const {
          data,
          error
        } = await supabase.from('organizations').select('name').eq('id', organizationId).single();
        
        if (!error && data) {
          setOrgName(data.name);
        }
      }
    };
    
    fetchOrgName();
  }, [user?.organization_id, previewUser, isInPreviewMode]);

  return <header className="h-10 border-b bg-white fixed top-0 left-0 w-full z-20 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center">
        <img alt="DALAI Logo" className="h-5" src="/lovable-uploads/166e945b-e972-4aa1-8425-8d0c13edc80f.png" />
        {orgName && <div className="flex items-center ml-2">
            <span className="text-muted-foreground mx-1">/‎ ‎ </span>
            <span className="text-sm font-medium text-primary">{orgName}</span>
          </div>}
      </div>
      
      <div className="flex items-center gap-3">
        {isInPreviewMode && previewUser ? (
          <div className="flex items-center gap-1">
            <span className="text-xs bg-[#28483F]/10 text-[#28483F] px-2 py-0.5 rounded-md">
              Forhåndsvisning som: {previewUser.email}
            </span>
            <span className="text-xs text-muted-foreground mx-1">|</span>
            <span className="text-xs text-muted-foreground">
              Innlogget som: {user?.email}
            </span>
          </div>
        ) : (
          user && <span className="text-xs text-muted-foreground">
            {user.email}
          </span>
        )}
        
        {isInPreviewMode ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={exitPreviewMode} 
                  className="flex items-center gap-1 text-primary hover:bg-muted h-7 px-2"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs">Avslutt forhåndsvisning</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Avslutt forhåndsvisning og gå tilbake</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
    </header>;
};

export default Topbar;
