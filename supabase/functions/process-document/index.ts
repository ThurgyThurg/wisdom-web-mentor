
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from "https://esm.sh/openai@4.47.1";
import pdf from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// A simple text splitter function to break down large documents
const splitTextIntoChunks = (text: string, maxChunkSize = 2000) => {
  const finalChunks: string[] = [];
  
  if (!text) {
    return finalChunks;
  }

  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkSize) {
      // If a paragraph is too long, split it by sentences.
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      let currentChunk = "";
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize) {
          finalChunks.push(currentChunk);
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      if (currentChunk) finalChunks.push(currentChunk);
    } else {
      finalChunks.push(paragraph);
    }
  }

  return finalChunks.filter(c => c.trim().length > 0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resourceId } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Unauthorized access attempt in process-document');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    
    const { data: resource, error: resourceError } = await supabaseClient
      .from('learning_resources')
      .select('file_path, metadata')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource || !resource.file_path) {
      console.error('Resource not found or file_path missing:', resourceError);
      return new Response(JSON.stringify({ error: 'Resource not found or is missing a file path.' }), { status: 404, headers: corsHeaders });
    }

    const { file_path: filePath, metadata } = resource;
    const fileType = metadata?.file_type;
    const fileName = filePath.split('/').pop() || 'unknown file';

    const { data: fileBlob, error: downloadError } = await supabaseClient.storage
      .from('learning_resources')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file from storage:', downloadError);
      return new Response(JSON.stringify({ error: `Failed to download file: ${downloadError.message}` }), { status: 500, headers: corsHeaders });
    }

    let text = '';
    const fileBuffer = await fileBlob.arrayBuffer();
    console.log(`Processing file: ${fileName}, type: ${fileType}`);

    if (fileType === 'application/pdf') {
      const data = await pdf(new Uint8Array(fileBuffer));
      text = data.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // DOCX
      console.warn('DOCX processing is currently not supported in this environment');
      return new Response(JSON.stringify({ 
        message: 'DOCX processing is currently not supported. Please convert your document to PDF or TXT format and upload again.' 
      }), { status: 415, headers: corsHeaders });
    } else if (fileType && fileType.startsWith('text/')) { // TXT
      text = new TextDecoder().decode(fileBuffer);
    } else {
      console.warn(`Unsupported file type for processing: ${fileType}`);
      return new Response(JSON.stringify({ message: `File type '${fileType}' is not supported for AI processing.` }), { status: 415, headers: corsHeaders });
    }

    if (!text || text.trim().length === 0) {
      console.log('No text content found in document:', fileName);
      return new Response(JSON.stringify({ message: 'No text content could be extracted from the document.' }), { status: 200, headers: corsHeaders });
    }
    
    const chunks = splitTextIntoChunks(text);
    console.log(`Split document into ${chunks.length} chunks.`);

    if (chunks.length === 0) {
      return new Response(JSON.stringify({ message: 'Document processed, but no text chunks were generated.' }), { status: 200, headers: corsHeaders });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not set in environment variables.');
      return new Response(JSON.stringify({ error: 'OpenAI API key is not configured.' }), { status: 500, headers: corsHeaders });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const embeddingsResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const embeddings = embeddingsResponse.data;

    const rowsToInsert = embeddings.map((embeddingObj, i) => ({
      user_id: user.id,
      resource_id: resourceId,
      chunk_text: chunks[i],
      embedding_data: embeddingObj.embedding,
      chunk_index: i,
      metadata: { fileName, fileType, chunkLength: chunks[i].length }
    }));
    
    await supabaseClient.from('document_embeddings').delete().eq('resource_id', resourceId);

    const { error: insertError } = await supabaseClient
      .from('document_embeddings')
      .insert(rowsToInsert);

    if (insertError) {
      console.error('Error inserting embeddings:', insertError);
      return new Response(JSON.stringify({ error: `Failed to store document knowledge: ${insertError.message}` }), { status: 500, headers: corsHeaders });
    }

    console.log(`Successfully created ${rowsToInsert.length} embeddings for resource ${resourceId}.`);

    return new Response(JSON.stringify({ 
      message: 'Document processed successfully and knowledge base updated.',
      chunksCreated: rowsToInsert.length 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred while processing the document.' }), { status: 500, headers: corsHeaders });
  }
});
