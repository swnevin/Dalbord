
export type SourceType = "url" | "file" | "qa" | "all";

export interface VoiceflowDocument {
  data: {
    type: "url" | "docx" | "text" | "pdf" | "qa" | "table";
    name: string;
    url?: string;
    refreshRate?: string;
    canEdit?: boolean;
    rowsCount?: number;
    schema?: {
      searchableFields: string[];
    };
  };
  tags: string[];
  documentID: string;
  updatedAt: string;
  status: {
    type: "SUCCESS" | "PENDING" | "FAILED";
    data?: any;
  };
  detectedType?: SourceType;
}

export interface VoiceflowResponse {
  total: number;
  data: VoiceflowDocument[];
}

export interface Chunk {
  chunkID: string;
  content: string;
  metadata: Record<string, any>;
}

export interface VoiceflowChunksResponse {
  data: VoiceflowDocument;
  chunks: Chunk[];
}

export interface QAPair {
  question: string;
  answer: string;
  id: string;
}
