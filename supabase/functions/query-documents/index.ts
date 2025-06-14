
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from "https://esm.sh/openai@4.47.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to calculate cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, limit = 5 } = await req.json()
    
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create embedding for the query
    const openai = new OpenAI({ apiKey: openaiApiKey })
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    })
    
    const queryEmbedding = embeddingResponse.data[0].embedding

    // Get all document embeddings for this user
    const { data: embeddings, error: embeddingError } = await supabaseClient
      .from('document_embeddings')
      .select(`
        *,
        learning_resources!inner(title, metadata)
      `)
      .eq('user_id', user.id)

    if (embeddingError) {
      console.error('Error fetching embeddings:', embeddingError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch document embeddings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!embeddings || embeddings.length === 0) {
      return new Response(
        JSON.stringify({ 
          results: [],
          message: 'No documents found in your knowledge base. Upload some documents first!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate similarity scores
    const similarities = embeddings.map(embedding => {
      const similarity = cosineSimilarity(queryEmbedding, embedding.embedding_data)
      return {
        ...embedding,
        similarity
      }
    })

    // Sort by similarity and take top results
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(result => result.similarity > 0.7) // Only return relevant results

    // Format results
    const formattedResults = topResults.map(result => ({
      chunk_text: result.chunk_text,
      similarity: result.similarity,
      document_title: result.learning_resources.title,
      metadata: result.metadata,
      chunk_index: result.chunk_index
    }))

    return new Response(
      JSON.stringify({ 
        results: formattedResults,
        total_chunks_searched: embeddings.length,
        query: query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in query-documents function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to query documents' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
