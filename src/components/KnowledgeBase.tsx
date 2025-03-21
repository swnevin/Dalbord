import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface Props {
    knowledgeBaseId: string;
}
 
const KnowledgeBase = ({ knowledgeBaseId }: Props) => {
    const [isCreating, setIsCreating] = useState(false);
    const onDrop = useCallback(acceptedFiles => {
        acceptedFiles.forEach(async (file) => {
            try {
                const reader = new FileReader();

                reader.onload = async () => {
                    const base64String = reader.result?.toString();

                    if (!base64String) {
                        toast({ variant: "destructive", title: "Error", description: "Failed to convert file to base64" });
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
                        toast({ title: "Success", description: "File uploaded successfully!" });
                    } else {
                        toast({ variant: "destructive", title: "Error", description: "Failed to upload file." });
                    }
                };
                reader.onerror = () => {
                    toast({ variant: "destructive", title: "Error", description: "Failed to read the file." });
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Upload error:", error);
                toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
            }
        })

    }, [knowledgeBaseId])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <div className="flex flex-col gap-4">
            <div {...getRootProps()} className="w-full h-48 p-4 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer">
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p>Drop the files here ...</p> :
                        <p>Drag 'n' drop some files here, or click to select files</p>
                }
            </div>
            <Button onClick={() => setIsCreating(true)}>Create</Button>
        </div>
    )
}

export default KnowledgeBase;
