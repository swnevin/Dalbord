
import React, { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({ 
  tags, 
  setTags,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      setTags([...tags, trimmedValue]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="tags-input">Tagger (valgfritt)</Label>
      <div className="flex items-center gap-2">
        <Input
          id="tags-input"
          placeholder="Skriv inn en tagg og trykk +"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <Button 
          type="button" 
          size="icon" 
          variant="outline" 
          onClick={addTag}
          disabled={!inputValue.trim() || disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, index) => (
            <div 
              key={index} 
              className="bg-muted text-muted-foreground px-2 py-1 rounded-md flex items-center gap-1 text-sm"
            >
              <span>{tag}</span>
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                onClick={() => removeTag(tag)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
