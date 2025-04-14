
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface DialogMessage {
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

interface UseQACreationProps {
  onSuccess?: () => void;
}

export const useQACreation = ({ onSuccess }: UseQACreationProps = {}) => {
  const { user } = useAuth();
  const [selectedMessages, setSelectedMessages] = useState<DialogMessage[]>([]);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const [qaTitle, setQaTitle] = useState("");
  const [qaPair, setQaPair] = useState<{question: string, answer: string}>({
    question: "",
    answer: ""
  });
  const [isSaving, setIsSaving] = useState(false);

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
      toast.error("Ingen organisasjon funnet. Kunne ikke lagre Q&A.");
      return;
    }

    if (!qaTitle.trim() || !qaPair.question.trim() || !qaPair.answer.trim()) {
      toast.error("Alle felt må fylles ut");
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
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving Q&A:', error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke lagre Q&A");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    selectedMessages,
    isQASheetOpen,
    qaTitle,
    qaPair,
    isSaving,
    isMessageSelected,
    toggleMessageSelection,
    clearSelection,
    openQASheet,
    setIsQASheetOpen,
    setQaTitle,
    setQaPair,
    saveQAPair
  };
};
