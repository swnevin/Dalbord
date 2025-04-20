
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const TagInput = ({
  tags,
  setTags,
  label = "Tagger",
  placeholder = "Skriv og trykk på +",
}: TagInputProps) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "Tab") && input.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 text-white bg-[#28483F] rounded hover:bg-[#233c33] flex items-center"
          aria-label="Legg til tag"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="bg-[#E2B808]/10 text-[#E2B808] px-2.5 py-1 rounded flex items-center text-xs font-semibold"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-[#E2B808] hover:text-red-500"
              aria-label="Fjern tag"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
