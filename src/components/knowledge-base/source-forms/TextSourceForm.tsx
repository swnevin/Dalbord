
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextSourceFormProps {
  textFileName: string;
  setTextFileName: (name: string) => void;
  textFileNameError: string;
  rawText: string;
  setRawText: (text: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export const TextSourceForm: React.FC<TextSourceFormProps> = ({
  textFileName,
  setTextFileName,
  textFileNameError,
  rawText,
  setRawText,
  isLoading,
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
