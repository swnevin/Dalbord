import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const KnowledgeBase = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnpublished, setShowUnpublished] = useState(false);

  const faqSchema = z.object({
    question: z.string().min(3, {
      message: "Spørsmålet må være minst 3 tegn langt.",
    }),
    answer: z.string().min(10, {
      message: "Svaret må være minst 10 tegn langt.",
    }),
    category: z.string().uuid({
      message: "Vennligst velg en gyldig kategori.",
    }),
    is_published: z.boolean().default(false),
  });

  const categorySchema = z.object({
    name: z.string().min(3, {
      message: "Kategorinavnet må være minst 3 tegn langt.",
    }),
  });

  const faqForm = useForm<z.infer<typeof faqSchema>>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "",
      is_published: false,
    },
  });

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  const {
    data: faqsData,
    isLoading: isLoadingFaqs,
    refetch: refetchFaqs,
  } = useQuery({
    queryKey: ["faqs", user?.organization_id, selectedCategory, searchQuery, showUnpublished],
    queryFn: async () => {
      if (!user?.organization_id) return [];

      setIsLoading(true);

      let query = supabase
        .from("faqs")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike("question", `%${searchQuery}%`);
      }

      if (!showUnpublished) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching FAQs:", error);
        toast({
          title: "Error",
          description: "Kunne ikke hente FAQs",
          variant: "destructive",
        });
        return [];
      }

      setIsLoading(false);
      return data;
    },
    enabled: !!user?.organization_id,
  });

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories", user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Kunne ikke hente kategorier",
          variant: "destructive",
        });
        return [];
      }

      return data;
    },
    enabled: !!user?.organization_id,
  });

  useEffect(() => {
    if (faqsData) {
      setFaqs(faqsData);
    }
  }, [faqsData]);

  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData]);

  const onCreateFAQ = async (values: z.infer<typeof faqSchema>) => {
    if (!user?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from("faqs")
        .insert([
          {
            ...values,
            organization_id: user.organization_id,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating FAQ:", error);
        toast({
          title: "Error",
          description: "Kunne ikke opprette FAQ",
          variant: "destructive",
        });
        return;
      }

      faqForm.reset();
      setIsCreateDialogOpen(false);
      refetchFaqs();
      toast({
        title: "Success",
        description: "FAQ opprettet",
      });
    } catch (error) {
      console.error("Error creating FAQ:", error);
      toast({
        title: "Error",
        description: "Kunne ikke opprette FAQ",
        variant: "destructive",
      });
    }
  };

  const onUpdateFAQ = async (values: z.infer<typeof faqSchema>) => {
    if (!user?.organization_id || !selectedFAQ?.id) return;

    try {
      const { data, error } = await supabase
        .from("faqs")
        .update({
          ...values,
          organization_id: user.organization_id,
        })
        .eq("id", selectedFAQ.id)
        .select();

      if (error) {
        console.error("Error updating FAQ:", error);
        toast({
          title: "Error",
          description: "Kunne ikke oppdatere FAQ",
          variant: "destructive",
        });
        return;
      }

      faqForm.reset();
      setIsEditDialogOpen(false);
      refetchFaqs();
      toast({
        title: "Success",
        description: "FAQ oppdatert",
      });
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast({
        title: "Error",
        description: "Kunne ikke oppdatere FAQ",
        variant: "destructive",
      });
    }
  };

  const onDeleteFAQ = async (id: string) => {
    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);

      if (error) {
        console.error("Error deleting FAQ:", error);
        toast({
          title: "Error",
          description: "Kunne ikke slette FAQ",
          variant: "destructive",
        });
        return;
      }

      refetchFaqs();
      toast({
        title: "Success",
        description: "FAQ slettet",
      });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast({
        title: "Error",
        description: "Kunne ikke slette FAQ",
        variant: "destructive",
      });
    }
  };

  const onCreateCategory = async (values: z.infer<typeof categorySchema>) => {
    if (!user?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: values.name,
            organization_id: user.organization_id,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating category:", error);
        toast({
          title: "Error",
          description: "Kunne ikke opprette kategori",
          variant: "destructive",
        });
        return;
      }

      categoryForm.reset();
      refetchCategories();
      toast({
        title: "Success",
        description: "Kategori opprettet",
      });
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Kunne ikke opprette kategori",
        variant: "destructive",
      });
    }
  };

  const onDownloadCSV = async () => {
    if (!user?.organization_id) return;

    try {
      const csvContent = convertArrayToCSV(faqs);
      await handleDownloadTextFile(csvContent, "faqs.csv");
      toast({
        title: "Success",
        description: "CSV-filen er lastet ned",
      });
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({
        title: "Error",
        description: "Kunne ikke laste ned CSV-filen",
        variant: "destructive",
      });
    }
  };

  const convertArrayToCSV = (data: FAQ[]) => {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header as keyof FAQ];
        return `"${value}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  };

  const getBlobUrl = async (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  };

  const handleDownloadTextFile = async (content: string, filename: string) => {
    try {
      const blobUrl = await getBlobUrl(content, filename);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Kunne ikke laste ned filen",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (faq: FAQ) => {
    setSelectedFAQ(faq);
    faqForm.setValue("question", faq.question);
    faqForm.setValue("answer", faq.answer);
    faqForm.setValue("category", faq.category);
    faqForm.setValue("is_published", faq.is_published);
    setIsEditDialogOpen(true);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleShowUnpublishedChange = (value: boolean) => {
    setShowUnpublished(value);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-montserrat">
            Kunnskapsbase
          </CardTitle>
          <CardDescription>
            Administrer ofte stilte spørsmål og svar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Søk i spørsmål..."
                onChange={handleSearchChange}
              />
              <Select onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer etter kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Alle kategorier</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-1">
                <Label htmlFor="showUnpublished">Vis upubliserte</Label>
                <Checkbox
                  id="showUnpublished"
                  checked={showUnpublished}
                  onCheckedChange={handleShowUnpublishedChange}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Opprett kategori</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Opprett kategori</DialogTitle>
                    <DialogDescription>
                      Opprett en ny kategori for å organisere FAQs.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form
                      onSubmit={categoryForm.handleSubmit(onCreateCategory)}
                      className="grid gap-4"
                    >
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Navn</FormLabel>
                            <FormControl>
                              <Input placeholder="Kategorinavn" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Opprett</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Opprett FAQ</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Opprett FAQ</DialogTitle>
                    <DialogDescription>
                      Opprett et nytt spørsmål og svar.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...faqForm}>
                    <form
                      onSubmit={faqForm.handleSubmit(onCreateFAQ)}
                      className="grid gap-4"
                    >
                      <FormField
                        control={faqForm.control}
                        name="question"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spørsmål</FormLabel>
                            <FormControl>
                              <Input placeholder="Spørsmål" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={faqForm.control}
                        name="answer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Svar</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Svar" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={faqForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Velg en kategori" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={faqForm.control}
                        name="is_published"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <div className="space-y-0.5">
                              <FormLabel>Publisert</FormLabel>
                              <FormDescription>
                                Skal denne FAQen være synlig for brukere?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Opprett</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button onClick={onDownloadCSV}>Last ned CSV</Button>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader size="sm" text="Laster FAQs..." />
              </div>
            ) : (
              <Table>
                <TableCaption>
                  En liste over dine FAQs.
                </TableCaption>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Spørsmål</TableHeadCell>
                    <TableHeadCell>Svar</TableHeadCell>
                    <TableHeadCell>Kategori</TableHeadCell>
                    <TableHeadCell>Publisert</TableHeadCell>
                    <TableHeadCell className="text-right">
                      Handlinger
                    </TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {faqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell>{faq.question}</TableCell>
                      <TableCell>{faq.answer}</TableCell>
                      <TableCell>
                        {
                          categories.find((category) => category.id === faq.category)?.name
                        }
                      </TableCell>
                      <TableCell>
                        {faq.is_published ? "Ja" : "Nei"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(faq)}
                        >
                          Rediger
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteFAQ(faq.id)}
                        >
                          Slett
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rediger FAQ</DialogTitle>
            <DialogDescription>Rediger et eksisterende spørsmål og svar.</DialogDescription>
          </DialogHeader>
          <Form {...faqForm}>
            <form
              onSubmit={faqForm.handleSubmit(onUpdateFAQ)}
              className="grid gap-4"
            >
              <FormField
                control={faqForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spørsmål</FormLabel>
                    <FormControl>
                      <Input placeholder="Spørsmål" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={faqForm.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Svar</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Svar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={faqForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Velg en kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={faqForm.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <div className="space-y-0.5">
                      <FormLabel>Publisert</FormLabel>
                      <FormDescription>
                        Skal denne FAQen være synlig for brukere?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Oppdater</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KnowledgeBase;
