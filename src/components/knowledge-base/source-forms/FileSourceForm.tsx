
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TagInput } from "./TagInput";

interface FileSourceFormProps {
  file: File | null;
  fileTitle: string;
  setFileTitle: (title: string) => void;
  duplicateFileWarning: boolean;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  tags: string[];
  setTags: (tags: string[]) => void;
}

export const FileSourceForm: React.FC<FileSourceFormProps> = ({
  file,
  fileTitle,
  setFileTitle,
  duplicateFileWarning,
  isLoading,
  onFileChange,
  onSubmit,
  tags,
  setTags,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Kun PDF, tekst eller DOCX filer er tillatt.");
        return;
      }
      
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        {file && (
          <>
            <Label htmlFor="file-title" className="block mb-2">Filnavn (valgfritt)</Label>
            <Input
              id="file-title"
              placeholder="Angi et navn for filen (valgfritt)"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              className={duplicateFileWarning ? "border-red-500 mb-1" : "mb-2"}
              disabled={isLoading}
            />
            {duplicateFileWarning && (
              <div className="flex gap-2 items-center mt-1 mb-2 text-yellow-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>En fil med dette navnet finnes allerede i kunnskapsbasen</span>
              </div>
            )}
          </>
        )}
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
          )}
          onClick={() => !isLoading && document.getElementById("file-upload")?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            {file ? file.name : "Dra og slipp fil her eller klikk for å velge"}
          </p>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <TagInput tags={tags} setTags={setTags} disabled={isLoading} />
      <Button 
        className="w-full" 
        disabled={!file || duplicateFileWarning || isLoading}
        onClick={onSubmit}
      >
        {isLoading ? "Laster opp..." : "Last opp fil"}
      </Button>
    </div>
  );
};
