
import React from "react";
import { TextSourceForm } from "./source-forms/TextSourceForm";
import { VoiceflowDocument } from "./types";

interface AddSourceSheetTextFormProps {
  sources: VoiceflowDocument[];
  isLoading: boolean;
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const AddSourceSheetTextForm: React.FC<AddSourceSheetTextFormProps> = ({
  sources,
  isLoading,
  onSourceAdded,
  onOpenChange
}) => {
  // See comments in AddSourceSheetUrlForm.
  return null;
};
