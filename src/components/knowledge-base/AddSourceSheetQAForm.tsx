
import React from "react";
import { QASourceForm } from "./source-forms/QASourceForm";
import { VoiceflowDocument, QAPair } from "./types";

interface AddSourceSheetQAFormProps {
  sources: VoiceflowDocument[];
  isLoading: boolean;
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const AddSourceSheetQAForm: React.FC<AddSourceSheetQAFormProps> = ({
  sources,
  isLoading,
  onSourceAdded,
  onOpenChange
}) => {
  // See comments in AddSourceSheetUrlForm.
  return null;
};
