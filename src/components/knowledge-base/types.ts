
export interface VoiceflowDocument {
  documentID: string;
  detectedType?: SourceType;
  data: {
    name: string;
    url?: string;
    type?: string;
    canEdit?: boolean;
  };
  status: {
    type: "SUCCESS" | "PENDING" | "FAILED";
    message?: string;
  };
  updatedAt: string;
  tags?: string[];
}

export interface Chunk {
  chunkID: string;
  content: string;
  documentID: string;
  index: number;
  relevance: number;
}

export interface VoiceflowResponse {
  data: VoiceflowDocument[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
  total: number;
}

export interface VoiceflowChunksResponse {
  chunks: Chunk[];
}

export type SourceType = "url" | "file" | "text" | "qa" | "all";

// Add tags as string[] to QAPair
export interface QAPair {
  question: string;
  answer: string;
  id: string;
  tags: string[];
}
