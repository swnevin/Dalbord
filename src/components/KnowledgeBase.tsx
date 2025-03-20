
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Props {
    knowledgeBaseId?: string; // Make this prop optional by adding the ? mark
}
 
const KnowledgeBase = ({ knowledgeBaseId = "" }: Props) => {
    const [isCreating, setIsCreating] = useState(false);
    const onDrop = useCallback(acceptedFiles => {
        acceptedFiles.forEach(async (file) => {
            try {
                const reader = new FileReader();

                reader.onload = async () => {
                    const base64String = reader.result?.toString();

                    if (!base64String) {
                        toast.error("Feil: Kunne ikke konvertere filen til base64");
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
                };
                reader.onerror = () => {
                    toast.error("Kunne ikke lese filen.");
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("En uventet feil oppstod.");
            }
        })

    }, [knowledgeBaseId])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <div className="flex flex-col gap-4 p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Kunnskapsbase</h1>
            <p className="mb-6 text-gray-600">Last opp dokumenter til din kunnskapsbase for å forbedre chatbotens svar.</p>
            
            <div {...getRootProps()} className="w-full h-48 p-4 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer">
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p>Slipp filene her ...</p> :
                        <p>Dra filer hit, eller klikk for å velge filer</p>
                }
            </div>
            <Button onClick={() => setIsCreating(true)}>Opprett</Button>
        </div>
    )
}

export default KnowledgeBase;
