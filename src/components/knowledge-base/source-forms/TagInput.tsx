
import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  setTags,
  label = "Tags (valgfri)",
  placeholder = "Skriv inn tag og trykk +",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "+" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <Input
          disabled={disabled}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          disabled={!inputValue.trim() || disabled}
          onClick={addTag}
          className="bg-primary rounded p-2 hover:bg-primary/90 disabled:bg-muted"
          title="Legg til tag"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center bg-secondary text-xs px-2 py-1 rounded mr-1 mt-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1"
              aria-label={`Fjern tag: ${tag}`}
              disabled={disabled}
            >
              <X className="w-3 h-3 text-gray-500 hover:text-destructive" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
