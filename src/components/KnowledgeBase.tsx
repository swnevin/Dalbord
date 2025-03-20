
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

interface Props {
    knowledgeBaseId?: string;
}
 
const KnowledgeBase = ({ knowledgeBaseId = "" }: Props) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasKnowledgeBase, setHasKnowledgeBase] = useState(!!knowledgeBaseId);
    const { user } = useAuth();

    useEffect(() => {
        // Check if knowledge base ID exists
        setHasKnowledgeBase(!!knowledgeBaseId);
    }, [knowledgeBaseId]);

    const createKnowledgeBase = async () => {
        if (!user?.organization_id) {
            toast.error("Bruker ikke tilknyttet organisasjon");
            return;
        }

        try {
            setIsCreating(true);
            
            // Create a new knowledge base
            const response = await fetch('/api/knowledge-base/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ organizationId: user.organization_id }),
            });

            if (!response.ok) {
                throw new Error('Kunne ikke opprette kunnskapsbase');
            }

            const data = await response.json();
            
            // Update the organization with the new knowledge base ID
            const { error } = await supabase
                .from('organizations')
                .update({ knowledge_base_id: data.id })
                .eq('id', user.organization_id);

            if (error) throw error;

            toast.success("Kunnskapsbase opprettet!");
            setHasKnowledgeBase(true);
        } catch (error) {
            console.error("Error creating knowledge base:", error);
            toast.error("Kunne ikke opprette kunnskapsbase");
        } finally {
            setIsCreating(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        if (!knowledgeBaseId) {
            toast.error("Ingen kunnskapsbase å laste opp til");
            return;
        }
        
        setIsLoading(true);
        
        acceptedFiles.forEach(async (file) => {
            try {
                const reader = new FileReader();

                reader.onload = async () => {
                    const base64String = reader.result?.toString();

                    if (!base64String) {
                        toast.error("Feil: Kunne ikke konvertere filen til base64");
                        setIsLoading(false);
                        return;
                    }

                    const byteString = atob(base64String.split(',')[1]);
                    const mimeString = base64String.split(',')[0].split(':')[1].split(';')[0];
                    const buffer = new ArrayBuffer(byteString.length);
                    const intArray = new Uint8Array(buffer);

                    for (let i = 0; i < byteString.length; i++) {
                        intArray[i] = byteString.charCodeAt(i);
                    }

                    const blob = new Blob([buffer], { type: mimeString });
                    const fileName = file.name;
                    const fileObject = new File([blob], fileName, { type: 'application/pdf' });

                    // Now you can use 'fileObject' as a File object
                    console.log("File object:", fileObject);

                    // Example of sending the file to the server
                    const formData = new FormData();
                    formData.append('file', fileObject);
                    formData.append('knowledgeBaseId', knowledgeBaseId);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        toast.success("Filen ble lastet opp!");
                    } else {
                        toast.error("Kunne ikke laste opp filen.");
                    }
                    
                    setIsLoading(false);
                };
                
                reader.onerror = () => {
                    toast.error("Kunne ikke lese filen.");
                    setIsLoading(false);
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("En uventet feil oppstod.");
                setIsLoading(false);
            }
        });
    }, [knowledgeBaseId]);
    
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

    return (
        <div className="flex flex-col gap-4 p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Kunnskapsbase</h1>
            <p className="mb-6 text-gray-600">Last opp dokumenter til din kunnskapsbase for å forbedre chatbotens svar.</p>
            
            {!hasKnowledgeBase ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Opprett kunnskapsbase</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Du har ikke opprettet en kunnskapsbase enda. Opprett en for å begynne å laste opp dokumenter.</p>
                        <Button 
                            onClick={createKnowledgeBase}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Oppretter...
                                </>
                            ) : (
                                "Opprett kunnskapsbase"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div 
                        {...getRootProps()} 
                        className="w-full h-48 p-4 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer"
                    >
                        <input {...getInputProps()} />
                        {isLoading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>Laster opp...</p>
                            </div>
                        ) : isDragActive ? (
                            <p>Slipp filene her ...</p>
                        ) : (
                            <p>Dra filer hit, eller klikk for å velge filer</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default KnowledgeBase;
