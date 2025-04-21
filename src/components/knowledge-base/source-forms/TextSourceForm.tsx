
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TagInput } from "../TagInput";

interface TextSourceFormProps {
  textFileName: string;
  setTextFileName: (name: string) => void;
  textFileNameError: string;
  rawText: string;
  setRawText: (text: string) => void;
  isLoading: boolean;
  tags: string[];
  setTags: (tags: string[]) => void;
  onSubmit: () => void;
}

export const TextSourceForm: React.FC<TextSourceFormProps> = ({
  textFileName,
  setTextFileName,
  textFileNameError,
  rawText,
  setRawText,
  isLoading,
  tags,
  setTags,
  onSubmit
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Filnavn (f.eks. min-tekst.txt)"
          value={textFileName}
          onChange={(e) => setTextFileName(e.target.value)}
          className={cn("mb-2", textFileNameError ? "border-red-500" : "")}
        />
        {textFileNameError && <p className="text-red-500 text-sm mb-2">{textFileNameError}</p>}
      </div>
      <Textarea
        placeholder="Skriv eller lim inn tekst her"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        className="min-h-32 resize-y"
      />
      
      <TagInput 
        tags={tags} 
        setTags={setTags} 
        disabled={isLoading} 
      />
      
      <Button 
        className="w-full" 
        disabled={!rawText || !!textFileNameError || isLoading}
        onClick={onSubmit}
      >
        {isLoading ? "Laster opp..." : "Last opp tekst"}
      </Button>
    </div>
  );
};
