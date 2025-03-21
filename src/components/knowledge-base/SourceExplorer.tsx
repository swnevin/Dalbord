
import React from "react";
import { ChevronDown, ExternalLink, FileText, MessageCircleQuestion, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { VoiceflowDocument, Chunk, SourceType } from "./types";

interface SourceExplorerProps {
  sources: VoiceflowDocument[];
  expandedSourceId: string | null;
  chunks: Chunk[];
  isLoadingChunks: boolean;
  onExpandSource: (documentId: string) => void;
  onDeleteSource: (documentId: string) => void;
}

export const SourceExplorer: React.FC<SourceExplorerProps> = ({
  sources,
  expandedSourceId,
  chunks,
  isLoadingChunks,
  onExpandSource,
  onDeleteSource,
}) => {
  const getSourceIcon = (source: VoiceflowDocument) => {
    const type = source.detectedType;
    
    switch (type) {
      case "url":
        return <ExternalLink className="text-primary h-5 w-5" />;
      case "file":
        return <FileText className="text-primary h-5 w-5" />;
      case "qa":
        return <MessageCircleQuestion className="text-primary h-5 w-5" />;
      default:
        return <ExternalLink className="text-primary h-5 w-5" />;
    }
  };

  if (sources.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>Ingen kilder funnet</p>
        <p className="text-sm mt-2">Legg til din første kilde ved å klikke på "Legg til kilde" knappen</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources.map((source) => (
        <div 
          key={source.documentID}
          className="bg-white rounded-lg border hover:border-primary/20 transition-colors"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {getSourceIcon(source)}
              <div>
                <h3 className="font-medium text-gray-900">{source.data.name}</h3>
                <p className="text-sm text-gray-500">
                  Oppdatert: {new Date(source.updatedAt).toLocaleDateString('no')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExpandSource(source.documentID)}
                className={cn(
                  "transition-transform",
                  expandedSourceId === source.documentID && "rotate-180"
                )}
              >
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dette vil permanent slette kilden fra kunnskapsbasen. Denne handlingen kan ikke angres.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDeleteSource(source.documentID)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Slett
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {expandedSourceId === source.documentID && (
            <div className="border-t px-4 py-3">
              {isLoadingChunks ? (
                <div className="flex justify-center py-4">
                  <Loader size="md" />
                </div>
              ) : chunks.length > 0 ? (
                <div className="space-y-4">
                  {chunks.map((chunk) => (
                    <div 
                      key={chunk.chunkID}
                      className="p-3 bg-gray-50 rounded-md"
                    >
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-2">Ingen chunks funnet</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
