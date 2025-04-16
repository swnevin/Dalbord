
import { createContext, useContext, useState, ReactNode } from "react";

interface PreviewState {
  isPreviewMode: boolean;
  previewEmail: string | null;
  previewOrgId: string | null;
  previewTabs: string[];
  originalTabs: string[];
}

interface PreviewContextType {
  preview: PreviewState;
  enterPreviewMode: (email: string, orgId: string, tabs: string[]) => void;
  exitPreviewMode: () => void;
}

const PreviewContext = createContext<PreviewContextType | null>(null);

export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("usePreview must be used within a PreviewProvider");
  }
  return context;
};

export const PreviewProvider = ({ children }: { children: ReactNode }) => {
  const [preview, setPreview] = useState<PreviewState>({
    isPreviewMode: false,
    previewEmail: null,
    previewOrgId: null,
    previewTabs: [],
    originalTabs: []
  });

  const enterPreviewMode = (email: string, orgId: string, tabs: string[]) => {
    // Store original tabs to restore them later
    setPreview(prev => ({
      isPreviewMode: true,
      previewEmail: email,
      previewOrgId: orgId,
      previewTabs: tabs,
      originalTabs: prev.originalTabs.length ? prev.originalTabs : [] // Keep original tabs if they exist
    }));
  };

  const exitPreviewMode = () => {
    setPreview(prev => ({
      ...prev,
      isPreviewMode: false,
      previewEmail: null,
      previewOrgId: null,
      previewTabs: [],
    }));
  };

  return (
    <PreviewContext.Provider value={{ preview, enterPreviewMode, exitPreviewMode }}>
      {children}
    </PreviewContext.Provider>
  );
};
