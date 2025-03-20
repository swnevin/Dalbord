import { Loader } from "@/components/ui/loader";
import { formatTime, filterDialog, formatText, containsIframe, extractIframeAndCleanText } from "@/utils/conversation-utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DialogMessage {
  type: string;
  payload?: {
    message?: string;
    text?: string;
    query?: string;
    time?: number;
    type?: string;
    payload?: {
      message?: string;
      buttons?: Array<{
        name: string;
        request: {
          payload: {
            label: string;
          };
        };
      }>;
      query?: string;
      label?: string;
    };
  };
  startTime?: string;
}

interface ConversationDialogProps {
  isLoading: boolean;
  selectedConversation: string | null;
  dialog: DialogMessage[];
}

export const ConversationDialog = ({ 
  isLoading, 
  selectedConversation, 
  dialog 
}: ConversationDialogProps) => {
  const { user } = useAuth();
  const dialogContainerRef = useRef<HTMLDivElement>(null);
  const newestSessionRef = useRef<HTMLDivElement | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<DialogMessage[]>([]);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const [qaTitle, setQaTitle] = useState("");
  const [qaPair, setQaPair] = useState<{question: string, answer: string}>({
    question: "",
    answer: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && dialog.length > 0 && newestSessionRef.current) {
      setTimeout(() => {
        newestSessionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [dialog, isLoading]);

  const toggleMessageSelection = (message: DialogMessage) => {
    if (message.type === 'launch' || message.type === 'end') return;

    const alreadySelected = selectedMessages.some(
      (msg) => msg === message
    );

    if (alreadySelected) {
      setSelectedMessages(selectedMessages.filter((msg) => msg !== message));
    } else {
      if (selectedMessages.length >= 2) {
        setSelectedMessages([...selectedMessages.slice(1), message]);
      } else {
        setSelectedMessages([...selectedMessages, message]);
      }
    }
  };

  const isMessageSelected = (message: DialogMessage) => {
    return selectedMessages.some((msg) => msg === message);
  };

  const clearSelection = () => {
    setSelectedMessages([]);
  };

  const openQASheet = () => {
    if (selectedMessages.length !== 2) return;
    
    const questionMessage = selectedMessages[0].type === 'request' ? selectedMessages[0] : selectedMessages[1];
    const answerMessage = selectedMessages[0].type === 'text' ? selectedMessages[0] : selectedMessages[1];
    
    const question = questionMessage.type === 'request' 
      ? (questionMessage.payload?.payload?.query || questionMessage.payload?.payload?.label || "")
      : "";
      
    const answer = answerMessage.type === 'text'
      ? (answerMessage.payload?.payload?.message || "")
      : "";
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = answer;
    const cleanedAnswer = tempDiv.textContent || tempDiv.innerText || "";
    
    setQaPair({
      question,
      answer: cleanedAnswer
    });
    
    setQaTitle(question.length > 30 ? `${question.substring(0, 30)}...` : question);
    setIsQASheetOpen(true);
  };

  const saveQAPair = async () => {
    if (!user?.organization_id) {
      toast("Ingen organisasjon funnet. Kunne ikke lagre Q&A.");
      return;
    }

    if (!qaTitle.trim() || !qaPair.question.trim() || !qaPair.answer.trim()) {
      toast("Alle felt må fylles ut");
      return;
    }

    setIsSaving(true);

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('voiceflow_api_key, voiceflow_project_id')
        .eq('id', user.organization_id)
        .single();

      if (orgError) throw orgError;
      if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
        throw new Error('Mangler Voiceflow-legitimasjon');
      }

      let formattedTitle = qaTitle.trim();
      if (!formattedTitle.endsWith("- Q&A")) {
        formattedTitle = `${formattedTitle} - Q&A`;
      }

      const response = await fetch(
        `https://api.voiceflow.com/v1/knowledge-base/docs`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': org.voiceflow_api_key
          }
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke sjekke for eksisterende Q&A');
      }

      const result = await response.json();
      const existingQA = result.data.find(
        (doc: any) => doc.data.name === formattedTitle
      );

      const qaItems = [
        {
          question: qaPair.question.trim(),
          answer: qaPair.answer.trim()
        }
      ];

      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          Authorization: org.voiceflow_api_key
        },
        body: JSON.stringify({
          data: {
            schema: { searchableFields: ['question', 'answer'] },
            name: formattedTitle,
            items: qaItems
          }
        })
      };

      const endpoint = `https://api.voiceflow.com/v1/knowledge-base/docs/upload/table?overwrite=${existingQA ? 'true' : 'false'}`;
      
      const saveResponse = await fetch(endpoint, options);

      if (!saveResponse.ok) {
        throw new Error('Kunne ikke lagre Q&A');
      }

      toast.success("Q&A ble lagret til kunnskapsbasen");
      setIsQASheetOpen(false);
      clearSelection();
    } catch (error) {
      console.error('Error saving Q&A:', error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke lagre Q&A");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDialog = filterDialog(dialog);
  const newestSessionIndex = filteredDialog
    .map((msg, index) => msg.type === 'launch' ? index : -1)
    .filter(index => index !== -1)
    .pop();

  const renderMessage = (message: DialogMessage, index: number) => {
    switch (message.type) {
      case 'launch':
        const isNewestSession = index === newestSessionIndex;
        return (
          <div 
            className="flex justify-center my-4"
            ref={isNewestSession ? newestSessionRef : null}
          >
            <div className={`bg-gray-100 rounded-full px-4 py-1 text-xs text-gray-500 ${isNewestSession ? 'bg-primary/10 font-medium' : ''}`}>
              Samtale startet - {message.startTime && formatTime(message.startTime)}
            </div>
          </div>
        );
      case 'end':
        return (
          <div className="flex justify-center my-4">
            <div className="bg-gray-100 rounded-full px-4 py-1 text-xs text-gray-500">
              Samtale avsluttet - {message.startTime && formatTime(message.startTime)}
            </div>
          </div>
        );
      case 'text':
        const messageText = message.payload?.payload?.message;
        if (!messageText) return null;

        const hasIframe = containsIframe(messageText);
        const { cleanText, iframeSrc } = hasIframe 
          ? extractIframeAndCleanText(messageText)
          : { cleanText: messageText, iframeSrc: null };
        
        const formattedText = formatText(cleanText);

        return (
          <div 
            className={`flex flex-col gap-1 my-2 ${isMessageSelected(message) ? 'message-selected' : ''}`} 
            onClick={() => toggleMessageSelection(message)}
          >
            <div className="flex items-end gap-2 max-w-[80%]">
              <div className={`bg-primary text-primary-foreground p-3 rounded-2xl rounded-bl-none transition-all 
                ${isMessageSelected(message) ? 'ring-2 ring-secondary ring-offset-2' : 'hover:ring-1 hover:ring-secondary/50 hover:ring-offset-1'}`}>
                <div className="space-y-2">
                  <div 
                    dangerouslySetInnerHTML={{ __html: formattedText }}
                    className="prose prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0"
                  />
                  {iframeSrc && (
                    <div className="relative w-full pt-[56.25%] mt-4">
                      <iframe
                        src={iframeSrc}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {message.startTime && formatTime(message.startTime)}
            </span>
          </div>
        );
      case 'choice':
        const buttons = message.payload?.payload?.buttons;
        if (!buttons?.length) return null;
        return (
          <div 
            className={`flex flex-col gap-2 my-2 max-w-[80%] ${isMessageSelected(message) ? 'message-selected' : ''}`}
            onClick={() => toggleMessageSelection(message)}
          >
            <div className="flex flex-col gap-2">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  className={`justify-start text-left px-4 py-2 border rounded-md hover:bg-gray-50 transition-all 
                    ${isMessageSelected(message) ? 'ring-2 ring-secondary ring-offset-2' : 'hover:ring-1 hover:ring-secondary/50 hover:ring-offset-1'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMessageSelection(message);
                  }}
                >
                  {button.name}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {message.startTime && formatTime(message.startTime)}
            </span>
          </div>
        );
      case 'request':
        const query = message.payload?.payload?.query;
        const label = message.payload?.payload?.label;
        const userText = query || label;
        if (!userText) return null;
        return (
          <div 
            className={`flex flex-col items-end gap-1 my-2 ${isMessageSelected(message) ? 'message-selected' : ''}`}
            onClick={() => toggleMessageSelection(message)}
          >
            <div className="flex items-end gap-2 max-w-[80%]">
              <div className={`bg-secondary text-secondary-foreground p-3 rounded-2xl rounded-br-none transition-all 
                ${isMessageSelected(message) ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50 hover:ring-offset-1'}`}>
                {userText}
              </div>
            </div>
            <span className="text-xs text-gray-500 mr-2">
              {message.startTime && formatTime(message.startTime)}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-screen relative">
      <ScrollArea 
        className="flex-1"
        ref={dialogContainerRef}
      >
        <div className="p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : !selectedConversation ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Velg en samtale for å se meldinger
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDialog.map((message, index) => (
                <div key={index}>
                  {renderMessage(message, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {selectedMessages.length > 0 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedMessages.length === 1 
              ? "1 melding valgt" 
              : `${selectedMessages.length} meldinger valgt`}
          </span>
          
          {selectedMessages.length === 2 && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-1"
              onClick={openQASheet}
            >
              <MessageSquarePlus size={16} />
              Opprett Q&A
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelection}
          >
            Avbryt
          </Button>
        </div>
      )}

      <Sheet open={isQASheetOpen} onOpenChange={setIsQASheetOpen}>
        <SheetContent className="bg-cream w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-primary">Opprett Q&A sett</SheetTitle>
            <SheetDescription>
              Opprett et nytt spørsmål og svar-par basert på de valgte meldingene.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qa-title">Tittel</Label>
              <Input
                id="qa-title"
                value={qaTitle}
                onChange={(e) => setQaTitle(e.target.value)}
                placeholder="Skriv inn en tittel for Q&A settet"
                className="border-primary/20 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                "- Q&A" vil automatisk legges til på slutten av tittelen.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="qa-question">Spørsmål</Label>
              <Textarea
                id="qa-question"
                value={qaPair.question}
                onChange={(e) => setQaPair({ ...qaPair, question: e.target.value })}
                placeholder="Spørsmål"
                className="min-h-[80px] border-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="qa-answer">Svar</Label>
              <Textarea
                id="qa-answer"
                value={qaPair.answer}
                onChange={(e) => setQaPair({ ...qaPair, answer: e.target.value })}
                placeholder="Svar"
                className="min-h-[150px] border-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsQASheetOpen(false)}
              >
                Avbryt
              </Button>
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={saveQAPair}
                disabled={!qaTitle || !qaPair.question || !qaPair.answer || isSaving}
              >
                {isSaving ? "Lagrer..." : "Lagre Q&A"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
