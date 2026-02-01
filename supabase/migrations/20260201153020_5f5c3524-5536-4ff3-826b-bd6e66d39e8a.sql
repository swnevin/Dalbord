-- Create conversation_tags table for storing saved/reviewed tags locally
CREATE TABLE public.conversation_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transcript_id text NOT NULL,
  tag text NOT NULL CHECK (tag IN ('saved', 'reviewed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(organization_id, transcript_id, tag)
);

-- Enable Row Level Security
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tags for their organization
CREATE POLICY "Users can view their organization's tags"
  ON public.conversation_tags
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = conversation_tags.organization_id
  ));

-- Policy: Users can insert tags for their organization
CREATE POLICY "Users can insert tags for their organization"
  ON public.conversation_tags
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = conversation_tags.organization_id
  ));

-- Policy: Users can delete tags for their organization
CREATE POLICY "Users can delete tags for their organization"
  ON public.conversation_tags
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = conversation_tags.organization_id
  ));

-- Create index for faster lookups
CREATE INDEX idx_conversation_tags_org_transcript 
  ON public.conversation_tags(organization_id, transcript_id);