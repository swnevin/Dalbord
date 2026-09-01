
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SourceType } from "./types";

interface SourceTypeFilterProps {
  value: SourceType;
  onChange: (value: SourceType) => void;
}

export const SourceTypeFilter: React.FC<SourceTypeFilterProps> = ({ value, onChange }) => {
  return (
    <div className="w-40">
      <Select 
        value={value} 
        onValueChange={(value) => onChange(value as SourceType)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Alle typer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle typer</SelectItem>
          <SelectItem value="url">URL</SelectItem>
          <SelectItem value="file">Fil</SelectItem>
          <SelectItem value="qa">Spørsmål & Svar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
