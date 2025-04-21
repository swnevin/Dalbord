
import React from "react";
import { FileSourceForm } from "./source-forms/FileSourceForm";
import { VoiceflowDocument } from "./types";

interface AddSourceSheetFileFormProps {
  sources: VoiceflowDocument[];
  isLoading: boolean;
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const AddSourceSheetFileForm: React.FC<AddSourceSheetFileFormProps> = ({
  sources,
  isLoading,
  onSourceAdded,
  onOpenChange
}) => {
  // See comments in AddSourceSheetUrlForm.
  return null;
};
