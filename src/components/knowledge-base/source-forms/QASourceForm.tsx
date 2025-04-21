
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TagInput } from "./TagInput";
import { QAPair } from "../types";

interface QASourceFormProps {
  qaTitle: string;
  setQaTitle: (title: string) => void;
  qaPairs: QAPair[];
  duplicateQATitleWarning: boolean;
  showQABulkUpload: boolean;
  bulkQAText: string;
  setBulkQAText: (text: string) => void;
  isLoading: boolean;
  isQAFormValid: boolean;
  onAddQAPair: () => void;
  onUpdateQAPair: (id: string, field: "question" | "answer", value: string) => void;
  onRemoveQAPair: (id: string) => void;
  onUpdateQAPairTags: (id: string, tags: string[]) => void;
  onToggleBulkUpload: () => void;
  onProcessBulk: () => void;
  onSubmit: () => void;
}

export const QASourceForm: React.FC<QASourceFormProps> = ({
  qaTitle,
  setQaTitle,
  qaPairs,
  duplicateQATitleWarning,
  showQABulkUpload,
  bulkQAText,
  setBulkQAText,
  isLoading,
  isQAFormValid,
  onAddQAPair,
  onUpdateQAPair,
  onRemoveQAPair,
  onUpdateQAPairTags,
  onToggleBulkUpload,
  onProcessBulk,
  onSubmit
}) => {
  // Add support for Ask project style tag input by reading isAsk from the first QAPair (if exists) or from props if you pass isAsk directly in future enhancements
  const isAsk =
    (typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem("askModeQAKB") === "true") ||
    undefined; // fallback if you later want a global flag

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="qa-title">Tittel</Label>
        <Input
          id="qa-title"
          placeholder="Tittel på Q&A kilden (vil få '- Q&A' lagt til)"
          value={qaTitle}
          onChange={(e) => setQaTitle(e.target.value)}
          className={duplicateQATitleWarning ? "border-yellow-500" : ""}
        />
        <p className="text-xs text-muted-foreground">
          "- Q&A" vil automatisk legges til på slutten av tittelen for å identifisere kilden som en Q&A.
        </p>
        {duplicateQATitleWarning && (
          <p className="text-yellow-600 text-xs mt-1">
            NB! Det finnes allerede en FAQ-kilde med dette navnet. Hvis du fortsetter vil denne kilden bli overskrevet.
          </p>
        )}
      </div>
      <div className="overflow-y-auto max-h-[400px] pr-2">
        {qaPairs.map((pair, index) => (
          <div key={pair.id} className="space-y-3 p-4 border rounded-lg bg-gray-50 mb-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Spørsmål og svar #{index + 1}</h4>
              {qaPairs.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveQAPair(pair.id)}
                  className="h-8 w-8 text-gray-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`question-${pair.id}`}>Spørsmål:</Label>
              <Input
                id={`question-${pair.id}`}
                placeholder="Skriv inn spørsmål"
                value={pair.question}
                onChange={(e) => onUpdateQAPair(pair.id, "question", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`answer-${pair.id}`}>Svar:</Label>
              <Textarea
                id={`answer-${pair.id}`}
                placeholder="Skriv inn svar"
                value={pair.answer}
                onChange={(e) => onUpdateQAPair(pair.id, "answer", e.target.value)}
                className="min-h-20 resize-y"
              />
            </div>
            <TagInput
              tags={pair.tags}
              setTags={(newTags) => onUpdateQAPairTags(pair.id, newTags)}
              label="Tags (valgfri)"
              placeholder="Skriv inn tag og trykk +"
              disabled={isLoading}
              isAsk={isAsk}
              required={isAsk}
            />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2" 
          onClick={onAddQAPair}
        >
          <Plus className="h-4 w-4" /> Legg til spørsmål og svar
        </Button>
        <Button 
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={onToggleBulkUpload}
        >
          <Upload className="h-4 w-4" /> Last opp Q&A set
        </Button>
      </div>
      {showQABulkUpload && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <div className="space-y-2">
            <Label htmlFor="bulk-qa-text">
              Legg inn Q&A i format:
              <code className="ml-2 p-1 bg-gray-200 rounded text-xs">
                question: Ditt spørsmål her; answer: Ditt svar her
              </code>
            </Label>
            <Textarea
              id="bulk-qa-text"
              placeholder="question: Hvordan endrer jeg språk på meldinger?; answer: Språket på e-poster kan ikke endres, de sendes kun på engelsk."
              value={bulkQAText}
              onChange={(e) => setBulkQAText(e.target.value)}
              className="min-h-32 resize-y font-mono text-sm"
            />
          </div>
          <Button 
            variant="outline"
            className="w-full"
            onClick={onProcessBulk}
            disabled={!bulkQAText.trim()}
          >
            Legg til
          </Button>
        </div>
      )}
      <Button 
        className="w-full bg-primary text-white" 
        disabled={!isQAFormValid || isLoading}
        onClick={onSubmit}
      >
        {isLoading ? "Lagrer..." : "Lagre Q&A"}
      </Button>
    </div>
  );
};
