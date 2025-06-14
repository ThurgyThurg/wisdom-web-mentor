
-- Enable the vector extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Delete any existing dummy data
DELETE FROM public.document_embeddings;

-- Drop the old column to avoid casting issues
ALTER TABLE public.document_embeddings DROP COLUMN IF EXISTS embedding_data;

-- Add the new column with the correct vector type.
-- OpenAI's text-embedding-3-small model produces 1536-dimension vectors.
ALTER TABLE public.document_embeddings ADD COLUMN embedding_data vector(1536);
