
import React from "react";
import { URLSourceForm } from "./source-forms/URLSourceForm";
import { VoiceflowDocument } from "./types";

interface AddSourceSheetUrlFormProps {
  sources: VoiceflowDocument[];
  isLoading: boolean;
  onSourceAdded: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const AddSourceSheetUrlForm: React.FC<AddSourceSheetUrlFormProps> = ({
  sources,
  isLoading,
  onSourceAdded,
  onOpenChange
}) => {
  // Move relevant state and handlers from parent (AddSourceSheet) or receive as props as needed
  // For now, logic should be handled in the parent. This file is for future-proofing, can elaborate further if lifting state is needed.
  return null;
};
