import React from "react";
import { VoiceflowDocument, Chunk } from "./types";
import { Loader } from "@/components/ui/loader";
import { 
  ChevronDown, 
  Trash2, 
  ExternalLink, 
  File, 
  FileText, 
  Globe, 
  MessageSquareText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "./utils";
import { cn } from "@/lib/utils";

interface SourceExplorerProps {
  sources: VoiceflowDocument[];
  expandedSourceId: string | null;
  chunks: Chunk[];
  isLoadingChunks: boolean;
  loadingChunksText?: string;
  onExpandSource: (id: string) => void;
  onDeleteSource: (id: string) => void;
}

export const SourceExplorer: React.FC<SourceExplorerProps> = ({
  sources,
  expandedSourceId,
  chunks,
  isLoadingChunks,
  loadingChunksText = "Laster innhold...",
  onExpandSource,
  onDeleteSource
}) => {
  const getSourceIcon = (source: VoiceflowDocument) => {
    if (source.data.name.endsWith("- Q&A")) {
      return <MessageSquareText className="h-5 w-5 text-yellow-500" />;
    }
    
    if (source.data.type === "url") {
      return <Globe className="h-5 w-5 text-blue-500" />;
    }
    
    if (source.data.type === "docx") {
      return <FileText className="h-5 w-5 text-indigo-500" />;
    }
    
    return <File className="h-5 w-5 text-gray-500" />;
  };

  if (sources.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg">
        <p className="text-gray-500">Ingen kilder funnet. Legg til din første kilde ved å klikke på "Legg til kilde" knappen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <div 
          key={source.documentID} 
          className="border rounded-lg overflow-hidden bg-white shadow-sm"
        >
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => onExpandSource(source.documentID)}
          >
            <div className="flex items-center gap-3">
              {getSourceIcon(source)}
              <div>
                <h3 className="font-medium">
                  {source.data.name}
                  {source.tags && source.tags.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400 align-middle">
                      (
                        {source.tags.join(', ')}
                      )
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">
                  {source.status.type === "SUCCESS" ? (
                    <>Sist oppdatert: {formatDate(source.updatedAt)}</>
                  ) : source.status.type === "PENDING" ? (
                    <span className="text-yellow-600">Behandler...</span>
                  ) : (
                    <span className="text-red-600">Feilet</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSource(source.documentID);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ChevronDown className={cn(
                "h-5 w-5 text-gray-400 transition-transform",
                expandedSourceId === source.documentID && "transform rotate-180"
              )} />
            </div>
          </div>
          
          {expandedSourceId === source.documentID && (
            <div className="border-t p-4 bg-gray-50">
              {isLoadingChunks ? (
                <div className="flex justify-center py-8">
                  <Loader size="md" text={loadingChunksText} />
                </div>
              ) : chunks.length > 0 ? (
                <div className="space-y-4">
                  {source.data.url && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
                      <ExternalLink className="h-4 w-4" />
                      <a href={source.data.url} target="_blank" rel="noopener noreferrer">
                        {source.data.url}
                      </a>
                    </div>
                  )}
                  
                  <h4 className="font-medium text-sm text-gray-500">Innhold:</h4>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {chunks.map((chunk) => (
                      <div key={chunk.chunkID} className="p-3 bg-white border rounded-md">
                        <p className="whitespace-pre-wrap text-sm">{chunk.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">Ingen innhold funnet for denne kilden.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
