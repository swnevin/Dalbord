
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceflowDocument } from "./types";
import { URLSourceFormContainer } from "./source-forms/URLSourceFormContainer";
import { FileSourceFormContainer } from "./source-forms/FileSourceFormContainer";
import { QASourceFormContainer } from "./source-forms/QASourceFormContainer";

interface AddSourceSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sources: VoiceflowDocument[];
  onSourceAdded: () => void;
}

export const AddSourceSheet: React.FC<AddSourceSheetProps> = ({
  isOpen,
  onOpenChange,
  sources,
  onSourceAdded,
}) => {
  const [selectedSourceType, setSelectedSourceType] = useState<
    "url" | "file" | "qa"
  >("url");

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="bg-primary text-white">+ Legg til kilde</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto max-h-screen pb-20">
        <SheetHeader>
          <SheetTitle>Legg til ny kilde</SheetTitle>
          <SheetDescription>
            Last opp en fil, legg til en URL eller spørsmål og svar til kunnskapsbasen.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <div className="mb-4">
            <Select
              value={selectedSourceType}
              onValueChange={(value) =>
                setSelectedSourceType(value as "url" | "file" | "qa")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Velg kildetype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="file">Filopplasting</SelectItem>
                <SelectItem value="qa">Spørsmål & Svar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedSourceType === "url" && (
            <URLSourceFormContainer
              sources={sources}
              onSourceAdded={onSourceAdded}
              onOpenChange={onOpenChange}
            />
          )}

          {selectedSourceType === "file" && (
            <FileSourceFormContainer
              sources={sources}
              onSourceAdded={onSourceAdded}
              onOpenChange={onOpenChange}
            />
          )}

          {selectedSourceType === "qa" && (
            <QASourceFormContainer
              sources={sources}
              onSourceAdded={onSourceAdded}
              onOpenChange={onOpenChange}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
