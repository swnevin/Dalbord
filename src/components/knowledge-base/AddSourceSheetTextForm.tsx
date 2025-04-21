
import React from "react";
import { TextSourceForm } from "./source-forms/TextSourceForm";
import { VoiceflowDocument } from "./types";
import { TagInput } from "./source-forms/TagInput";

interface AddSourceSheetTextFormProps {
  sources: VoiceflowDocument[];
  isLoading: boolean;
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
  textFileName: string;
  setTextFileName: (name: string) => void;
  textFileNameError: string;
  rawText: string;
  setRawText: (text: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  onSubmit: () => void;
}

export const AddSourceSheetTextForm: React.FC<AddSourceSheetTextFormProps> = ({
  sources,
  isLoading,
  onSourceAdded,
  onOpenChange,
  textFileName,
  setTextFileName,
  textFileNameError,
  rawText,
  setRawText,
  tags,
  setTags,
  onSubmit
}) => {
  return (
    <div className="space-y-4">
      <TextSourceForm
        textFileName={textFileName}
        setTextFileName={setTextFileName}
        textFileNameError={textFileNameError}
        rawText={rawText}
        setRawText={setRawText}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
      <TagInput
        tags={tags}
        setTags={setTags}
        disabled={isLoading}
        label="Tags (valgfritt)"
        placeholder="Skriv et tag og trykk +"
      />
    </div>
  );
};
