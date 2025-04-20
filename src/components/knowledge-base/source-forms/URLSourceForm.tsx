
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { TagInput } from "../TagInput";

interface URLSourceFormProps {
  url: string;
  setUrl: (url: string) => void;
  urlError: string;
  duplicateUrlWarning: boolean;
  isLoading: boolean;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  onSubmit: () => void;
}

export const URLSourceForm: React.FC<URLSourceFormProps> = ({
  url,
  setUrl,
  urlError,
  duplicateUrlWarning,
  isLoading,
  tags,
  onTagsChange,
  onSubmit
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Lim inn URL (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={urlError || duplicateUrlWarning ? "border-red-500" : ""}
        />
        {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
        {duplicateUrlWarning && (
          <div className="flex gap-2 items-center mt-1 text-yellow-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Denne URL-en finnes allerede i kunnskapsbasen</span>
          </div>
        )}
      </div>
      
      <TagInput tags={tags} onChange={onTagsChange} />
      
      <Button 
        className="w-full" 
        disabled={!url || !!urlError || duplicateUrlWarning || isLoading}
        onClick={onSubmit}
      >
        {isLoading ? "Laster opp..." : "Last opp URL"}
      </Button>
    </div>
  );
};
