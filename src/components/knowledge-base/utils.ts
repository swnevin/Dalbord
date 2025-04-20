
import { QAPair } from "./types";

export const normalizeUrl = (url: string): string => {
  let normalizedUrl = url;
  
  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
  
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');
  
  return normalizedUrl.toLowerCase();
};

export const ensureQATitleSuffix = (title: string): string => {
  if (!title.endsWith("- Q&A")) {
    return `${title} - Q&A`;
  }
  return title;
};

export const createTextFile = (text: string, fileName: string): File => {
  const textBlob = new Blob([text], { type: 'text/plain' });
  const file = new File([textBlob], fileName);
  return file;
};

export const createQAPayload = (title: string, qaPairs: QAPair[], tags?: string[]) => {
  const formattedTitle = ensureQATitleSuffix(title.trim());
  
  const qaItems = qaPairs.map(pair => ({
    question: pair.question.trim(),
    answer: pair.answer.trim()
  }));

  const payload: {
    data: {
      schema: { searchableFields: string[] };
      name: string;
      items: { question: string; answer: string }[];
      metadata?: { tags?: string[] };
    }
  } = {
    data: {
      schema: { searchableFields: ['question', 'answer'] },
      name: formattedTitle,
      items: qaItems
    }
  };

  if (tags && tags.length > 0) {
    payload.data.metadata = { tags };
  }

  return payload;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('no', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
