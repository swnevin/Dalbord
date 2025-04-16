
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { usePreview } from "@/contexts/PreviewContext";
import { Database } from "@/integrations/supabase/types";

type TabData = { tab_name: Database["public"]["Enums"]["tab_type"] };

interface MemberPreviewButtonProps {
  memberEmail: string;
  memberId: string;
  organizationId: string;
  memberTabs: TabData[];
  organizationType: "admin" | "client";
}

export const MemberPreviewButton = ({
  memberEmail,
  memberId,
  organizationId,
  memberTabs,
  organizationType
}: MemberPreviewButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { enterPreviewMode } = usePreview();

  const handlePreviewClick = async () => {
    setIsLoading(true);
    
    // Show loading state in full screen for better visibility
    document.body.style.overflow = 'hidden';
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'preview-loading';
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '0';
    loadingDiv.style.left = '0';
    loadingDiv.style.width = '100%';
    loadingDiv.style.height = '100%';
    loadingDiv.style.backgroundColor = 'white';
    loadingDiv.style.zIndex = '9999';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.justifyContent = 'center';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.flexDirection = 'column';
    
    const loader = document.createElement('div');
    loader.innerHTML = '<div class="preview-loader"></div>';
    
    const text = document.createElement('p');
    text.textContent = 'Laster klient forhåndsvisning...';
    text.style.marginTop = '16px';
    text.style.color = '#666';
    
    loadingDiv.appendChild(loader);
    loadingDiv.appendChild(text);
    document.body.appendChild(loadingDiv);
    
    try {
      const tabNames = memberTabs.map(tab => tab.tab_name);
      enterPreviewMode(memberEmail, organizationId, tabNames);
      
      // Navigate to client dashboard with a slight delay to show loading state
      setTimeout(() => {
        navigate('/dashboard');
        // Remove loading overlay
        const loadingElement = document.getElementById('preview-loading');
        if (loadingElement) {
          document.body.removeChild(loadingElement);
        }
        document.body.style.overflow = 'auto';
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error entering preview mode:", error);
      // Remove loading overlay on error
      const loadingElement = document.getElementById('preview-loading');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }
      document.body.style.overflow = 'auto';
      setIsLoading(false);
    }
  };

  // Don't show the preview button for admin organizations
  if (organizationType === "admin") {
    return null;
  }

  return (
    <>
      <style>
        {`
          .preview-loader {
            width: 80px;
            height: 80px;
            background-image: url('/lovable-uploads/f59d2e9a-80de-456b-bf9a-dd2bd0058c4b.png');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            animation: loader 3s ease-in-out infinite;
          }
          
          @keyframes loader {
            0% {
              transform: rotate(0deg) scale(1);
            }
            25% {
              transform: rotate(90deg) scale(1.1);
            }
            50% {
              transform: rotate(0deg) scale(1);
            }
            75% {
              transform: rotate(-90deg) scale(1.1);
            }
            100% {
              transform: rotate(0deg) scale(1);
            }
          }
        `}
      </style>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviewClick}
            disabled={isLoading}
            className="text-blue-500 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Logg inn som medlem</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
};
