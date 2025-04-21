
import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  isAsk?: boolean;
  required?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  setTags,
  label = "Tags (valgfri)",
  placeholder = "Skriv inn tag og trykk +",
  disabled = false,
  isAsk = false,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const showError = required && hasAttemptedSubmit && tags.length === 0;

  const addTag = (customTag?: string) => {
    const trimmed = (customTag ?? inputValue).trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setInputValue("");
    }
    setHasAttemptedSubmit(false);
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

  // If this is an Ask project, change label/placeholder, add button for 'All'
  const askLabel = "Produktnavn";
  const askPlaceholder = "Skriv inn produktnavn...";
  const allProductsTag = "All";

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {isAsk ? askLabel : label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <Input
          disabled={disabled}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAsk ? askPlaceholder : placeholder}
          className={
            showError
              ? "border-red-500"
              : ""
          }
        />
        <button
          type="button"
          disabled={!inputValue.trim() || disabled}
          onClick={() => {
            addTag();
            setHasAttemptedSubmit(true);
          }}
          className="bg-primary rounded p-2 hover:bg-primary/90 disabled:bg-muted"
          title={isAsk ? "Legg til produktnavn" : "Legg til tag"}
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>
      {isAsk && (
        <div className="mt-2">
          <button
            type="button"
            className={
              "inline-block bg-[#F1F5F9] text-[#28483F] hover:bg-[#E2B808] hover:text-[#28483F] text-sm font-medium rounded px-3 py-1 transition-colors border border-[#cbd5e1] mb-1" +
              (tags.includes(allProductsTag) ? " opacity-60 cursor-not-allowed" : " cursor-pointer")
            }
            disabled={tags.includes(allProductsTag) || disabled}
            onClick={() => addTag(allProductsTag)}
          >
            Alle produkter
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center bg-[#F1F5F9] text-[#28483F] border border-[#cbd5e1] text-xs px-2 py-1 rounded mr-1 mt-1 font-medium"
            style={{
              background: "#F1F5F9",
              color: "#28483F",
              border: "1px solid #cbd5e1"
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1"
              aria-label={`Fjern tag: ${tag}`}
              disabled={disabled}
            >
              <X className="w-3 h-3 text-[#28483F] hover:text-destructive" />
            </button>
          </span>
        ))}
      </div>
      {showError && (
        <p className="text-red-500 text-sm mt-1">Vennligst angi minst ett produktnavn.</p>
      )}
    </div>
  );
};
