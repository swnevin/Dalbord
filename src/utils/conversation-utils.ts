
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString("no", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("no", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("no", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatText = (text: string) => {
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>');
  
  const lines = text.split('\n');
  const formattedLines = lines.map(line => {
    if (/^\d+\.\s/.test(line)) {
      return `<div class="mt-2">${line}</div>`;
    }
    return line.trim() ? `<p>${line}</p>` : '';
  });
  
  text = formattedLines.join('');
  text = text.replace(/<p>>(.*?)<\/p>/g, '<blockquote class="border-l-4 border-gray-300 pl-4 my-2 italic">$1</blockquote>');
  
  return text;
};

export const containsIframe = (text: string) => {
  // Updated regex to detect iframe tag across multiple lines
  return /<\s*iframe[\s\S]*?src\s*=\s*["'].*?["'][\s\S]*?>/.test(text);
};

export const extractIframeAndCleanText = (text: string) => {
  // Improved regex to better match multi-line iframe with attributes
  const iframeRegex = /<\s*iframe[\s\S]*?src\s*=\s*["'](.*?)["'][\s\S]*?(?:\/?>|<\/iframe>)/;
  const iframeMatch = text.match(iframeRegex);
  const iframeSrc = iframeMatch ? iframeMatch[1] : null;
  
  // Remove the entire iframe tag from the text
  const cleanText = text.replace(/<\s*iframe[\s\S]*?(?:\/?>|<\/iframe>)/, '').trim();
  
  return { cleanText, iframeSrc };
};

export const filterDialog = (messages: any[]) => {
  const excludedTypes = ['block', 'debug', 'flow', 'path', 'knowledgeBase', 'no-reply'];
  return messages.filter(message => !excludedTypes.includes(message.type));
};
