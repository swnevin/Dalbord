
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { TagInput } from "./TagInput";

interface URLSourceFormProps {
  url: string;
  setUrl: (url: string) => void;
  urlError: string;
  duplicateUrlWarning: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  isAsk?: boolean;
  required?: boolean;
}

export const URLSourceForm: React.FC<URLSourceFormProps> = ({
  url,
  setUrl,
  urlError,
  duplicateUrlWarning,
  isLoading,
  onSubmit,
  tags,
  setTags,
  isAsk = false,
  required = false,
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
      <TagInput
        tags={tags}
        setTags={setTags}
        label="Tags (valgfri)"
        placeholder="Skriv inn tag og trykk +"
        disabled={isLoading}
        isAsk={isAsk}
        required={required}
      />
      <Button 
        className="w-full" 
        disabled={(!url || !!urlError || duplicateUrlWarning || isLoading) || (isAsk && tags.length === 0)}
        onClick={onSubmit}
      >
        {isLoading ? "Laster opp..." : "Last opp URL"}
      </Button>
    </div>
  );
};
